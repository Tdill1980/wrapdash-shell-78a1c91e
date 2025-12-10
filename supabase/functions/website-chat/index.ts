import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkCorrections, loadKnowledgeContext } from "../_shared/knowledge-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WRAP_INTENT_KEYWORDS = [
  'wrap', 'quote', 'price', 'cost', 'how much', 'vehicle', 'car', 'truck', 'van',
  'color change', 'ppf', 'protection', 'design', 'custom', 'fleet', 'commercial',
  'install', 'shop', 'appointment', 'schedule'
];

// Regex patterns to extract vehicle info
const VEHICLE_PATTERNS = {
  year: /\b(19|20)\d{2}\b/,
  make: /\b(ford|chevy|chevrolet|dodge|ram|toyota|honda|nissan|gmc|jeep|bmw|audi|mercedes|tesla|volkswagen|vw|subaru|mazda|hyundai|kia|lexus|acura|infiniti|cadillac|buick|lincoln|chrysler|pontiac|saturn|hummer|mini|porsche|jaguar|land rover|volvo|saab|mitsubishi|suzuki)\b/i,
  model: /\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tacoma|tundra|camry|accord|civic|altima|mustang|camaro|challenger|charger|corvette|wrangler|bronco|explorer|expedition|tahoe|suburban|yukon|escalade|navigator|pilot|highlander|4runner|rav4|crv|cr-v|forester|outback|model\s?[3sxy]|cybertruck)\b/i,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org, agent, mode, session_id, message_text, page_url, referrer } = await req.json();

    console.log('[website-chat] Received message:', { org, agent, mode, session_id, message_text: message_text?.substring(0, 50) });

    if (!message_text || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for corrections FIRST (prevents hallucinations)
    const correctionOverride = await checkCorrections(supabase, message_text);
    
    // Load knowledge context for grounding
    const knowledgeContext = await loadKnowledgeContext(supabase, message_text);

    // Extract vehicle info from message
    const lowerMessage = message_text.toLowerCase();
    const extractedVehicle = {
      year: message_text.match(VEHICLE_PATTERNS.year)?.[0] || null,
      make: message_text.match(VEHICLE_PATTERNS.make)?.[0] || null,
      model: message_text.match(VEHICLE_PATTERNS.model)?.[0] || null,
    };
    
    const hasCompleteVehicle = extractedVehicle.year && extractedVehicle.make && extractedVehicle.model;
    console.log('[website-chat] Extracted vehicle:', extractedVehicle, 'Complete:', hasCompleteVehicle);

    // Find or create contact based on session
    let contactId: string | null = null;
    
    // Check if we have an existing conversation for this session
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id, contact_id')
      .eq('metadata->>session_id', session_id)
      .eq('channel', 'website')
      .single();

    let conversationId: string;

    if (existingConvo) {
      conversationId = existingConvo.id;
      contactId = existingConvo.contact_id;
      console.log('[website-chat] Found existing conversation:', conversationId);
    } else {
      // Create anonymous contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: `Website Visitor (${session_id.substring(0, 8)})`,
          source: 'website_chat',
          tags: ['website', 'chat', mode === 'test' ? 'test_mode' : 'live'],
          metadata: {
            session_id,
            first_page: page_url,
            referrer,
            created_via: 'chat_widget'
          }
        })
        .select()
        .single();

      if (contactError) {
        console.error('[website-chat] Contact creation error:', contactError);
      } else {
        contactId = newContact.id;
      }

      // Create conversation
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          subject: 'Website Chat',
          status: 'open',
          priority: 'normal',
          metadata: {
            session_id,
            agent,
            org,
            mode,
            page_url
          }
        })
        .select()
        .single();

      if (convoError) {
        console.error('[website-chat] Conversation creation error:', convoError);
        throw convoError;
      }

      conversationId = newConvo.id;
      console.log('[website-chat] Created new conversation:', conversationId);
    }

    // Insert inbound message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        channel: 'website',
        direction: 'inbound',
        content: message_text,
        sender_name: 'Website Visitor',
        metadata: { page_url, session_id }
      });

    if (msgError) {
      console.error('[website-chat] Message insert error:', msgError);
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        unread_count: 1
      })
      .eq('id', conversationId);

    // Check for wrap intent (hot lead detection)
    const hasWrapIntent = WRAP_INTENT_KEYWORDS.some(kw => lowerMessage.includes(kw));

    if (hasWrapIntent) {
      // Create AI action for hot lead
      await supabase
        .from('ai_actions')
        .insert({
          action_type: 'hot_lead',
          priority: 'high',
          action_payload: {
            source: 'website_chat',
            session_id,
            message: message_text,
            conversation_id: conversationId,
            contact_id: contactId,
            page_url,
            mode
          }
        });

      // Create task for Jackson (test mode)
      if (mode === 'test') {
        await supabase
          .from('tasks')
          .insert({
            title: `[TEST] Hot Lead from Website Chat`,
            description: `Website visitor showing wrap intent:\n\n"${message_text}"\n\nPage: ${page_url}\nSession: ${session_id}`,
            priority: 'high',
            status: 'pending'
          });

        console.log('[website-chat] Created hot lead task (TEST MODE)');
      }
    }

    // Detect intent type
    const intentPatterns = {
      quote_request: ['quote', 'price', 'cost', 'how much', 'pricing', 'estimate'],
      design_request: ['design', 'create', 'custom', 'mockup', 'render', 'visualize'],
      order_status: ['order', 'tracking', 'where is', 'status', 'shipped', 'delivery'],
      product_question: ['material', 'vinyl', 'ppf', 'film', 'brand', 'quality', 'warranty'],
    };

    let detectedIntent = 'general';
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(kw => lowerMessage.includes(kw))) {
        detectedIntent = intent;
        break;
      }
    }

    // If correction override exists, use it directly (no AI generation)
    if (correctionOverride) {
      console.log('[website-chat] Using correction override');
      
      // Insert correction response message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        channel: 'website',
        direction: 'outbound',
        content: correctionOverride,
        sender_name: 'WPW AI TEAM',
        metadata: { ai_generated: true, agent, from_correction: true }
      });

      return new Response(JSON.stringify({ 
        reply: correctionOverride,
        conversation_id: conversationId,
        intent: detectedIntent,
        has_wrap_intent: hasWrapIntent,
        from_correction: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AUTO-QUOTE: If we have complete vehicle info and it's a quote request, generate auto-quote
    let autoQuoteResult = null;
    if (hasCompleteVehicle && (detectedIntent === 'quote_request' || hasWrapIntent)) {
      console.log('[website-chat] Triggering auto-quote for:', extractedVehicle);
      
      try {
        const quoteResponse = await fetch(`${supabaseUrl}/functions/v1/ai-auto-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            vehicleYear: extractedVehicle.year,
            vehicleMake: extractedVehicle.make,
            vehicleModel: extractedVehicle.model,
            customerName: `Website Visitor (${session_id.substring(0, 8)})`,
            conversationId: conversationId,
            autoEmail: false // Don't email anonymous visitors
          })
        });

        if (quoteResponse.ok) {
          autoQuoteResult = await quoteResponse.json();
          console.log('[website-chat] Auto-quote generated:', autoQuoteResult);
        }
      } catch (quoteError) {
        console.error('[website-chat] Auto-quote error:', quoteError);
      }
    }

    // Generate AI response using Lovable AI with intent-specific prompting
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let aiReply = "Thanks for reaching out! Our team will get back to you shortly. In the meantime, feel free to check out our wrap gallery at weprintwraps.com!";

    if (lovableApiKey) {
      try {
        const intentPrompts: Record<string, string> = {
          quote_request: hasCompleteVehicle && autoQuoteResult?.success
            ? `You just generated a quote! Tell them the price: ${autoQuoteResult.quote.formattedPrice} for the ${autoQuoteResult.quote.vehicle}. Ask for their email to send detailed quote.`
            : `The customer wants a quote. Ask for their vehicle YEAR, MAKE, and MODEL if not provided. Be helpful about pricing ranges.`,
          design_request: `The customer wants a design. Ask what style they're looking for (color change, printed graphics, partial wrap, etc).`,
          order_status: `The customer wants order status. Ask for their order number so you can help track it.`,
          product_question: `The customer has a product question. Answer knowledgeably about wrap materials, PPF, and installation.`,
          general: `Answer the customer's general question helpfully.`,
        };

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are "WPW AI TEAM" - the friendly AI assistant for WePrintWraps.com, a professional vehicle wrap printing company.

BRAND VOICE:
- Professional but approachable
- Enthusiastic about vehicle wraps
- Knowledgeable about wrap materials, installation, and design
- Helpful and solution-oriented

INTENT: ${detectedIntent}
${intentPrompts[detectedIntent] || intentPrompts.general}

${autoQuoteResult?.success ? `AUTO-QUOTE GENERATED: ${autoQuoteResult.quote.formattedPrice} for ${autoQuoteResult.quote.vehicle} (${autoQuoteResult.quote.sqft} sqft)` : ''}

GUIDELINES:
- Keep responses concise (2-3 sentences max)
- Be helpful but don't make specific price promises unless auto-quote was generated
- For quotes, typical ranges: partial wraps $500-1500, full wraps $1500-4000 for materials
- Reference weprintwraps.com for galleries and more info
- Always try to move toward collecting vehicle info for quotes
${knowledgeContext}

${mode === 'test' ? '[TEST MODE - Internal testing only]' : ''}`
              },
              {
                role: 'user',
                content: message_text
              }
            ],
            max_tokens: 200
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.choices?.[0]?.message?.content) {
            aiReply = aiData.choices[0].message.content;
          }
        }
      } catch (aiError) {
        console.error('[website-chat] AI generation error:', aiError);
      }
    }

    // Insert AI response message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        channel: 'website',
        direction: 'outbound',
        content: aiReply,
        sender_name: 'WPW AI TEAM',
        metadata: { ai_generated: true, agent }
      });

    // Send internal notification email (TEST MODE)
    if (mode === 'test' && hasWrapIntent) {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'WrapCommand AI <onboarding@resend.dev>',
              to: ['hello@weprintwraps.com', 'jackson@weprintwraps.com'],
              subject: '[TEST MODE] 🔥 Hot Lead from Website Chat',
              html: `
                <h2>New Website Chat Lead (TEST MODE)</h2>
                <p><strong>NOT SENT TO CUSTOMER</strong></p>
                <hr>
                <p><strong>Message:</strong> ${message_text}</p>
                <p><strong>Page:</strong> ${page_url}</p>
                <p><strong>Session:</strong> ${session_id}</p>
                <p><strong>AI Response:</strong> ${aiReply}</p>
                <hr>
                <p><a href="https://wrapcommandai.com/mightychat">View in MightyChat</a></p>
              `
            })
          });
          console.log('[website-chat] Sent internal notification (TEST MODE)');
        } catch (emailError) {
          console.error('[website-chat] Email notification error:', emailError);
        }
      }
    }

    // Log to message_ingest_log
    await supabase
      .from('message_ingest_log')
      .insert({
        platform: 'website',
        sender_id: session_id,
        message_text,
        intent: detectedIntent,
        processed: true,
        raw_payload: { org, agent, mode, page_url, referrer }
      });

    console.log('[website-chat] Completed processing, reply sent');

    return new Response(JSON.stringify({ 
      reply: aiReply,
      conversation_id: conversationId,
      intent: detectedIntent,
      has_wrap_intent: hasWrapIntent,
      auto_quote: autoQuoteResult?.success ? autoQuoteResult.quote : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[website-chat] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
