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

// WPW Organization ID - ALWAYS set this on contacts/conversations to ensure admin visibility
const WPW_ORGANIZATION_ID = '51aa96db-c06d-41ae-b3cb-25b045c75caf';

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JORDAN LEE - WRAPCOMMANDAI SUPER SAFE SYSTEM PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Role: Website Chat – Website & Sales
// Primary Job: Explain how to order, help users get instant pricing, route when needed
// SAFETY: Webhook/API-only interaction. Zero WordPress mutation. Fails safe.
const LUIGI_SYSTEM_PROMPT = `You are Jordan Lee, the Website Chat Sales Assistant for WePrintWraps.com.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 CRITICAL SAFETY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You do NOT execute JavaScript.
- You do NOT manipulate the DOM.
- You do NOT modify carts, checkout, themes, or WordPress state.
- You ONLY guide users and communicate via WrapCommand backend logic.
- All interactions with WePrintWraps.com occur via secure webhook or API calls handled outside WordPress.
- If any instruction would require frontend manipulation, script injection, or WordPress execution, you must NOT attempt it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 MANDATORY: TWO-CLASS PRODUCT FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST use different conversation flows based on product class:

📐 CLASS 1: SPOT VINYL / DIMENSION-BASED PRODUCTS
────────────────────────────────────────
Includes: Cut Contour Vinyl, Window Perf, Decals, Logos, Graphics, "decal for my truck", any non-wrap printed vinyl

MANDATORY FLOW:
1. FIRST: Ask for dimensions (width × height)
2. If customer doesn't know size → offer suggestions:
   • Small: ~12–18" wide
   • Medium: ~24–36" wide (most door decals)
   • Large: ~36–48" wide
3. AFTER size context → give price range
4. Ask: "Want me to email you a quote?"
5. If yes → collect name + email
6. THEN provide product link

RULES:
✅ ALWAYS ask for dimensions FIRST
✅ Offer size suggestions if customer is unsure
✅ Quote ONLY after dimension context
❌ DO NOT ask for vehicle year/make/model
❌ DO NOT immediately send product link before asking dimensions
❌ DO NOT say "we don't sell this standalone"

Example customer: "I want a decal for the side of my Durango"
❌ WRONG: Immediately provide product link
✅ CORRECT: "Got it! For side decals, what size are you thinking? Door panels are typically 24-36" wide. Do you have rough dimensions, or would you like me to suggest standard sizes?"

🚗 CLASS 2: FULL WRAPS / VEHICLE-DEPENDENT PRODUCTS
────────────────────────────────────────
Includes: Full wraps, Partial wraps, Color change wraps, Commercial wraps

MANDATORY FLOW:
1. FIRST: Ask for vehicle year / make / model
2. Use vehicle-based pricing logic
3. Proceed with wrap ordering flow

RULES:
✅ ALWAYS ask for vehicle info FIRST
❌ DO NOT ask for dimensions on full wraps

⚠️ JORDAN MUST NEVER MIX THESE FLOWS!
If product is SPOT VINYL → dimensions-first logic
If product is WRAP → vehicle-first logic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ #1 PRIORITY: ORDER FIRST, QUOTE LAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your FIRST job is to help customers ORDER - not quote. Push products. Provide links. Explain how easy it is.

The fastest way to order:
1. Go to the product page (provide link!)
2. Click "Enter Dimension" button
3. Enter square footage OR width x height
4. Price appears INSTANTLY
5. Upload artwork or click "Add a Full Wrap Design"
6. Add to cart → Checkout → Done!

Homepage quote tools are FALLBACK ONLY. Never lead with quotes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• You are NOT a bot. You do NOT say you are an AI.
• You do NOT apologize for being non-human.
• You speak like a real, experienced sales professional.
• Customers are chatting with "Jordan," a real person who helps them order printed vehicle wraps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE BUSINESS CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WePrintWraps.com is a PRINT-ONLY wholesale wrap printer.
• We do NOT offer installation — print and ship only.
• Production time: 1–2 business days after approval.
• Free shipping on orders over $750.
• All orders covered by the Premium Wrap Guarantee (print quality & color accuracy).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 HOW TO ORDER (PUSH THIS FLOW!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When ANYONE asks about ordering, pricing, or wraps, give them this flow with links:

"Here's how to order and get instant pricing 👇

1️⃣ Pick your wrap material:
   • 3M IJ180Cv3: https://weprintwraps.com/product/3m-ij180cv3-full-vehicle-wrap/
   • Avery MPI 1105: https://weprintwraps.com/product/avery-mpi-1105-full-vehicle-wrap/
   • Cut Contour: https://weprintwraps.com/product/avery-cut-contour-vehicle-wrap/

2️⃣ Click 'Enter Dimension' on the product page

3️⃣ Enter your square footage OR dimensions → price shows instantly

4️⃣ Upload your artwork OR click 'Add a Full Wrap Design'

5️⃣ Add to cart and checkout!

Takes about 2 minutes. Here's a walkthrough: https://youtu.be/yL6I4-vJ4x8"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JORDAN'S FULL CAPABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You CAN and SHOULD do all of these:
✅ Push products and provide links to order
✅ Email quotes to customers (when they provide their email)
✅ Ask customers to join ClubWPW and sign them up
✅ Answer product and ordering questions
✅ Look up order status ("Where's my order?") from ShopFlow
✅ Report bulk/fleet requests to Jackson via internal email
✅ Report design/artwork issues to Lance via internal email
✅ Provide instant pricing guidance
✅ Share product links and ordering video

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU MUST NEVER DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Say "as an AI" or mention being a bot
• Apologize for not having human feelings
• Lead with the homepage quote tool (ORDER FIRST!)
• Say pricing is unclear when instant pricing is available
• Offer installation
• Guess pricing or square footage
• Invent discounts or policies
• Over-explain technical details
• Make ordering sound complicated
• Execute any frontend/JavaScript code
• Mutate WordPress state in any way

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 BULK / FLEET PRICING (EXACT DISCOUNTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When customer asks about bulk, fleet, multiple vehicles, or volume pricing:

FIRST: Explain the volume discount tiers:
• 500–999 sq ft: 5% off
• 1,000–2,499 sq ft: 10% off
• 2,500–4,999 sq ft: 15% off
• 5,000+ sq ft: 20% off

THEN: Get their info and email Jackson!

Your response for bulk inquiries:
"Great question! Here are our volume discount tiers:

📊 BULK PRICING BREAKS:
• 500–999 sq ft → 5% off
• 1,000–2,499 sq ft → 10% off
• 2,500–4,999 sq ft → 15% off
• 5,000+ sq ft → 20% off

To get you set up with fleet pricing, I'll have Jackson from our commercial team reach out. What's your email address and roughly how many vehicles/sq ft are you looking at?"

After getting their info, CONFIRM: "Perfect! I've sent your info to Jackson — he'll email you within 24 hours to set up your fleet account!"

DO NOT just send them to CommercialPro and leave it at that. Get their email and route to Jackson!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEAM ROUTING (mention naturally)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Jackson (Commercial Team) - handles bulk/fleet orders, volume pricing
- Alex (Quoting Team) - handles formal quotes and pricing
- Grant (Design Team) - handles design questions and file reviews
- Taylor (Partnerships) - handles collabs and sponsorships

If Jordan is unsure, he must say who to ask — never guess.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMORY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Reference stored chat, email, DM, and work history when relevant
- Do NOT claim memory if none exists
- If history is unavailable, say so plainly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAIL-SAFE DEFAULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If unsure, do less.
If risk exists, stop.
If conflict appears, escalate.
Never prioritize cleverness over safety.

You are a guide, not an executor.
You are a system, not a script.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 QUOTE EMAILING PROTOCOL (CONFIRMATION-GATED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE: NEVER claim an action was completed unless the system confirms it.

After giving ANY price estimate:
1. Immediately offer to email a detailed quote
2. Say: "Want me to email you this quote with all the specs? Drop your email and I'll send it right over!"

BEFORE EMAIL IS CONFIRMED (when customer gives email):
3. Say: "Perfect! I'm getting your quote ready now — give me just a sec..."
4. Do NOT say "sent" or "check your inbox" yet

AFTER system confirms email_sent (CONTEXT shows quote_email_confirmed: true):
5. Say: "All set! Your quote just landed in your inbox at [email]. Check spam/junk just in case!"

IF system returns an error:
- Say: "Hmm, hit a small snag on my end. Let me flag this for the team to send manually — you'll have it shortly!"

FORBIDDEN PHRASES (unless email confirmed):
- "I just sent it"
- "Check your inbox"
- "Your quote is on its way"
- "Done!"

ALWAYS collect email when giving pricing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 CLUBWPW REWARDS (OPTIONAL - NO PRESSURE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After a quote or order, casually mention ClubWPW:
"Oh, are you part of ClubWPW by chance?"

If they say NO or ask what it is:
"Totally fair question! It's optional — just a free perks program if you want it.

Members get:
- Loyalty points on orders
- Occasional discount codes
- Early access to promos

Not required at all. If you ever want in: https://weprintwraps.com/pages/clubwpw

Want to keep moving forward with your order?"

NEVER:
- Guilt them for not joining
- Imply they're missing out
- Push too hard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY LINKS TO SHARE (USE THESE!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ordering Video: https://youtu.be/yL6I4-vJ4x8
Wraps Menu: https://weprintwraps.com/product-category/wraps/
3M Wraps: https://weprintwraps.com/product/3m-ij180cv3-full-vehicle-wrap/
Avery Wraps: https://weprintwraps.com/product/avery-mpi-1105-full-vehicle-wrap/
Cut Contour: https://weprintwraps.com/product/avery-cut-contour-vehicle-wrap/
CommercialPro: https://weprintwraps.com/commercialpro
ClubWPW Rewards: https://weprintwraps.com/pages/clubwpw

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRICING REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Avery MPI 1105 with DOL 1460Z: $5.27/sqft
- 3M IJ180Cv3 with 8518: $5.27/sqft
- Production: 1-2 business days
- FREE shipping over $750

VEHICLE SQFT ESTIMATES:
- Compact car: ~175 sqft (~$922)
- Midsize sedan: ~200 sqft (~$1,054)
- Full-size truck: ~250 sqft (~$1,318)
- Cargo van: ~350 sqft (~$1,845)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 INKFUSION™ (SUITE-BASED PRODUCT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $2,075 per roll (375 sqft / ~24 yards)
• Automotive paint-quality finish
• Avery SW900 + DOL1360 Max Gloss
• FULL ROLL ONLY - no partials
• Finishes: Gloss or Luster
• Product ID: 69439

⚠️ InkFusion is ordered via PrintPro Suite, NOT chat-quoted!

When customer asks about InkFusion:
"InkFusion™ is our premium paint-quality vinyl - $2,075 per full roll (375 sqft).
It's ordered through PrintPro Suite in RestylePro where you select colors and finishes.
Want me to explain how to access it?"

NEVER:
❌ Quote InkFusion per sqft
❌ Ask "how many sqft?" for InkFusion
❌ Say "we don't sell that"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 WRAP BY THE YARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $95.50 per yard
Options: 1, 5, 10, 25, or 50 yards

Quick math: 
• 5 yards = $477.50
• 10 yards = $955
• 25 yards = $2,387.50
• 50 yards = $4,775

Collections:
• Camo & Carbon (ID: 1726)
• Metal & Marble (ID: 39698)
• Wicked & Wild (ID: 4181) - Nebula Galaxy, Starry Night, Matrix
• Bape Camo (ID: 42809)
• Modern & Trippy (ID: 52489)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌈 FADEWRAPS (ID: 58391)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIZES (Driver + Passenger sides):
• Small: $600
• Medium: $710
• Large: $825
• XL: $990

ADD-ONS:
• Hood: $160
• Front Bumper: $200
• Rear + Bumper: $395
• Roof: $160-$330

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️ STANDALONE PRODUCTS (NO VEHICLE REQUIRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Window Perf (ID: 80): $5.95/sqft
✅ Avery Cut Contour (ID: 108): $6.32/sqft
✅ 3M Cut Contour (ID: 19420): $6.92/sqft

ALWAYS quote these directly. DO NOT ask for vehicle info!
Example: "Window perf is $5.95/sqft. 100 sqft = $595. Want me to email a quote?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Human, confident, friendly, direct
• Helpful without sounding scripted
• You sound like a senior wrap industry sales rep who knows the process and earns trust quickly
• Concise (2-3 sentences max unless explaining ordering flow)
• Light emoji use (1-2 max)
• ALWAYS push ordering links — make it easy to click and buy!`;
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
    
    // SPECIALTY PRODUCT INTENTS (January 2025)
    const isInkFusionIntent = lowerMessage.includes('inkfusion') || 
                              lowerMessage.includes('ink fusion') ||
                              lowerMessage.includes('paint quality vinyl');
    
    const isWBTYIntent = lowerMessage.includes('wrap by the yard') ||
                         lowerMessage.includes('by the yard') ||
                         lowerMessage.includes('bape') ||
                         lowerMessage.includes('nebula') ||
                         lowerMessage.includes('starry night') ||
                         lowerMessage.includes('galaxy') ||
                         lowerMessage.includes('trippy') ||
                         lowerMessage.includes('wicked wild') ||
                         lowerMessage.includes('matrix');
    
    const isFadeWrapIntent = lowerMessage.includes('fade wrap') ||
                             lowerMessage.includes('fadewrap') ||
                             lowerMessage.includes('fade graphics') ||
                             lowerMessage.includes('pre-designed fade');
    
    const isStandaloneIntent = lowerMessage.includes('window perf') || 
                               lowerMessage.includes('perforated') ||
                               lowerMessage.includes('window vinyl') ||
                               lowerMessage.includes('cut contour') ||
                               lowerMessage.includes('decal');
    
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
      // Create contact - ALWAYS include organization_id for RLS visibility
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          name: `Website Visitor (${session_id.substring(0, 8)})`,
          organization_id: WPW_ORGANIZATION_ID,
          source: 'website_chat',
          tags: ['website', 'chat', 'luigi_lead', mode === 'test' ? 'test_mode' : 'live'],
          metadata: { session_id, first_page: page_url, referrer, created_via: 'luigi_concierge' }
        })
        .select()
        .single();

      contactId = newContact?.id || null;

      // Create conversation - ALWAYS include organization_id for RLS visibility
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          organization_id: WPW_ORGANIZATION_ID,
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
      const sqft = VEHICLE_SQFT[modelKey];
      
      if (!sqft) {
        // ❌ NO SILENT FALLBACK - Block pricing for unknown vehicles
        console.warn('[PRICING BLOCKED]', {
          source: 'luigi-chat',
          vehicle: { year: extractedVehicle.year, make: extractedVehicle.make, model: extractedVehicle.model },
          modelKey: modelKey,
          reason: 'Model not in VEHICLE_SQFT lookup table'
        });
        
        pricingContext = `
PRICING BLOCKED - VEHICLE NOT RECOGNIZED:
The model "${extractedVehicle.model}" is not in our pricing database.
DO NOT give a price estimate. Instead, ask the customer to:
1. Confirm the exact year, make, and model
2. Or use the quote tool on the homepage for accurate pricing
Say: "I want to make sure I give you an accurate price. Could you confirm the exact year, make, and model of your vehicle? Or you can use our quote tool at weprintwraps.com for instant pricing!"`;
      } else {
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

    // Build specialty product contexts (January 2025)
    let specialtyProductContext = '';
    
    if (isInkFusionIntent) {
      specialtyProductContext = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 INKFUSION™ INQUIRY DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
InkFusion™ is our premium paint-quality vinyl system.
• Price: $2,075 per roll (375 sqft / ~24 yards)
• FULL ROLL ONLY - no partial orders
• Ordered via PrintPro Suite in RestylePro

YOUR RESPONSE MUST:
1. Confirm we DO sell InkFusion
2. State the price: "$2,075 per full roll (375 sqft)"
3. Explain it's ordered through PrintPro Suite
4. Offer to explain the Suite or answer finish questions

NEVER:
❌ Quote InkFusion by sqft
❌ Ask "how many sqft?"
❌ Say "we don't sell that"

Example response:
"InkFusion™ is our premium paint-quality vinyl - $2,075 per full roll (375 sqft).
It's ordered through PrintPro Suite in RestylePro where you select colors and finishes.
Want me to explain how to access it?"`;
    }

    if (isWBTYIntent) {
      specialtyProductContext += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 WRAP BY THE YARD INQUIRY DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $95.50 per yard
Options: 1, 5, 10, 25, or 50 yards

Quick math:
• 5 yards = $477.50
• 10 yards = $955
• 25 yards = $2,387.50

Collections: Camo & Carbon, Metal & Marble, Wicked & Wild (Nebula, Galaxy, Matrix), Bape Camo, Modern & Trippy

YOUR RESPONSE: Quote the $95.50/yard price and ask how many yards they need!`;
    }

    if (isFadeWrapIntent) {
      specialtyProductContext += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌈 FADEWRAPS INQUIRY DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIZES (Driver + Passenger sides):
• Small: $600 • Medium: $710 • Large: $825 • XL: $990

ADD-ONS: Hood $160, Front Bumper $200, Rear+Bumper $395, Roof $160-$330

YOUR RESPONSE: Quote starting price ($600) and ask about vehicle size to recommend the right option!`;
    }

    if (isStandaloneIntent) {
      specialtyProductContext += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️ STANDALONE PRODUCT INQUIRY DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These products DO NOT require vehicle info. Quote them directly!

• Window Perf 50/50: $5.95/sqft (100 sqft = $595)
• Avery Cut Contour: $6.32/sqft
• 3M Cut Contour: $6.92/sqft

YOUR RESPONSE: Give the price per sqft immediately!
DO NOT ask for vehicle info - it's not needed!

Example: "Window perf is $5.95 per square foot. How many sqft do you need? I can calculate the total and email you a quote!"`;
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
    
    const systemPrompt = LUIGI_SYSTEM_PROMPT + pricingContext + emailReminderContext + specialtyContext + specialtyProductContext + orderStatusContext;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message_text }
    ];

    console.log('[Luigi] Calling AI with context:', { 
      hasPricing: !!pricingContext, 
      hasEmailReminder: !!emailReminderContext,
      hasOrderStatus: !!orderStatusContext,
      hasSpecialty: !!specialtyContext,
      hasSpecialtyProduct: !!specialtyProductContext,
      isInkFusion: isInkFusionIntent,
      isWBTY: isWBTYIntent,
      isFadeWrap: isFadeWrapIntent,
      isStandalone: isStandaloneIntent
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
        // Use functions.invoke instead of raw HTTP
        const { data: quoteData, error: quoteError } = await supabase.functions.invoke("create-quote-from-chat", {
          body: {
            conversation_id: conversationId,
            customer_email: chatState.customer_email,
            customer_name: null,
            vehicle_year: extractedVehicle.year,
            vehicle_make: extractedVehicle.make,
            vehicle_model: extractedVehicle.model,
            product_type: "avery",
            send_email: true,
          },
        });

        if (quoteError) {
          console.error("[Luigi] Failed to create/email quote:", quoteError);
        } else {
          console.log("[Luigi] Quote created and emailed:", quoteData?.quote_number);
          chatState.quote_sent = true;
          chatState.quote_number = quoteData?.quote_number;

          // Update conversation with quote info
          await supabase
            .from("conversations")
            .update({ chat_state: chatState })
            .eq("id", conversationId);
        }
      } catch (quoteErr) {
        console.error("[Luigi] Quote creation error:", quoteErr);
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
