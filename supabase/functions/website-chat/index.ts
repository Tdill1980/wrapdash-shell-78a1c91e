// Website Chat Edge Function - Jordan Lee Agent
// Handles website chat via WePrintWraps chat widget
// Routes all execution through Ops Desk

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadKnowledgeContext, isTopicCovered, getKBSilentResponse } from "../_shared/kb-loader.ts";
import { WPW_TEAM, SILENT_CC, detectEscalation, getEscalationResponse } from "../_shared/wpw-team-config.ts";
import { WPW_CONSTITUTION } from "../_shared/wpw-constitution.ts";
import { AGENTS, formatAgentResponse } from "../_shared/agent-config.ts";
import { routeToOpsDesk, calculateRevenuePriority } from "../_shared/ops-desk-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex patterns to extract vehicle info
const VEHICLE_PATTERNS = {
  year: /\b(19|20)\d{2}\b/,
  make: /\b(ford|chevy|chevrolet|dodge|ram|toyota|honda|nissan|gmc|jeep|bmw|audi|mercedes|tesla|volkswagen|vw|subaru|mazda|hyundai|kia|lexus|acura|infiniti|cadillac|buick|lincoln|chrysler|pontiac|saturn|hummer|mini|porsche|jaguar|land rover|volvo|saab|mitsubishi|suzuki)\b/i,
  model: /\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tacoma|tundra|camry|accord|civic|altima|mustang|camaro|challenger|charger|corvette|wrangler|bronco|explorer|expedition|tahoe|suburban|yukon|escalade|navigator|pilot|highlander|4runner|rav4|crv|cr-v|forester|outback|model\s?[3sxy]|cybertruck|sprinter|transit|promaster)\b/i,
};

// Email extraction pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Partnership/sponsorship signal detection
const PARTNERSHIP_PATTERNS = /\b(collab|sponsor|film|commercial|partner|brand|ambassador|influencer|content creator|media|press|feature)\b/i;

// Jordan Lee's persona - replaces Luigi
const JORDAN_PERSONA = `You are "Jordan Lee" — a friendly website chat specialist at WePrintWraps.com.

YOUR ROLE:
- Educate visitors about wrap options and materials
- Give BALLPARK pricing only (not formal quotes)
- Collect email addresses before detailed pricing
- Identify partnership/sponsorship opportunities
- Route formal quote requests to the quoting team

YOUR TEAM (mention naturally when routing):
- Alex (Quoting Team) - handles formal quotes and pricing
- Grant (Design Team) - handles design questions and file reviews
- Taylor (Partnerships) - handles collabs and sponsorships

PRICING APPROACH (CRITICAL):
1. When customer asks for price WITHOUT email:
   - Give ballpark range ONLY: "Full wraps typically run $1,000-$2,000 depending on vehicle size"
   - Say: "I can give you a rough idea, but we send official pricing by email so nothing gets lost. What's your email?"

2. When customer provides email:
   - Acknowledge and confirm you're routing to quoting team
   - Say: "Perfect — I've got that. Our quoting team will email you a full breakdown shortly."

3. NEVER give exact per-sqft pricing without email capture

ROUTING RULES:
- Quote requests with email → "I'm sending this to our quoting team"
- Partnership/sponsorship signals → "Let me loop in our partnerships team"
- Design/file questions → "I'll get our design team on this"

COMMUNICATION STYLE:
- Friendly and helpful (not salesy)
- Concise (2-3 sentences max)
- Light emoji use (🔥 💪 - 1-2 max)
- Always confirm human follow-up

WPW GROUND TRUTH:
- Turnaround: 1-2 business days for print
- FREE shipping over $750
- All wraps include lamination
- Quality guarantee: 100% - we reprint at no cost

${WPW_CONSTITUTION.humanConfirmation}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org, agent, mode, session_id, message_text, page_url, referrer, geo } = await req.json();

    console.log('[JordanLee] Received message:', { org, session_id, message_text: message_text?.substring(0, 50) });

    if (!message_text || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load knowledge context for grounding (Jordan Lee agent)
    const knowledgeContext = await loadKnowledgeContext(supabase, "jordan_lee", message_text);

    // Extract info from message
    const lowerMessage = message_text.toLowerCase();
    const extractedVehicle = {
      year: message_text.match(VEHICLE_PATTERNS.year)?.[0] || null,
      make: message_text.match(VEHICLE_PATTERNS.make)?.[0] || null,
      model: message_text.match(VEHICLE_PATTERNS.model)?.[0] || null,
    };
    const extractedEmail = message_text.match(EMAIL_PATTERN)?.[0] || null;
    const hasCompleteVehicle = extractedVehicle.year && extractedVehicle.make && extractedVehicle.model;
    
    console.log('[JordanLee] Extracted:', { vehicle: extractedVehicle, email: extractedEmail, complete: hasCompleteVehicle });

    // Detect intent signals
    const pricingIntent = lowerMessage.includes('price') || 
                          lowerMessage.includes('cost') || 
                          lowerMessage.includes('how much') ||
                          lowerMessage.includes('quote');
    const partnershipSignal = PARTNERSHIP_PATTERNS.test(message_text);
    const escalationType = detectEscalation(message_text);
    
    console.log('[JordanLee] Intent:', { pricing: pricingIntent, partnership: partnershipSignal, escalation: escalationType });

    // Find or create conversation
    let contactId: string | null = null;
    let conversationId: string;
    let chatState: Record<string, unknown> = {};

    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id, contact_id, chat_state')
      .eq('metadata->>session_id', session_id)
      .eq('channel', 'website')
      .single();

    if (existingConvo) {
      conversationId = existingConvo.id;
      contactId = existingConvo.contact_id;
      chatState = (existingConvo.chat_state as Record<string, unknown>) || {};
      console.log('[JordanLee] Existing conversation:', conversationId);
    } else {
      // Create anonymous contact
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          name: `Website Visitor (${session_id.substring(0, 8)})`,
          source: 'website_chat',
          tags: ['website', 'chat', mode === 'test' ? 'test_mode' : 'live'],
          metadata: {
            session_id,
            first_page: page_url,
            referrer,
            created_via: 'jordan_lee_chat'
          }
        })
        .select()
        .single();

      contactId = newContact?.id || null;

      // Create conversation with initial state
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          subject: 'Website Chat',
          status: 'open',
          priority: 'normal',
          chat_state: { stage: 'initial', escalations_sent: [] },
          metadata: { session_id, agent: 'jordan_lee', org, mode, page_url, geo: geo || null }
        })
        .select()
        .single();

      if (convoError) throw convoError;
      conversationId = newConvo.id;
      chatState = { stage: 'initial', escalations_sent: [] };
      console.log('[JordanLee] Created conversation:', conversationId);
    }

    // Update chat state with extracted info
    if (extractedEmail && !chatState.customer_email) {
      chatState.customer_email = extractedEmail;
      chatState.stage = 'email_captured';
      
      // Update contact with real email
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ 
            email: extractedEmail,
            tags: ['website', 'chat', 'email_captured', 'jordan_lead'],
            metadata: { 
              email_source: 'jordan_lee_chat_capture',
              email_captured_at: new Date().toISOString()
            }
          })
          .eq('id', contactId);
        console.log('[JordanLee] Captured email:', extractedEmail);
      }
    }

    if (hasCompleteVehicle) {
      chatState.vehicle = extractedVehicle;
    }

    // Insert inbound message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      channel: 'website',
      direction: 'inbound',
      content: message_text,
      sender_name: 'Website Visitor',
      metadata: { page_url, session_id }
    });

    // Update conversation
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        unread_count: 1,
        chat_state: chatState
      })
      .eq('id', conversationId);

    // ============================================
    // OPS DESK ROUTING (New architecture)
    // Jordan NEVER executes directly - routes through Ops Desk
    // ============================================

    // Route quote requests with email to Alex Morgan via Ops Desk
    if (pricingIntent && chatState.customer_email) {
      const revenuePriority = calculateRevenuePriority({
        isCommercial: lowerMessage.includes('fleet') || lowerMessage.includes('business'),
        sqft: hasCompleteVehicle ? 100 : undefined, // Estimate for priority
      });

      await routeToOpsDesk(supabase, {
        action: 'create_task',
        requested_by: 'jordan_lee',
        target: 'alex_morgan',
        context: {
          description: `Website chat quote request: ${extractedVehicle.year || ''} ${extractedVehicle.make || ''} ${extractedVehicle.model || ''}`.trim() || 'Vehicle TBD',
          customer: String(chatState.customer_email),
          revenue_impact: revenuePriority,
          notes: `Message: ${message_text}\nEmail: ${chatState.customer_email}`,
          conversation_id: conversationId,
        },
      });
      console.log('[JordanLee] Routed to Ops Desk → alex_morgan');
    }

    // Route partnership opportunities to Taylor Brooks via Ops Desk
    if (partnershipSignal) {
      await routeToOpsDesk(supabase, {
        action: 'create_task',
        requested_by: 'jordan_lee',
        target: 'taylor_brooks',
        context: {
          description: 'Website chat partnership/sponsorship opportunity',
          customer: String(chatState.customer_email) || `Visitor-${session_id.substring(0, 8)}`,
          revenue_impact: 'high',
          notes: `Original message: ${message_text}`,
          conversation_id: conversationId,
        },
      });
      console.log('[JordanLee] Routed to Ops Desk → taylor_brooks (partnership)');
    }

    // Handle escalation if detected (existing team escalation)
    let escalationSent = false;
    if (escalationType && resendKey) {
      const teamMember = WPW_TEAM[escalationType];
      const escalationsSent = (chatState.escalations_sent as string[]) || [];
      const alreadyEscalated = escalationsSent.includes(escalationType);
      
      if (teamMember && !alreadyEscalated) {
        console.log('[JordanLee] Sending escalation to:', teamMember.email);
        
        const escalationHtml = `
          <h2>🔔 Customer Request via Website Chat</h2>
          <p><strong>Agent:</strong> Jordan Lee (Website Chat)</p>
          <p><strong>Type:</strong> ${teamMember.role}</p>
          <hr>
          <p><strong>Customer Message:</strong></p>
          <blockquote style="background:#f5f5f5;padding:15px;border-left:4px solid #0066cc;">
            ${message_text}
          </blockquote>
          ${chatState.customer_email ? `<p><strong>Customer Email:</strong> ${chatState.customer_email}</p>` : '<p><em>Email not yet captured</em></p>'}
          ${hasCompleteVehicle ? `<p><strong>Vehicle:</strong> ${extractedVehicle.year} ${extractedVehicle.make} ${extractedVehicle.model}</p>` : ''}
          <p><strong>Page:</strong> ${page_url}</p>
          <hr>
          <p><a href="https://wrapcommandai.com/mightychat" style="background:#0066cc;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">View in MightyChat</a></p>
          ${mode === 'test' ? '<p style="color:red;"><strong>[TEST MODE]</strong></p>' : ''}
        `;

        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Jordan @ WPW <onboarding@resend.dev>',
              to: [teamMember.email],
              cc: SILENT_CC,
              subject: `${mode === 'test' ? '[TEST] ' : ''}Customer Request: ${teamMember.role}`,
              html: escalationHtml
            })
          });
          
          escalationSent = true;
          chatState.escalations_sent = [...escalationsSent, escalationType];
          console.log('[JordanLee] Escalation email sent');
        } catch (emailErr) {
          console.error('[JordanLee] Escalation email error:', emailErr);
        }
      }
    }


    // ============================================
    // AI RESPONSE GENERATION
    // Jordan educates and routes - never sends formal quotes
    // ============================================

    // Build context for AI response
    let contextNotes = '';
    
    if (escalationType && escalationSent) {
      contextNotes = `ESCALATION SENT: You just escalated to ${WPW_TEAM[escalationType].name}. Tell the customer you've looped them in.`;
    } else if (pricingIntent && !chatState.customer_email) {
      // Email required before formal pricing
      contextNotes = `STAGE: Customer asked about pricing but no email yet. Give ballpark range and ask for email!`;
    } else if (pricingIntent && chatState.customer_email) {
      contextNotes = `QUOTE ROUTED: You've sent this to our quoting team. Confirm the customer will receive an email with full pricing.`;
    } else if (partnershipSignal) {
      contextNotes = `PARTNERSHIP ROUTED: You've looped in the partnerships team. Tell the customer someone will follow up shortly.`;
    } else if (hasCompleteVehicle && !chatState.customer_email) {
      contextNotes = `STAGE: Customer gave vehicle info but no email. Ask for their email to send the full breakdown!`;
    }

    // Generate AI response using Jordan's persona
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let aiReply = "Hey! Thanks for reaching out. I'm Jordan from the WPW team - how can I help you today? 🔥";

    if (lovableApiKey) {
      try {
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
                content: `${JORDAN_PERSONA}

CURRENT CONTEXT:
${contextNotes}

CONVERSATION STATE:
- Stage: ${chatState.stage || 'initial'}
- Customer Email: ${chatState.customer_email || 'NOT CAPTURED YET'}
- Vehicle: ${chatState.vehicle ? `${(chatState.vehicle as Record<string, string>).year} ${(chatState.vehicle as Record<string, string>).make} ${(chatState.vehicle as Record<string, string>).model}` : 'Not provided'}
- Escalations Sent: ${(chatState.escalations_sent as string[])?.join(', ') || 'None'}

KNOWLEDGE BASE:
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
        console.error('[JordanLee] AI generation error:', aiError);
      }
    }

    // Format response according to Jordan's style
    const jordanAgent = AGENTS.jordan_lee;
    aiReply = formatAgentResponse(jordanAgent, aiReply);

    // Add human confirmation (mandatory per constitution)
    if (!aiReply.includes('reviewed') && !aiReply.includes('team')) {
      aiReply += `\n\n${WPW_CONSTITUTION.humanConfirmation}`;
    }

    // Save final state and insert response
    await supabase
      .from('conversations')
      .update({ chat_state: chatState })
      .eq('id', conversationId);

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      channel: 'website',
      direction: 'outbound',
      content: aiReply,
      sender_name: 'Jordan Lee',
      metadata: { ai_generated: true, agent: 'jordan_lee', escalation: escalationType }
    });

    // Log to message_ingest_log
    await supabase.from('message_ingest_log').insert({
      platform: 'website',
      sender_id: session_id,
      message_text,
      intent: escalationType || (pricingIntent ? 'pricing' : 'general'),
      processed: true,
      raw_payload: { org, agent: 'jordan_lee', mode, page_url, chatState }
    });

    console.log('[JordanLee] Response sent:', aiReply.substring(0, 50));

    return new Response(JSON.stringify({ 
      reply: aiReply,
      conversation_id: conversationId,
      agent: AGENTS.jordan_lee.displayName,
      escalation: escalationType,
      partnership_detected: partnershipSignal,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[JordanLee] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
