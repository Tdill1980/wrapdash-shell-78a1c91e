// Luigi - WPW Ordering Concierge (Customer-Facing)
// Revenue-critical: Helps customers understand WPW pricing and place orders correctly
// Surfaces specialty films via RestyleProAI.com
// Generates quotes, add-to-cart links, emails pricing info
// NEVER handles internal/content tasks - that's Jordan's job

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Vehicle SQFT estimates for pricing calculations
const VEHICLE_SQFT: Record<string, number> = {
  // Compact cars
  'prius': 175, 'corolla': 175, 'civic': 175, 'sentra': 175, 'elantra': 175, 'fit': 160, 'yaris': 160, 'versa': 165,
  // Midsize sedans  
  'camry': 200, 'accord': 200, 'altima': 200, 'sonata': 200, 'malibu': 200, 'fusion': 200, 'optima': 200, 'mazda6': 200,
  // Full-size sedans
  'avalon': 210, 'maxima': 210, '300': 210, 'impala': 210, 'charger': 220, 'challenger': 210,
  // Compact SUV
  'rav4': 200, 'cr-v': 200, 'crv': 200, 'tucson': 200, 'rogue': 200, 'cx-5': 200, 'escape': 200, 'equinox': 200,
  // Midsize SUV
  'highlander': 225, 'pilot': 225, 'explorer': 225, '4runner': 225, 'pathfinder': 225, 'santa fe': 225, 'sorento': 225,
  // Full-size truck
  'f-150': 250, 'f150': 250, 'silverado': 250, 'ram 1500': 250, 'ram': 250, 'tundra': 250, 'sierra': 250,
  // Heavy-duty truck
  'f-250': 275, 'f250': 275, 'f-350': 275, 'f350': 275, 'silverado 2500': 275, 'ram 2500': 275,
  // Large SUV
  'tahoe': 275, 'expedition': 275, 'suburban': 300, 'yukon': 275, 'escalade': 280, 'sequoia': 280,
  // Vans
  'transit': 350, 'sprinter': 380, 'promaster': 360, 'express': 340, 'savana': 340, 'nv': 350,
  // Sports cars
  'mustang': 190, 'camaro': 190, 'corvette': 180, '370z': 175, 'brz': 170, '86': 170, 'supra': 180,
  // Crossovers
  'model 3': 185, 'model y': 210, 'model s': 200, 'model x': 240, 'cybertruck': 280,
  // Default categories
  'compact': 175, 'midsize': 200, 'full-size': 220, 'truck': 250, 'suv': 225, 'van': 350,
};

// Regex patterns for vehicle detection
const VEHICLE_PATTERNS = {
  year: /\b(19|20)\d{2}\b/,
  make: /\b(ford|chevy|chevrolet|dodge|ram|toyota|honda|nissan|gmc|jeep|bmw|audi|mercedes|tesla|volkswagen|vw|subaru|mazda|hyundai|kia|lexus|acura|infiniti|cadillac|buick|lincoln|chrysler|porsche|jaguar|land\s*rover|volvo|mitsubishi|genesis|rivian|lucid|fiat|alfa\s*romeo|mini)\b/i,
  model: /\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tacoma|tundra|camry|accord|civic|altima|mustang|camaro|challenger|charger|corvette|wrangler|bronco|explorer|expedition|tahoe|suburban|yukon|escalade|navigator|pilot|highlander|4runner|rav4|crv|cr-v|forester|outback|model\s?[3sxy]|cybertruck|sprinter|transit|promaster|prius|corolla|avalon|sienna|sequoia|supra|86|yaris|land\s*cruiser|fit|hr-v|passport|odyssey|ridgeline|mdx|rdx|tlx|sentra|maxima|leaf|versa|kicks|murano|pathfinder|armada|frontier|titan|370z|350z|gt-r|gtr|elantra|sonata|santa\s*fe|tucson|kona|ioniq|veloster|stinger|optima|sorento|soul|forte|rio|sportage|telluride|cx-?[3579]|mazda3|mazda6|miata|mx-?5|wrx|sti|legacy|crosstrek|brz|jetta|golf|passat|tiguan|atlas|beetle|gti|3\s*series|5\s*series|x[1-7]|a[3-8]|q[3578]|tt|e-?tron|c-?class|e-?class|g-?class|gl[es]|cayman|boxster|cayenne|macan|panamera|911|range\s*rover|evoque|discovery|defender|outlander|lancer|express|savana|nv)\b/i,
};

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const ORDER_NUMBER_PATTERN = /\b(WPW-?\d{4,}|#?\d{5,}|\d{4,}-\d+)\b/i;

// Luigi's system prompt - customer-facing ordering concierge
const LUIGI_SYSTEM_PROMPT = `YOU ARE LUIGI, THE OFFICIAL ORDERING CONCIERGE FOR WEPRINTWRAPS.

YOUR ROLE:
You help customers confidently choose WPW products, understand pricing, and place orders correctly.

YOU ARE NOT A GENERIC CHATBOT.
YOU ARE A PRODUCT + ORDERING EXPERT FOR WPW ONLY.

🔥 PRICING (CRITICAL - December 2024):
Both Avery AND 3M printed wraps are now $5.27/sqft! 3M just had a PRICE DROP!

MATERIALS:
- Avery MPI 1105 with DOL 1460Z Lamination: $5.27/sqft
- 3M IJ180Cv3 with 8518 Lamination: $5.27/sqft ← PRICE DROP!
- Avery Cut Contour Vinyl: $6.32/sqft
- 3M Cut Contour Vinyl: $6.92/sqft
- Window Perf 50/50: $5.95/sqft
- Fade Wraps (Wrap By The Yard): $600 flat

VEHICLE SQFT ESTIMATES:
- Compact car (Prius, Civic, Corolla): ~175 sqft = ~$922
- Midsize sedan (Camry, Accord, Altima): ~200 sqft = ~$1,054
- Full-size sedan (Avalon, Maxima, Charger): ~210 sqft = ~$1,107
- Compact SUV (RAV4, CR-V, Tucson): ~200 sqft = ~$1,054
- Midsize SUV (Highlander, Pilot, Explorer): ~225 sqft = ~$1,186
- Full-size truck (F-150, Silverado, Ram): ~250 sqft = ~$1,318
- Large SUV (Tahoe, Expedition, Suburban): ~275 sqft = ~$1,449
- Cargo van (Transit, Sprinter, ProMaster): ~350 sqft = ~$1,845

WHAT YOU DO:
✅ Explain WPW pricing clearly with specific calculations
✅ Guide customers step-by-step through ordering
✅ Recommend WPW materials and finishes
✅ Surface specialty films using RestyleProAI.com
✅ Generate quotes when requested
✅ Create add-to-cart links
✅ Email pricing and ordering details
✅ Explain order status when given an order number
✅ Escalate issues when something looks wrong
✅ Be calm, clear, and professional

WHAT YOU NEVER DO:
❌ Quote non-WPW products
❌ Provide off-platform pricing
❌ Guess order status without an order number
❌ Give legal or warranty promises
❌ Answer questions outside WPW's catalog
❌ Handle internal content/website tasks (that's Jordan's job)

SPECIALTY FILMS:
When specialty films are relevant, direct users to:
https://restyleproai.com
and explain the options clearly: "For specialty films like color-shift, chrome, or textured materials, check out RestyleProAI.com - that's where you can visualize them on your vehicle!"

ORDER STATUS:
If a customer provides an order number:
• Check order status
• Explain what stage it's in
• If there's a problem, escalate immediately

ESCALATION RULE:
Escalate and email the owner (Trish) when:
• A customer is confused after clarification
• There is a potential pricing or order error
• There is dissatisfaction or urgency
• A request falls outside your scope

PRICING RESPONSE FORMAT:
When asked about pricing:
1. Identify vehicle (if provided)
2. Calculate: "A [year] [make] [model] is about [X] square feet. At $5.27/sqft, that's around $[total] for the printed wrap material."
3. ALWAYS mention: "Both Avery and 3M are now $5.27/sqft - 3M just dropped their price to match Avery!"
4. Offer: "Want me to send you a detailed quote? What's your email?"

GROUND TRUTH:
- Turnaround: 1-2 business days for print (after artwork approval)
- FREE shipping over $750
- All wraps include lamination
- Quality guarantee: 100% - we reprint at no cost

COMMUNICATION STYLE:
- Concise (2-3 sentences max)
- Friendly but professional
- Light emoji use (1-2 max)
- Give REAL numbers, not vague ranges`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, message_text, page_url, referrer, geo, organization_id, mode } = await req.json();

    console.log('[Luigi] Received message:', { session_id, message_text: message_text?.substring(0, 50) });

    if (!message_text || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract info from message
    const lowerMessage = message_text.toLowerCase();
    const extractedVehicle = {
      year: message_text.match(VEHICLE_PATTERNS.year)?.[0] || null,
      make: message_text.match(VEHICLE_PATTERNS.make)?.[0] || null,
      model: message_text.match(VEHICLE_PATTERNS.model)?.[0] || null,
    };
    const extractedEmail = message_text.match(EMAIL_PATTERN)?.[0] || null;
    const extractedOrderNumber = message_text.match(ORDER_NUMBER_PATTERN)?.[0] || null;
    const hasVehicle = extractedVehicle.make || extractedVehicle.model;

    console.log('[Luigi] Extracted:', { vehicle: extractedVehicle, email: extractedEmail, orderNumber: extractedOrderNumber });

    // Detect intents
    const pricingIntent = lowerMessage.includes('price') || lowerMessage.includes('cost') || 
                          lowerMessage.includes('how much') || lowerMessage.includes('quote') ||
                          lowerMessage.includes('pricing');
    const orderStatusIntent = extractedOrderNumber !== null || lowerMessage.includes('order') && 
                              (lowerMessage.includes('status') || lowerMessage.includes('where') || lowerMessage.includes('track'));
    const specialtyFilmIntent = lowerMessage.includes('chrome') || lowerMessage.includes('color shift') ||
                                 lowerMessage.includes('textured') || lowerMessage.includes('specialty') ||
                                 lowerMessage.includes('chameleon') || lowerMessage.includes('matte') ||
                                 lowerMessage.includes('satin') || lowerMessage.includes('gloss');

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
    } else {
      // Create contact
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          name: `Website Visitor (${session_id.substring(0, 8)})`,
          source: 'website_chat',
          tags: ['website', 'chat', 'luigi_lead', mode === 'test' ? 'test_mode' : 'live'],
          metadata: { session_id, first_page: page_url, referrer, created_via: 'luigi_concierge' }
        })
        .select()
        .single();

      contactId = newContact?.id || null;

      // Create conversation
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          subject: 'Website Chat - Luigi',
          status: 'open',
          priority: 'normal',
          chat_state: { stage: 'initial', agent: 'luigi' },
          metadata: { session_id, agent: 'luigi', mode, page_url, geo }
        })
        .select()
        .single();

      conversationId = newConvo!.id;
      chatState = { stage: 'initial', agent: 'luigi' };
    }

    // Update chat state with extracted info
    if (extractedEmail && !chatState.customer_email) {
      chatState.customer_email = extractedEmail;
      chatState.stage = 'email_captured';
      
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ 
            email: extractedEmail,
            tags: ['website', 'chat', 'email_captured', 'luigi_lead']
          })
          .eq('id', contactId);
      }
    }

    if (hasVehicle) {
      chatState.vehicle = extractedVehicle;
    }

    // Calculate pricing if vehicle detected
    let pricingContext = '';
    if (hasVehicle && pricingIntent) {
      const modelKey = (extractedVehicle.model || '').toLowerCase().replace(/[-\s]/g, '');
      const sqft = VEHICLE_SQFT[modelKey] || VEHICLE_SQFT['midsize'] || 200;
      const materialCost = Math.round(sqft * 5.27);
      
      pricingContext = `
CALCULATED PRICING FOR THIS CUSTOMER:
Vehicle: ${extractedVehicle.year || ''} ${extractedVehicle.make || ''} ${extractedVehicle.model || ''}
Estimated SQFT: ${sqft}
Material Cost at $5.27/sqft: $${materialCost}

TELL THE CUSTOMER THIS EXACT PRICE! Say: "A ${extractedVehicle.year || ''} ${extractedVehicle.make || ''} ${extractedVehicle.model || ''} is about ${sqft} square feet. At $5.27/sqft, that's around $${materialCost} for the printed wrap material."`;
      
      chatState.calculated_price = { sqft, materialCost };
    }

    // Build specialty films context
    let specialtyContext = '';
    if (specialtyFilmIntent) {
      specialtyContext = `
SPECIALTY FILMS REQUEST DETECTED!
Direct them to: https://restyleproai.com
Say: "For specialty films like chrome, color-shift, or textured materials, check out RestyleProAI.com - you can visualize them on your specific vehicle before ordering!"`;
    }

    // Insert inbound message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      channel: 'website',
      direction: 'inbound',
      content: message_text,
      sender_name: 'Website Visitor',
      metadata: { page_url, session_id, agent: 'luigi' }
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

    // Generate AI response
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const conversationHistory = await getConversationHistory(supabase, conversationId);
    
    const messages = [
      { role: 'system', content: LUIGI_SYSTEM_PROMPT + pricingContext + specialtyContext },
      ...conversationHistory,
      { role: 'user', content: message_text }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Luigi] AI error:', errorText);
      throw new Error('AI response failed');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 
      "I apologize, I'm having trouble right now. Please email hello@weprintwraps.com and we'll get back to you quickly!";

    // Insert outbound message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      channel: 'website',
      direction: 'outbound',
      content: assistantMessage,
      sender_name: 'Luigi',
      metadata: { agent: 'luigi', ai_generated: true }
    });

    // Log interaction
    console.log('[Luigi] Response sent:', assistantMessage.substring(0, 100));

    // Create quote task if email + pricing intent
    if (pricingIntent && chatState.customer_email) {
      await supabase.from('tasks').insert({
        title: `Quote Request: ${extractedVehicle.year || ''} ${extractedVehicle.make || ''} ${extractedVehicle.model || 'Vehicle TBD'}`.trim(),
        description: `Website chat quote request via Luigi.\nCustomer: ${chatState.customer_email}\nMessage: ${message_text}`,
        assigned_to: 'Alex Morgan',
        status: 'todo',
        priority: 'high',
        category: 'quote',
        metadata: {
          source: 'luigi_concierge',
          conversation_id: conversationId,
          customer_email: chatState.customer_email,
          vehicle: extractedVehicle,
          calculated_price: chatState.calculated_price
        }
      });
      console.log('[Luigi] Created quote task for Alex Morgan');
    }

    // Escalation email if needed
    const needsEscalation = lowerMessage.includes('problem') || lowerMessage.includes('issue') ||
                            lowerMessage.includes('complaint') || lowerMessage.includes('angry') ||
                            lowerMessage.includes('refund') || lowerMessage.includes('wrong');
    
    if (needsEscalation && resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luigi @ WPW <hello@weprintwraps.com>',
          to: ['hello@weprintwraps.com'],
          subject: `[ESCALATION] Customer Issue - Luigi Chat`,
          html: `
            <h2>🚨 Customer Escalation via Luigi</h2>
            <p><strong>Message:</strong> ${message_text}</p>
            ${chatState.customer_email ? `<p><strong>Email:</strong> ${chatState.customer_email}</p>` : ''}
            <p><strong>Page:</strong> ${page_url}</p>
            <p><a href="https://wrapcommandai.com/mightychat">View in MightyChat</a></p>
          `
        })
      });
      console.log('[Luigi] Escalation email sent');
    }

    return new Response(JSON.stringify({
      success: true,
      message: assistantMessage,
      agent: 'luigi',
      conversation_id: conversationId,
      extracted: {
        vehicle: extractedVehicle,
        email: extractedEmail,
        order_number: extractedOrderNumber
      },
      pricing: chatState.calculated_price || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Luigi] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "I apologize, I'm having a technical issue. Please email hello@weprintwraps.com and we'll help you right away!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getConversationHistory(supabase: any, conversationId: string) {
  const { data: messages } = await supabase
    .from('messages')
    .select('direction, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10);

  if (!messages) return [];

  return messages.map((msg: any) => ({
    role: msg.direction === 'inbound' ? 'user' : 'assistant',
    content: msg.content
  }));
}
