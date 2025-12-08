import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadTradeDNA, generateBrandVoicePrompt } from "../_shared/tradedna-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestMessagePayload {
  organization_id: string;
  platform: 'instagram' | 'website' | 'email' | 'sms';
  sender_id?: string;
  sender_username?: string;
  sender_email?: string;
  sender_phone?: string;
  message_text: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: IngestMessagePayload = await req.json();
    console.log('[ingest-message] Received:', JSON.stringify(body));

    // 1. Save message to ingest log
    const { data: ingestLog, error: ingestError } = await supabase
      .from('message_ingest_log')
      .insert({
        organization_id: body.organization_id,
        platform: body.platform,
        sender_id: body.sender_id,
        sender_username: body.sender_username,
        message_text: body.message_text,
        raw_payload: body,
        processed: false
      })
      .select()
      .single();

    if (ingestError) {
      console.error('[ingest-message] Ingest log error:', ingestError);
      throw ingestError;
    }
    console.log('[ingest-message] Logged message:', ingestLog.id);

    // 2. Load TradeDNA for workspace
    const tradeDNA = await loadTradeDNA(body.organization_id);
    console.log('[ingest-message] Loaded TradeDNA for:', tradeDNA.business_name);

    // 3. Find or create CRM contact
    let contact = null;
    const contactEmail = body.sender_email || body.metadata?.email;
    const contactPhone = body.sender_phone || body.metadata?.phone;

    if (contactEmail || contactPhone || body.sender_username) {
      // Try to find existing contact
      let query = supabase.from('contacts').select('*');
      
      if (contactEmail) {
        query = query.eq('email', contactEmail);
      } else if (contactPhone) {
        query = query.eq('phone', contactPhone);
      }

      const { data: existingContact } = await query.maybeSingle();

      if (existingContact) {
        contact = existingContact;
        console.log('[ingest-message] Found existing contact:', contact.id);
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            organization_id: body.organization_id,
            name: body.sender_username || body.metadata?.name || 'Unknown',
            email: contactEmail,
            phone: contactPhone,
            source: body.platform,
            metadata: {
              sender_id: body.sender_id,
              sender_username: body.sender_username,
              platform: body.platform
            }
          })
          .select()
          .single();

        if (!contactError) {
          contact = newContact;
          console.log('[ingest-message] Created new contact:', contact.id);

          // Log lead source
          await supabase.from('lead_sources').insert({
            organization_id: body.organization_id,
            contact_id: contact.id,
            source: body.platform,
            metadata: body.metadata
          });
        }
      }
    }

    // 4. Classify intent using AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let intent: { type: string; confidence: number; extractedData: { vehicle?: { year?: string; make?: string; model?: string }; wrapType?: string; budget?: string; urgency?: string } } = { type: 'general', confidence: 0, extractedData: {} };

    if (lovableApiKey) {
      try {
        const brandVoicePrompt = generateBrandVoicePrompt(tradeDNA);
        
        const classifyResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `You are an intent classifier for a vehicle wrap business. Classify the customer message into one of these intents:
- quote: Customer wants pricing, cost, quote for a wrap
- design: Customer wants to see designs, mockups, previews
- support: Customer asking about order status, tracking, issues
- general: General inquiry, greeting, or unclear intent

Also extract any relevant data like vehicle info, wrap type, budget.

Return JSON only:
{
  "type": "quote|design|support|general",
  "confidence": 0.0-1.0,
  "extractedData": {
    "vehicle": { "year": "", "make": "", "model": "" },
    "wrapType": "",
    "budget": "",
    "urgency": ""
  }
}`
              },
              {
                role: 'user',
                content: body.message_text
              }
            ],
            temperature: 0.3
          })
        });

        if (classifyResponse.ok) {
          const classifyData = await classifyResponse.json();
          const content = classifyData.choices?.[0]?.message?.content || '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            intent = JSON.parse(jsonMatch[0]);
            console.log('[ingest-message] Classified intent:', intent.type);
          }
        }
      } catch (aiError) {
        console.error('[ingest-message] AI classification error:', aiError);
      }
    }

    // Update ingest log with intent
    await supabase
      .from('message_ingest_log')
      .update({ intent: intent.type, processed: true })
      .eq('id', ingestLog.id);

    // 5. Generate AI response based on intent
    let aiReply = '';
    let nextAction = 'continue_conversation';

    if (lovableApiKey) {
      try {
        const brandVoicePrompt = generateBrandVoicePrompt(tradeDNA);
        
        const responsePrompts: Record<string, string> = {
          quote: `The customer wants a quote. Ask for their vehicle year/make/model if not provided. Be helpful and move toward creating a quote. Keep response short (1-2 sentences).`,
          design: `The customer is interested in designs. Ask what style they're looking for or offer to show examples. Keep response short.`,
          support: `The customer needs support. Ask for their order number or name to look up their order. Be helpful.`,
          general: `The customer has a general inquiry. Be friendly and helpful, try to understand what they need.`
        };

        const replyResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `${brandVoicePrompt}

${responsePrompts[intent.type] || responsePrompts.general}

Customer message: "${body.message_text}"
Extracted data: ${JSON.stringify(intent.extractedData)}

Respond in the brand's voice. Keep it conversational and short.`
              },
              {
                role: 'user',
                content: 'Generate a reply to the customer.'
              }
            ],
            temperature: 0.7
          })
        });

        if (replyResponse.ok) {
          const replyData = await replyResponse.json();
          aiReply = replyData.choices?.[0]?.message?.content || '';
          console.log('[ingest-message] Generated reply');
        }
      } catch (aiError) {
        console.error('[ingest-message] AI reply error:', aiError);
      }
    }

    // 6. Determine next action based on intent and data
    if (intent.type === 'quote' && intent.extractedData?.vehicle?.make) {
      nextAction = 'create_quote_draft';
      
      // Create AI action suggestion
      await supabase.from('ai_actions').insert({
        organization_id: body.organization_id,
        action_type: 'create_quote',
        action_payload: {
          contact_id: contact?.id,
          intent,
          message: body.message_text,
          suggested_reply: aiReply
        },
        priority: 'high'
      });
    } else if (intent.type === 'quote') {
      nextAction = 'collect_vehicle';
    } else if (intent.type === 'design') {
      nextAction = 'design_flow';
    } else if (intent.type === 'support') {
      nextAction = 'track_order';
    }

    // 7. Create/update conversation in MightyChat
    if (contact) {
      // Find or create conversation
      let { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contact.id)
        .eq('channel', body.platform)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!conversation) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            organization_id: body.organization_id,
            contact_id: contact.id,
            channel: body.platform,
            subject: `${body.platform.toUpperCase()} Conversation`,
            status: 'open',
            priority: intent.type === 'quote' ? 'high' : 'normal'
          })
          .select()
          .single();
        conversation = newConv;
      }

      if (conversation) {
        // Add inbound message
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          channel: body.platform,
          direction: 'inbound',
          content: body.message_text,
          sender_name: body.sender_username,
          sender_email: contactEmail,
          sender_phone: contactPhone
        });

        // Update conversation
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            unread_count: (conversation.unread_count || 0) + 1,
            priority: intent.type === 'quote' ? 'high' : conversation.priority
          })
          .eq('id', conversation.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ingest_id: ingestLog.id,
      contact_id: contact?.id,
      intent,
      reply: aiReply,
      next_action: nextAction
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[ingest-message] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});