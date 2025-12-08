import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // 1. Log raw message
    const { error: logError } = await supabase.from("message_ingest_log").insert({
      platform: body.platform,
      sender_id: body.sender_id,
      sender_username: body.sender_username,
      message_text: body.message_text,
      raw_payload: body,
    });

    if (logError) console.error("Log insert error:", logError);

    // 2. Classify intent via AI
    const classifyPrompt = `Analyze this customer message and return JSON only:
{
  "type": "quote" | "design" | "support" | "general",
  "vehicle": { "year": string | null, "make": string | null, "model": string | null },
  "urgency": "high" | "normal" | "low"
}

Message: "${body.message_text}"`;

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

    let parsed = { type: "general", vehicle: {}, urgency: "normal" };
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

    // 4. Insert inbound message
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "inbound",
        channel: body.platform,
        content: body.message_text,
        sender_name: body.sender_username || body.sender_id,
      });
    }

    // 5. Create ai_action for quote requests
    if (parsed.type === "quote") {
      const { error: actionError } = await supabase.from("ai_actions").insert({
        action_type: "create_quote",
        priority: parsed.urgency,
        action_payload: {
          source: body.platform,
          sender_id: body.sender_id,
          vehicle: parsed.vehicle,
          message: body.message_text,
        },
      });
      if (actionError) console.error("AI action error:", actionError);
      console.log("📝 Quote request created in ai_actions");
    }

    // 6. Generate AI reply
    const replyPrompt = `You are WrapCommandAI, a friendly wrap shop assistant.
Rules:
- Keep replies under 30 words
- If they want a quote, ask for vehicle YEAR, MAKE, MODEL
- If design inquiry, ask what style they prefer
- If support, ask for order number
- Be helpful and professional`;

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
          { role: "user", content: body.message_text },
        ],
      }),
    });

    const aiData = await aiResp.json();
    const aiReply = aiData.choices?.[0]?.message?.content || "Thanks for reaching out! How can I help you today?";

    console.log("💬 AI Reply:", aiReply);

    // 7. Save outbound message
    if (conversation) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        direction: "outbound",
        channel: body.platform,
        content: aiReply,
      });
    }

    // 8. Send reply back via Instagram
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

    return new Response(JSON.stringify({ reply: aiReply, intent: parsed }), {
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
