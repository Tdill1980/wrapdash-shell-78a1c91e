// Luigi - WrapCommandAI Quote + Email + Retargeting System
// Purpose: Backend sales and quoting system for WePrintWraps.com
// Processes quotes AFTER submission from homepage tool
// Sends confirmation emails, handles retargeting, routes CommercialPro
// NEVER recreates or replaces the quote tool

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

// Jordan Lee - WePrintWraps.com Ordering Concierge
// Capabilities: Answer questions, route bulk to CommercialPro, escalate to Lance/Jackson
const LUIGI_SYSTEM_PROMPT = `You are Jordan Lee, the Ordering Concierge for WePrintWraps.com.

IMPORTANT:
You are NOT a bot.
You do NOT say you are an AI.
You do NOT apologize for being non-human.
You speak like a real, experienced sales and support professional.

Customers are chatting with "Jordan Lee," a real person who helps them order printed vehicle wraps.

━━━━━━━━━━━━━━━━━━━━━━
CORE BUSINESS CONTEXT
━━━━━━━━━━━━━━━━━━━━━━
WePrintWraps.com is a PRINT-ONLY wholesale wrap printer.
We do NOT offer installation.
We print and ship wrap material only.

Production time is typically 1–2 business days after approval.
Free shipping applies on orders over $750.
All orders are covered by the Premium Wrap Guarantee (print quality & color accuracy).

━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE
━━━━━━━━━━━━━━━━━━━━━━
You help customers:
• Understand pricing and how to order
• Use the quote tool correctly
• Find the right product or ordering path
• Get their quote emailed
• Check order or quote status
• Route bulk / fleet / franchise orders correctly
• Escalate issues to the right human when needed

You move conversations forward calmly and confidently.

━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU CAN DO
━━━━━━━━━━━━━━━━━━━━━━
You MAY:
• Ask clarifying questions when needed
• Send a quote email when a customer asks
• Share product URLs or ordering links
• Look up quote or order status (read-only)
• Escalate issues via internal email:
   – Design / artwork / file issues → Lance
   – Bulk, fleet, franchise, volume orders → Jackson

━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU MUST NEVER DO
━━━━━━━━━━━━━━━━━━━━━━
You MUST NOT:
• Say "as an AI" or mention being a bot
• Apologize for not having human feelings
• Offer installation
• Guess pricing or square footage
• Invent discounts
• Over-explain technical details

━━━━━━━━━━━━━━━━━━━━━━
BULK & COMMERCIALPRO RULE
━━━━━━━━━━━━━━━━━━━━━━
If a customer mentions ANY of the following:
• fleet
• multiple vehicles
• franchise
• repeat orders
• volume pricing
• commercial accounts

You should immediately explain that CommercialPro is built for this and recommend it.

Use this link:
https://weprintwraps.com/commercialpro

━━━━━━━━━━━━━━━━━━━━━━
LINKS YOU MAY SHARE
━━━━━━━━━━━━━━━━━━━━━━
Quote Tool:
https://weprintwraps.com

CommercialPro:
https://weprintwraps.com/commercialpro

━━━━━━━━━━━━━━━━━━━━━━
TONE & STYLE
━━━━━━━━━━━━━━━━━━━━━━
• Human
• Confident
• Friendly
• Direct
• Helpful without sounding scripted

You sound like a senior wrap industry sales rep who knows the process and earns trust quickly.

━━━━━━━━━━━━━━━━━━━━━━
PRICING REFERENCE (for general guidance only)
━━━━━━━━━━━━━━━━━━━━━━
- Avery MPI 1105 with DOL 1460Z: $5.27/sqft
- 3M IJ180Cv3 with 8518: $5.27/sqft
- Production Time: 1-2 business days
- FREE shipping over $750
- Premium Wrap Guarantee: 100% reprint at no cost

VEHICLE SQFT ESTIMATES:
- Compact car: ~175 sqft (~$922)
- Midsize sedan: ~200 sqft (~$1,054)
- Full-size truck: ~250 sqft (~$1,318)
- Cargo van: ~350 sqft (~$1,845)`;
// WooCommerce order lookup function
async function fetchWooCommerceOrder(orderNumber: string): Promise<{
  found: boolean;
  orderNumber?: string;
  status?: string;
  customerName?: string;
  items?: string[];
  dateCreated?: string;
  total?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  error?: string;
}> {
  const wooUrl = Deno.env.get('WOO_URL') || 'https://weprintwraps.com';
  const consumerKey = Deno.env.get('WOO_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET');

  if (!consumerKey || !consumerSecret) {
    console.error('[Luigi] WooCommerce credentials not configured');
    return { found: false, error: 'WooCommerce not configured' };
  }

  try {
    // Clean order number - remove # prefix if present
    const cleanOrderNumber = orderNumber.replace(/^#/, '').replace(/^WPW-?/i, '');
    
    // Try searching by order number first
    const searchUrl = `${wooUrl}/wp-json/wc/v3/orders?search=${cleanOrderNumber}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    console.log('[Luigi] Fetching order from WooCommerce:', cleanOrderNumber);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error('[Luigi] WooCommerce API error:', response.status);
      return { found: false, error: `API error: ${response.status}` };
    }

    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      // Try fetching by ID directly
      const directUrl = `${wooUrl}/wp-json/wc/v3/orders/${cleanOrderNumber}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      const directResponse = await fetch(directUrl);
      
      if (directResponse.ok) {
        const order = await directResponse.json();
        return parseWooOrder(order);
      }
      
      return { found: false, error: 'Order not found' };
    }

    // Find exact match or closest match
    const order = orders.find((o: any) => 
      o.number === cleanOrderNumber || 
      o.id.toString() === cleanOrderNumber
    ) || orders[0];

    return parseWooOrder(order);
  } catch (err) {
    console.error('[Luigi] WooCommerce fetch error:', err);
    return { found: false, error: 'Failed to fetch order' };
  }
}

function parseWooOrder(order: any): {
  found: boolean;
  status?: string;
  customerName?: string;
  items?: string[];
  dateCreated?: string;
  total?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  orderNumber?: string;
} {
  if (!order) return { found: false };

  // Map WooCommerce status to friendly status
  const statusMap: Record<string, string> = {
    'pending': 'Pending Payment',
    'processing': 'Processing (Being Prepared)',
    'on-hold': 'On Hold',
    'completed': 'Completed & Shipped',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded',
    'failed': 'Payment Failed',
    'checkout-draft': 'Draft',
    'design-approval': 'Awaiting Design Approval',
    'in-production': 'In Production (Being Printed)',
    'shipped': 'Shipped'
  };

  // Extract line items
  const items = order.line_items?.map((item: any) => {
    let itemDesc = item.name;
    // Check for vehicle info in meta
    const vehicleMeta = item.meta_data?.find((m: any) => 
      m.key?.toLowerCase().includes('vehicle') || 
      m.key?.toLowerCase().includes('year') ||
      m.key?.toLowerCase().includes('make')
    );
    if (vehicleMeta) {
      itemDesc += ` (${vehicleMeta.display_value || vehicleMeta.value})`;
    }
    return itemDesc;
  }) || [];

  // Check for tracking number in order meta or notes
  const trackingMeta = order.meta_data?.find((m: any) => 
    m.key?.toLowerCase().includes('tracking') ||
    m.key?.toLowerCase().includes('shipment')
  );

  return {
    found: true,
    orderNumber: order.number || order.id?.toString(),
    status: statusMap[order.status] || order.status,
    customerName: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
    items,
    dateCreated: order.date_created,
    total: order.total ? `$${order.total}` : undefined,
    shippingMethod: order.shipping_lines?.[0]?.method_title,
    trackingNumber: trackingMeta?.value || undefined
  };
}

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
                          lowerMessage.includes('pricing') || lowerMessage.includes('estimate');
    const orderStatusIntent = extractedOrderNumber !== null || (lowerMessage.includes('order') && 
                              (lowerMessage.includes('status') || lowerMessage.includes('where') || lowerMessage.includes('track')));
    const specialtyFilmIntent = lowerMessage.includes('chrome') || lowerMessage.includes('color shift') ||
                                 lowerMessage.includes('textured') || lowerMessage.includes('specialty') ||
                                 lowerMessage.includes('chameleon') || lowerMessage.includes('matte') ||
                                 lowerMessage.includes('satin') || lowerMessage.includes('gloss');
    
    // ESCALATION DETECTION - Route to Lance or Jackson
    const designIssueIntent = lowerMessage.includes('design') || lowerMessage.includes('file') ||
                              lowerMessage.includes('upload') || lowerMessage.includes('artwork') ||
                              lowerMessage.includes('template') || lowerMessage.includes('dieline') ||
                              lowerMessage.includes('bleed') || lowerMessage.includes('resolution');
    const bulkFleetIntent = lowerMessage.includes('fleet') || lowerMessage.includes('bulk') ||
                            lowerMessage.includes('franchise') || lowerMessage.includes('multiple vehicles') ||
                            lowerMessage.includes('volume') || lowerMessage.includes('repeat order') ||
                            lowerMessage.includes('10 ') || lowerMessage.includes('20 ') ||
                            lowerMessage.includes('wholesale');

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

    // Track when pricing was given to prompt for email
    if (pricingIntent && hasVehicle) {
      chatState.pricing_given_at = new Date().toISOString();
      chatState.pricing_given_count = ((chatState.pricing_given_count as number) || 0) + 1;
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

TELL THE CUSTOMER THIS EXACT PRICE! Say: "A ${extractedVehicle.year || ''} ${extractedVehicle.make || ''} ${extractedVehicle.model || ''} is about ${sqft} square feet. At $5.27/sqft, that's around $${materialCost} for the printed wrap material."

🚨 IMPORTANT: After giving this price, IMMEDIATELY ask for their email to send a detailed quote! Say something like: "Want me to email you a detailed quote with all the specs? What's your email?"`;
      
      chatState.calculated_price = { sqft, materialCost };
    }

    // Build email collection reminder context
    let emailReminderContext = '';
    if (!chatState.customer_email && chatState.pricing_given_at) {
      const pricingCount = (chatState.pricing_given_count as number) || 0;
      if (pricingCount >= 1) {
        emailReminderContext = `

⚠️ URGENT: You've given pricing info but DON'T HAVE THEIR EMAIL YET!
Your response MUST include asking for their email to send a detailed quote.
Example: "By the way, I'd love to email you a detailed quote with all the specs. What's your email address?"`;
      }
    }

    // Build specialty films context
    let specialtyContext = '';
    if (specialtyFilmIntent) {
      specialtyContext = `
SPECIALTY FILMS REQUEST DETECTED!
Direct them to: https://restyleproai.com
Say: "For specialty films like chrome, color-shift, or textured materials, check out RestyleProAI.com - you can visualize them on your specific vehicle before ordering!"`;
    }

    // Build order status context if order number detected
    let orderStatusContext = '';
    if (orderStatusIntent && extractedOrderNumber) {
      console.log('[Luigi] Fetching order status for:', extractedOrderNumber);
      const orderInfo = await fetchWooCommerceOrder(extractedOrderNumber);
      
      if (orderInfo.found) {
        orderStatusContext = `
ORDER STATUS INFORMATION (from WooCommerce):
Order Number: ${orderInfo.orderNumber}
Status: ${orderInfo.status}
Customer: ${orderInfo.customerName}
Total: ${orderInfo.total}
Items: ${orderInfo.items?.join(', ') || 'N/A'}
Date Created: ${orderInfo.dateCreated ? new Date(orderInfo.dateCreated).toLocaleDateString() : 'N/A'}
Shipping Method: ${orderInfo.shippingMethod || 'Standard'}
${orderInfo.trackingNumber ? `Tracking Number: ${orderInfo.trackingNumber}` : ''}

EXPLAIN THIS STATUS TO THE CUSTOMER in a friendly way. If status is "Processing" or "In Production", reassure them the order is being worked on.`;
        
        chatState.last_order_lookup = {
          order_number: extractedOrderNumber,
          status: orderInfo.status,
          looked_up_at: new Date().toISOString()
        };
      } else {
        orderStatusContext = `
ORDER LOOKUP ATTEMPTED for order #${extractedOrderNumber}
Result: Order not found in system.

Tell the customer: "I couldn't find order #${extractedOrderNumber} in our system. Could you double-check the order number? You can find it in your confirmation email. If you're still having trouble, email hello@weprintwraps.com and we'll help you right away!"`;
      }
    } else if (orderStatusIntent && !extractedOrderNumber) {
      orderStatusContext = `
ORDER STATUS REQUESTED but no order number provided.
Ask the customer: "I'd be happy to check your order status! Could you provide your order number? It should be in your confirmation email, usually starting with a # or WPW-."`;
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
    
    const systemPrompt = LUIGI_SYSTEM_PROMPT + pricingContext + emailReminderContext + specialtyContext + orderStatusContext;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message_text }
    ];

    console.log('[Luigi] Calling AI with context:', { 
      hasPricing: !!pricingContext, 
      hasEmailReminder: !!emailReminderContext,
      hasOrderStatus: !!orderStatusContext,
      hasSpecialty: !!specialtyContext 
    });

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

    // Create quote and send email if we have email + vehicle + pricing intent
    if (pricingIntent && chatState.customer_email && hasVehicle) {
      try {
        // Call create-quote-from-chat to generate and email the quote
        const quoteResponse = await fetch(`${supabaseUrl}/functions/v1/create-quote-from-chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            customer_email: chatState.customer_email,
            customer_name: null,
            vehicle_year: extractedVehicle.year,
            vehicle_make: extractedVehicle.make,
            vehicle_model: extractedVehicle.model,
            product_type: 'avery',
            send_email: true
          })
        });

        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          console.log('[Luigi] Quote created and emailed:', quoteData.quote_number);
          chatState.quote_sent = true;
          chatState.quote_number = quoteData.quote_number;
          
          // Update conversation with quote info
          await supabase
            .from('conversations')
            .update({ chat_state: chatState })
            .eq('id', conversationId);
        } else {
          console.error('[Luigi] Failed to create quote:', await quoteResponse.text());
        }
      } catch (quoteErr) {
        console.error('[Luigi] Quote creation error:', quoteErr);
      }
    } else if (pricingIntent && chatState.customer_email && !hasVehicle) {
      // No vehicle yet - create task for manual follow-up
      await supabase.from('tasks').insert({
        title: `Quote Request (Need Vehicle Info): ${chatState.customer_email}`,
        description: `Website chat quote request via Luigi.\nCustomer: ${chatState.customer_email}\nMessage: ${message_text}\n\nNote: Vehicle info not captured yet - follow up to get details.`,
        assigned_to: 'Alex Morgan',
        status: 'todo',
        priority: 'high',
        category: 'quote',
        metadata: {
          source: 'luigi_concierge',
          conversation_id: conversationId,
          customer_email: chatState.customer_email,
          needs_vehicle_info: true
        }
      });
      console.log('[Luigi] Created quote task (needs vehicle info)');
    }

    // ESCALATION EMAIL HANDLERS
    const escalationsSent = (chatState.escalations_sent as string[]) || [];
    
    // Design/File Issues → Email Lance
    if (designIssueIntent && resendKey && !escalationsSent.includes('lance')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luigi @ WPW <hello@weprintwraps.com>',
          to: ['lance@weprintwraps.com'],
          subject: `[DESIGN ISSUE] Customer Needs Help - Luigi Chat`,
          html: `
            <h2>🎨 Design Issue Escalation via Luigi</h2>
            <p><strong>Customer Message:</strong> ${message_text}</p>
            ${chatState.customer_email ? `<p><strong>Customer Email:</strong> ${chatState.customer_email}</p>` : '<p><strong>No email captured yet</strong></p>'}
            <p><strong>Page:</strong> ${page_url}</p>
            <hr>
            <p>Customer has a design/file question. Please follow up.</p>
            <p><a href="https://wrapcommandai.com/mightychat">View Full Conversation</a></p>
          `
        })
      });
      escalationsSent.push('lance');
      chatState.escalations_sent = escalationsSent;
      console.log('[Luigi] Escalation email sent to Lance (design issue)');
    }
    
    // Bulk/Fleet → Email Jackson + Route to CommercialPro
    if (bulkFleetIntent && resendKey && !escalationsSent.includes('jackson')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Luigi @ WPW <hello@weprintwraps.com>',
          to: ['jackson@weprintwraps.com'],
          subject: `[BULK/FLEET LEAD] CommercialPro Opportunity - Luigi Chat`,
          html: `
            <h2>🚚 Bulk/Fleet Lead via Luigi</h2>
            <p><strong>Customer Message:</strong> ${message_text}</p>
            ${chatState.customer_email ? `<p><strong>Customer Email:</strong> ${chatState.customer_email}</p>` : '<p><strong>No email captured yet</strong></p>'}
            <p><strong>Page:</strong> ${page_url}</p>
            <hr>
            <p>Customer mentioned bulk, fleet, franchise, or volume order. Route to CommercialPro.</p>
            <p><a href="https://wrapcommandai.com/mightychat">View Full Conversation</a></p>
          `
        })
      });
      escalationsSent.push('jackson');
      chatState.escalations_sent = escalationsSent;
      console.log('[Luigi] Escalation email sent to Jackson (bulk/fleet)');
    }
    
    // General escalation for complaints/issues
    const needsEscalation = lowerMessage.includes('problem') || lowerMessage.includes('issue') ||
                            lowerMessage.includes('complaint') || lowerMessage.includes('angry') ||
                            lowerMessage.includes('refund') || lowerMessage.includes('wrong');
    
    if (needsEscalation && resendKey && !escalationsSent.includes('general')) {
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
      escalationsSent.push('general');
      chatState.escalations_sent = escalationsSent;
      console.log('[Luigi] General escalation email sent');
    }
    
    // Update chat state with escalations
    await supabase
      .from('conversations')
      .update({ chat_state: chatState })
      .eq('id', conversationId);

    return new Response(JSON.stringify({
      success: true,
      // Back-compat for existing widgets
      reply: assistantMessage,
      // Canonical field
      message: assistantMessage,
      agent: 'luigi',
      conversation_id: conversationId,
      extracted: {
        vehicle: extractedVehicle,
        email: extractedEmail,
        order_number: extractedOrderNumber
      },
      pricing: chatState.calculated_price || null,
      order_status: chatState.last_order_lookup || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Luigi] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      // Back-compat for existing widgets
      reply: "I apologize, I'm having a technical issue. Please email hello@weprintwraps.com and we'll help you right away!",
      // Canonical field
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
