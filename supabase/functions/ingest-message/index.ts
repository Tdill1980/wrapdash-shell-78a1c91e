import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPricingContext, calculateQuickQuote } from "../_shared/wpw-pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json();

    console.log("📥 Ingesting message:", body);

    // Check for file attachments
    const hasFiles = body.attachments?.length > 0;
    const fileUrls = body.attachments || [];

    // 1. Log raw message
    const { error: logError } = await supabase.from("message_ingest_log").insert({
      platform: body.platform,
      sender_id: body.sender_id,
      sender_username: body.sender_username,
      message_text: body.message_text,
      raw_payload: { ...body, has_files: hasFiles, file_count: fileUrls.length },
    });

    if (logError) console.error("Log insert error:", logError);

    // 2. Classify intent AND extract vehicle info via AI
    const classifyPrompt = `Analyze this customer message and return JSON only:
{
  "type": "quote" | "design" | "support" | "file_received" | "general",
  "vehicle": { "year": string | null, "make": string | null, "model": string | null },
  "wrap_type": "full" | "partial" | "color_change" | "fade" | "commercial" | null,
  "urgency": "high" | "normal" | "low",
  "needs_vehicle_info": boolean,
  "has_file_intent": boolean,
  "customer_email": string | null
}

Look for:
- Vehicle year/make/model mentions
- Email addresses
- File sending intent (words like "send", "file", "design", "artwork", "attached")
- Wrap type mentions

Message: "${body.message_text}"
${hasFiles ? `NOTE: Customer also sent ${fileUrls.length} file(s)` : ''}`;

    const classifyRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a message classifier. Return valid JSON only." },
          { role: "user", content: classifyPrompt },
        ],
      }),
    });

    let parsed: any = { 
      type: hasFiles ? "file_received" : "general", 
      vehicle: {}, 
      urgency: "normal", 
      needs_vehicle_info: true, 
      wrap_type: null,
      has_file_intent: hasFiles,
      customer_email: null
    };
    
    try {
      const classifyData = await classifyRes.json();
      const content = classifyData.choices?.[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Classification parse error:", e);
    }

    // Override type if files were received
    if (hasFiles) {
      parsed.type = "file_received";
    }

    console.log("🎯 Classified:", parsed);

    // 3. Find or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("channel", body.platform)
      .ilike("subject", `%${body.sender_id}%`)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          channel: body.platform,
          subject: `${body.platform.toUpperCase()} - ${body.sender_id}`,
          unread_count: 1,
          priority: parsed.urgency === "high" ? "high" : "normal",
          status: "open",
        })
        .select()
        .single();

      if (convError) console.error("Conversation create error:", convError);
      conversation = newConv;
    } else {
      await supabase
        .from("conversations")
        .update({ 
          unread_count: (conversation.unread_count || 0) + 1,
          last_message_at: new Date().toISOString()
        })
        .eq("id", conversation.id);
    }

    // 4. Insert inbound message with file metadata
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "inbound",
        channel: body.platform,
        content: hasFiles ? `${body.message_text || ''} [Sent ${fileUrls.length} file(s)]` : body.message_text,
        sender_name: body.sender_username || body.sender_id,
        metadata: hasFiles ? { attachments: fileUrls, has_files: true } : {}
      });
    }

    // 5. Handle quote requests - AUTO-CREATE REAL QUOTES when vehicle info is available
    let autoQuoteResult: any = null;
    const hasCompleteVehicle = parsed.vehicle?.year && parsed.vehicle?.make && parsed.vehicle?.model;
    
    if (parsed.type === "quote") {
      if (hasCompleteVehicle) {
        // CALL ai-auto-quote to create REAL quote in database
        console.log("🚀 Auto-generating quote for:", parsed.vehicle);
        
        try {
          const autoQuoteResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-auto-quote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_ROLE}`
            },
            body: JSON.stringify({
              vehicleYear: parsed.vehicle.year,
              vehicleMake: parsed.vehicle.make,
              vehicleModel: parsed.vehicle.model,
              customerName: body.sender_username || body.sender_id,
              customerEmail: parsed.customer_email || null,
              productType: parsed.wrap_type === 'color_change' ? 'Full Color Change Wrap' : 
                          parsed.wrap_type === 'commercial' ? 'Commercial Wrap' : 'Full Color Change Wrap',
              conversationId: conversation?.id,
              autoEmail: !!parsed.customer_email // Auto-send email if we have their email
            })
          });
          
          if (autoQuoteResponse.ok) {
            autoQuoteResult = await autoQuoteResponse.json();
            console.log("✅ Auto-quote created:", autoQuoteResult);
          } else {
            const errorText = await autoQuoteResponse.text();
            console.error("❌ Auto-quote failed:", errorText);
          }
        } catch (autoQuoteErr) {
          console.error("❌ Auto-quote error:", autoQuoteErr);
        }
      }
      
      // Also log to ai_actions for MCP visibility
      const { error: actionError } = await supabase.from("ai_actions").insert({
        action_type: "create_quote",
        priority: parsed.urgency,
        resolved: !!autoQuoteResult?.success, // Mark resolved if quote was auto-created
        resolved_at: autoQuoteResult?.success ? new Date().toISOString() : null,
        action_payload: {
          source: body.platform,
          sender_id: body.sender_id,
          vehicle: parsed.vehicle,
          message: body.message_text,
          auto_quote: autoQuoteResult?.success ? {
            quote_id: autoQuoteResult.quote?.id,
            quote_number: autoQuoteResult.quote?.quoteNumber,
            total_price: autoQuoteResult.quote?.totalPrice,
            email_sent: autoQuoteResult.emailSent
          } : null
        },
      });
      if (actionError) console.error("AI action error:", actionError);
      console.log("📝 Quote request logged to ai_actions", autoQuoteResult?.success ? "(AUTO-CREATED)" : "(NEEDS FOLLOW-UP)");
    }

    // 5b. Handle file received - escalate to design team
    if (parsed.type === "file_received" || hasFiles) {
      console.log("📁 File received - escalating to design team");
      
      // Create ai_action for file review
      await supabase.from("ai_actions").insert({
        action_type: "file_review",
        priority: "high",
        action_payload: {
          source: body.platform,
          sender_id: body.sender_id,
          sender_username: body.sender_username,
          file_urls: fileUrls,
          message: body.message_text,
          conversation_id: conversation?.id
        },
      });

      // Email design team about files (if files present)
      if (hasFiles && fileUrls.length > 0) {
        try {
          const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "WPW AI <notifications@resend.dev>",
                to: ["Design@WePrintWraps.com"],
                cc: ["Trish@WePrintWraps.com"],
                subject: `📁 New Files Received via Instagram DM - ${body.sender_username || body.sender_id}`,
                html: `
                  <h2>Customer sent design files!</h2>
                  <p><strong>From:</strong> ${body.sender_username || body.sender_id}</p>
                  <p><strong>Platform:</strong> ${body.platform}</p>
                  <p><strong>Message:</strong> ${body.message_text || 'No message'}</p>
                  <p><strong>Files (${fileUrls.length}):</strong></p>
                  <ul>${fileUrls.map((url: string) => `<li><a href="${url}">${url}</a></li>`).join('')}</ul>
                  <p><em>AI is asking for their email to send a formal quote.</em></p>
                `
              })
            });
            console.log("✅ Design team notified via email");
          }
        } catch (emailErr) {
          console.error("Email notification error:", emailErr);
        }
      }
    }

    // 6. Get official pricing context
    const pricingContext = getPricingContext();

    // 7. Generate AI reply with intent-specific prompts
    const intentPrompts: Record<string, string> = {
      quote: parsed.needs_vehicle_info 
        ? "Ask for their vehicle YEAR, MAKE, and MODEL. Be friendly and quick."
        : autoQuoteResult?.success 
          ? `QUOTE CREATED! Tell them: "Great news! I just generated your quote for the ${parsed.vehicle.year} ${parsed.vehicle.make} ${parsed.vehicle.model} - ${autoQuoteResult.quote?.formattedPrice}! ${autoQuoteResult.emailSent ? 'Check your email for the full breakdown!' : 'Drop your email and I\'ll send the full quote details!'}" Be excited!`
          : "They provided vehicle info but quote failed. Confirm details and ask for their email to send a formal quote.",
      design: "Ask what style they're looking for. Offer to show examples.",
      support: "Ask for their order number so you can help track it.",
      file_received: "Thank them for sending files! Confirm you're forwarding to the design team. Ask for their email so the team can send a quote.",
      general: "Answer their question helpfully. Guide toward getting a quote if appropriate."
    };

    const fileHandlingRules = `
FILE HANDLING RULES (CRITICAL):
- WePrintWraps CAN receive files directly via Instagram DM!
- ALWAYS encourage customers to send their files here
- When they mention files/artwork/designs, say: "Yes! Send it right over - I'll forward it to our design team for a quote!"
- If files need review, mention Jackson or Lance will take a look
- NEVER say "I can't receive files" - that's WRONG
- When files ARE received: "Got it! 👊 Forwarding to Lance and the design team - they'll review and email your quote!"
- Always ask for their email after receiving files so team can follow up`;

    const replyPrompt = `You are WPW AI TEAM - the friendly AI assistant for WePrintWraps.com.

BRAND VOICE:
- High-energy wrap industry pro
- Professional but friendly
- Quick and helpful
- Use emojis sparingly (1-2 max)

INTENT: ${parsed.type}
${intentPrompts[parsed.type] || intentPrompts.general}

${parsed.vehicle?.year ? `Vehicle detected: ${parsed.vehicle.year} ${parsed.vehicle.make} ${parsed.vehicle.model}` : ''}
${parsed.wrap_type ? `Wrap type: ${parsed.wrap_type}` : ''}
${hasFiles ? `FILES RECEIVED: Customer just sent ${fileUrls.length} file(s)! Thank them and confirm forwarding to design team.` : ''}
${parsed.has_file_intent ? `Customer mentioned files/artwork - encourage them to send it!` : ''}

${pricingContext}

${fileHandlingRules}

RULES:
- Keep replies under 40 words
- Use 1-2 emojis max
- Be direct and helpful
- Direct them to weprintwraps.com for instant quotes
- NEVER make up prices - only use the pricing listed above
- When you have vehicle info + sqft, give them the actual price!`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: replyPrompt },
          { role: "user", content: body.message_text || (hasFiles ? "[Customer sent files]" : "") },
        ],
      }),
    });

    const aiData = await aiResp.json();
    const aiReply = aiData.choices?.[0]?.message?.content || "Thanks for reaching out! How can I help you today?";

    console.log("💬 AI Reply:", aiReply);

    // 8. Save outbound message
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "outbound",
        channel: body.platform,
        content: aiReply,
      });
    }

    // 9. Send reply back via Instagram
    if (body.platform === "instagram") {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-instagram-reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({
            recipient: body.sender_id,
            message: aiReply,
          }),
        });
        console.log("✅ Instagram reply sent");
      } catch (replyErr) {
        console.error("Instagram reply error:", replyErr);
      }
    }

    return new Response(JSON.stringify({ reply: aiReply, intent: parsed, auto_quote: autoQuoteResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Ingest error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
