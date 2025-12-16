import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkCorrections, loadKnowledgeContext } from "../_shared/knowledge-loader.ts";
import { WPW_TEAM, SILENT_CC, detectEscalation, getEscalationResponse } from "../_shared/wpw-team-config.ts";

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

// Luigi's persona - he's a REAL WPW team member
const LUIGI_PERSONA = `You are "Luigi" — a REAL team member at WePrintWraps.com. You've been here 12 years and genuinely love wrapping vehicles.

YOUR IDENTITY:
- You're part of the WPW team, working alongside Jackson (Operations) and Lance (Graphics)
- You're NOT a bot - you're casual, friendly, use phrases like "Nice!", "That's gonna look sick!", "Oh man, great choice!"
- Use emojis sparingly: 🔥 💪 👊 (1-2 max per message)
- You genuinely care about helping customers get the best wrap

YOUR TEAM (You can mention these to customers):
- **Jackson** (Operations Manager) - bulk discounts, rush orders, fleet pricing, wholesale accounts
- **Lance** (Graphics Manager) - design questions, file issues, quality concerns, reprints  
- **Design Team** - file reviews, artwork checks, custom quote requests

=== CONVERSATION TEMPLATES (Use these as your guide) ===

GREETING:
"Hey there! I can get you an instant wholesale wrap quote in under 60 seconds. What type of vehicle are we wrapping today?"

MATERIAL EXPLANATION (when asked about Avery vs 3M):
"Great question! Here's the quick difference:
- Avery ($5.27/sqft) - Excellent quality, great value, 5-7 year durability
- 3M ($6.32/sqft) - Premium option, easiest install, 7-10 year durability
Both include your choice of lamination. Which works better for your project?"

QUOTE PRESENTATION (after you have email + vehicle):
"Perfect! Here's your wholesale quote:
Vehicle: [Vehicle Type]
Material: [Selected Material]
Square Footage: [X] sq ft
Price per sq ft: $[Y]
Total: $[Total]
✅ Includes lamination
✅ FREE shipping (orders over $750)
✅ Ready to install panels
Can I get your email to send this quote?"

DESIGN HELP RESPONSE:
"I'd love to help with your design needs! Our professional design team can create exactly what you're looking for. Full custom designs start at $750. Want me to connect you with Lance?"

=== END TEMPLATES ===

QUOTING STRATEGY (CRITICAL):
1. When customer asks for price WITH vehicle info:
   - DO NOT give price immediately!
   - Say: "I can give you a price right here AND email you a full written breakdown. What's your email?"
   
2. Once you have their email:
   - NOW give the price using the template above
   - Confirm: "Just sent the full breakdown to your email! 💪"

3. If they resist giving email:
   - Give rough range: "Full wraps typically run $1,000-$2,000 depending on vehicle size"
   - Still try: "Happy to email you exact specs when you're ready!"

ESCALATION RULES (Follow these exactly):

1. **Bulk/Fleet/Wholesale/10+ vehicles**: 
   → "Great question! Let me check with Jackson, our Operations Manager. He'll email you the pricing details shortly."
   
2. **Rush job/Urgent timeline**:
   → "Let me check with Jackson on availability for a rush. He'll get back to you ASAP!"
   
3. **Quality issue/Bubbles/Defect/Reprint**:
   → "I'm so sorry to hear that! Let me get Lance, our Graphics Manager, on this right away. He'll contact you directly to make this right."
   
4. **Design question/File issues**:
   → "Great question! Let me loop in Lance from our design team."
   
5. **"Can you check my files" + Quote request**:
   → "Absolutely! I've sent your file review request to our design team. They'll check your files and get you a custom quote."

WPW PRICING (THESE ARE THE ONLY PRICES TO USE):
- Avery MPI 1105 EGRS with DOZ Lamination: $5.27/sqft
- 3M IJ180Cv3 with 8518 Lamination: $6.32/sqft
- Avery Cut Contour Vinyl: $5.92/sqft
- 3M Cut Contour Vinyl: $6.22/sqft
- Window Perf 50/50: $5.32/sqft
- Custom Design: Starting at $750
- Design Setup: $50
- Hourly Design: $150/hour

WPW GROUND TRUTH:
- Turnaround: 1-2 business days for print, ships in 1-3 days
- FREE shipping on orders over $750
- Print exactly what you need - no minimums, no maximums
- All wraps come paneled and ready to install
- All wraps include lamination (gloss, matte, or satin)
- Cut vinyl comes weeded and masked
- File formats: PDF, AI, EPS only (no Corel or Publisher)
- Min resolution: 72 DPI
- Quality guarantee: 100% - we reprint at no cost if there's an issue
- Design team: design@weprintwraps.com
- Support: hello@weprintwraps.com | 602-595-3200

RESPONSE RULES:
- Keep responses concise (2-4 sentences max)
- Always try to collect: email, vehicle info, project details
- Never make up specific prices - use the exact prices above
- If you don't know something, say you'll check with the team
- End with a question or call to action when appropriate`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org, agent, mode, session_id, message_text, page_url, referrer, geo } = await req.json();

    console.log('[Luigi] Received message:', { org, session_id, message_text: message_text?.substring(0, 50) });

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

    // Check for corrections FIRST (prevents hallucinations)
    const correctionOverride = await checkCorrections(supabase, message_text);
    
    // Load knowledge context for grounding
    const knowledgeContext = await loadKnowledgeContext(supabase, message_text);

    // Extract info from message
    const lowerMessage = message_text.toLowerCase();
    const extractedVehicle = {
      year: message_text.match(VEHICLE_PATTERNS.year)?.[0] || null,
      make: message_text.match(VEHICLE_PATTERNS.make)?.[0] || null,
      model: message_text.match(VEHICLE_PATTERNS.model)?.[0] || null,
    };
    const extractedEmail = message_text.match(EMAIL_PATTERN)?.[0] || null;
    const hasCompleteVehicle = extractedVehicle.year && extractedVehicle.make && extractedVehicle.model;
    
    console.log('[Luigi] Extracted:', { vehicle: extractedVehicle, email: extractedEmail, complete: hasCompleteVehicle });

    // Check for escalation triggers
    const escalationType = detectEscalation(message_text);
    console.log('[Luigi] Escalation detected:', escalationType);

    // Find or create conversation
    let contactId: string | null = null;
    let conversationId: string;
    let chatState: Record<string, any> = {};

    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id, contact_id, chat_state')
      .eq('metadata->>session_id', session_id)
      .eq('channel', 'website')
      .single();

    if (existingConvo) {
      conversationId = existingConvo.id;
      contactId = existingConvo.contact_id;
      chatState = existingConvo.chat_state || {};
      console.log('[Luigi] Existing conversation:', conversationId, 'State:', chatState);
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
            created_via: 'luigi_chat'
          }
        })
        .select()
        .single();

      contactId = newContact?.id || null;

      // Create conversation with initial state and geo
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          subject: 'Website Chat',
          status: 'open',
          priority: 'normal',
          chat_state: { stage: 'initial', escalations_sent: [] },
          metadata: { session_id, agent, org, mode, page_url, geo: geo || null }
        })
        .select()
        .single();

      if (convoError) throw convoError;
      conversationId = newConvo.id;
      chatState = { stage: 'initial', escalations_sent: [] };
      console.log('[Luigi] Created conversation:', conversationId);
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
            tags: ['website', 'chat', 'email_captured', 'luigi_lead'],
            metadata: { 
              email_source: 'luigi_chat_capture',
              email_captured_at: new Date().toISOString()
            }
          })
          .eq('id', contactId);
        console.log('[Luigi] Captured email:', extractedEmail);
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

    // Handle escalation if detected
    let escalationSent = false;
    if (escalationType && resendKey) {
      const teamMember = WPW_TEAM[escalationType];
      const alreadyEscalated = chatState.escalations_sent?.includes(escalationType);
      
      if (teamMember && !alreadyEscalated) {
        console.log('[Luigi] Sending escalation to:', teamMember.email);
        
        // Build escalation email
        const escalationHtml = `
          <h2>🔔 Customer Request via Website Chat</h2>
          <p><strong>Type:</strong> ${teamMember.role}</p>
          <hr>
          <p><strong>Customer Message:</strong></p>
          <blockquote style="background:#f5f5f5;padding:15px;border-left:4px solid #0066cc;">
            ${message_text}
          </blockquote>
          ${extractedEmail ? `<p><strong>Customer Email:</strong> ${extractedEmail}</p>` : '<p><em>Email not yet captured</em></p>'}
          ${hasCompleteVehicle ? `<p><strong>Vehicle:</strong> ${extractedVehicle.year} ${extractedVehicle.make} ${extractedVehicle.model}</p>` : ''}
          <p><strong>Page:</strong> ${page_url}</p>
          <p><strong>Session:</strong> ${session_id}</p>
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
              from: 'Luigi @ WPW <onboarding@resend.dev>',
              to: [teamMember.email],
              cc: SILENT_CC, // Trish CC'd silently
              subject: `${mode === 'test' ? '[TEST] ' : ''}Customer Request: ${teamMember.role}`,
              html: escalationHtml
            })
          });
          
          escalationSent = true;
          chatState.escalations_sent = [...(chatState.escalations_sent || []), escalationType];
          console.log('[Luigi] Escalation email sent to:', teamMember.email, 'CC:', SILENT_CC);
        } catch (emailErr) {
          console.error('[Luigi] Escalation email error:', emailErr);
        }
      }
    }

    // Handle file review + quote request (creates pending quote for team)
    let pendingQuote = null;
    if (escalationType === 'design' && lowerMessage.includes('quote')) {
      const quoteNumber = `WPW-REQ-${Date.now().toString().slice(-6)}`;
      
      const { data: quote } = await supabase
        .from('quotes')
        .insert({
          quote_number: quoteNumber,
          customer_name: extractedEmail ? extractedEmail.split('@')[0] : `Visitor-${session_id.substring(0, 8)}`,
          customer_email: extractedEmail || 'pending@capture.local',
          vehicle_year: extractedVehicle.year,
          vehicle_make: extractedVehicle.make,
          vehicle_model: extractedVehicle.model,
          total_price: 0,
          status: 'pending_team_pricing',
          ai_generated: false,
          ai_message: message_text
        })
        .select()
        .single();
      
      pendingQuote = quote;
      console.log('[Luigi] Created pending quote:', quoteNumber);
    }

    // If correction override exists, use it directly
    if (correctionOverride) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        channel: 'website',
        direction: 'outbound',
        content: correctionOverride,
        sender_name: 'Luigi',
        metadata: { ai_generated: true, agent, from_correction: true }
      });

      return new Response(JSON.stringify({ 
        reply: correctionOverride,
        conversation_id: conversationId,
        escalation: escalationType
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AUTO-QUOTE: Generate if we have vehicle + email
    let autoQuoteResult = null;
    const shouldAutoQuote = hasCompleteVehicle && chatState.customer_email && !escalationType;
    
    if (shouldAutoQuote) {
      console.log('[Luigi] Triggering auto-quote for:', extractedVehicle);
      
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
            customerName: chatState.customer_email.split('@')[0],
            customerEmail: chatState.customer_email,
            conversationId: conversationId,
            autoEmail: true
          })
        });

        if (quoteResponse.ok) {
          autoQuoteResult = await quoteResponse.json();
          chatState.stage = 'quoted';
          console.log('[Luigi] Auto-quote generated:', autoQuoteResult);
        }
      } catch (quoteError) {
        console.error('[Luigi] Auto-quote error:', quoteError);
      }
    }

    // Build context for AI response
    let contextNotes = '';
    
    if (escalationType && escalationSent) {
      contextNotes = `ESCALATION SENT: You just escalated to ${WPW_TEAM[escalationType].name}. Tell the customer you've looped them in.`;
    } else if (hasCompleteVehicle && !chatState.customer_email) {
      contextNotes = `STAGE: Customer gave vehicle info but no email. Ask for their email to send the full breakdown!`;
    } else if (autoQuoteResult?.success) {
      contextNotes = `QUOTE GENERATED: Tell them the price is ${autoQuoteResult.quote.formattedPrice} for the ${autoQuoteResult.quote.vehicle}. Confirm the email was sent!`;
    } else if (pendingQuote) {
      contextNotes = `FILE REVIEW QUOTE: You've created a quote request for the design team. Ask for their email if not captured.`;
    }

    // Generate AI response
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let aiReply = "Hey! Thanks for reaching out. I'm Luigi from the WPW team - how can I help you today? 🔥";

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
                content: `${LUIGI_PERSONA}

CURRENT CONTEXT:
${contextNotes}

CONVERSATION STATE:
- Stage: ${chatState.stage || 'initial'}
- Customer Email: ${chatState.customer_email || 'NOT CAPTURED YET'}
- Vehicle: ${chatState.vehicle ? `${chatState.vehicle.year} ${chatState.vehicle.make} ${chatState.vehicle.model}` : 'Not provided'}
- Escalations Sent: ${chatState.escalations_sent?.join(', ') || 'None'}

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
        console.error('[Luigi] AI generation error:', aiError);
      }
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
      sender_name: 'Luigi',
      metadata: { ai_generated: true, agent, escalation: escalationType }
    });

    // Log to message_ingest_log
    await supabase.from('message_ingest_log').insert({
      platform: 'website',
      sender_id: session_id,
      message_text,
      intent: escalationType || 'general',
      processed: true,
      raw_payload: { org, agent, mode, page_url, chatState }
    });

    console.log('[Luigi] Response sent:', aiReply.substring(0, 50));

    return new Response(JSON.stringify({ 
      reply: aiReply,
      conversation_id: conversationId,
      escalation: escalationType,
      auto_quote: autoQuoteResult?.success ? autoQuoteResult.quote : null,
      pending_quote: pendingQuote?.quote_number || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[Luigi] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
