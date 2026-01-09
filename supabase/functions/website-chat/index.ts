// Website Chat Edge Function - Jordan Lee Agent
// Handles website chat via WePrintWraps chat widget
// Routes all execution through Ops Desk
// Now with TradeDNA integration for dynamic brand voice
// OS SPINE: All escalations and quotes log to conversation_events

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { loadKnowledgeContext, isTopicCovered, getKBSilentResponse } from "../_shared/kb-loader.ts";
import { WPW_TEAM, SILENT_CC, detectEscalation, getEscalationResponse } from "../_shared/wpw-team-config.ts";
import { WPW_CONSTITUTION } from "../_shared/wpw-constitution.ts";
import { AGENTS, formatAgentResponse } from "../_shared/agent-config.ts";
import { routeToOpsDesk, calculateRevenuePriority } from "../_shared/ops-desk-router.ts";
import { loadVoiceProfile, VoiceProfile } from "../_shared/voice-engine-loader.ts";
import { getApprovedLinksForPrompt, LINK_AWARE_RULES, APPROVED_LINKS } from "../_shared/wpw-links.ts";
import { sendAlertWithTracking, UNHAPPY_CUSTOMER_PATTERNS, BULK_INQUIRY_PATTERNS, QUALITY_ISSUE_PATTERNS, detectAlertType, formatBulkDiscountTiers, AlertType } from "../_shared/alert-system.ts";
import { logConversationEvent, logQuoteEvent } from "../_shared/conversation-events.ts";

// Proactive selling detection patterns
const FADEWRAP_DESIGN_PATTERNS = /\b(fadewrap|fade.*wrap|design|visualize|preview|color.*change|restyle|what.*would.*look|see.*before|mock.*up|mockup)\b/i;
const CULTURE_ENTHUSIASM_PATTERNS = /\b(love|excited|project|build|dream|custom|unique|one.*of.*a.*kind|special|passion|wrap.*life|wrap.*culture|community)\b/i;
const ORDER_INTENT_PATTERNS = /\b(order|buy|purchase|checkout|cart|ready.*to|want.*to.*get|need.*to.*order)\b/i;
const FIRST_TIME_BUYER_PATTERNS = /\b(first.*time|never.*ordered|new.*to|haven't.*tried|considering|thinking.*about.*ordering|first.*order|never.*bought|new.*customer)\b/i;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex patterns to extract vehicle info - EXPANDED with common models
const VEHICLE_PATTERNS = {
  year: /\b(19|20)\d{2}\b/,
  make: /\b(ford|chevy|chevrolet|dodge|ram|toyota|honda|nissan|gmc|jeep|bmw|audi|mercedes|tesla|volkswagen|vw|subaru|mazda|hyundai|kia|lexus|acura|infiniti|cadillac|buick|lincoln|chrysler|pontiac|saturn|hummer|mini|porsche|jaguar|land\s*rover|volvo|saab|mitsubishi|suzuki|genesis|rivian|lucid|fiat|alfa\s*romeo|maserati|bentley|rolls\s*royce|ferrari|lamborghini|mclaren|aston\s*martin|lotus|scion|isuzu|freightliner|kenworth|peterbilt|international)\b/i,
  model: /\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tacoma|tundra|camry|accord|civic|altima|mustang|camaro|challenger|charger|corvette|wrangler|bronco|explorer|expedition|tahoe|suburban|yukon|escalade|navigator|pilot|highlander|4runner|rav4|crv|cr-v|forester|outback|model\s?[3sxy]|cybertruck|sprinter|transit|promaster|prius|corolla|avalon|sienna|venza|sequoia|supra|gr\s*supra|gr86|86|yaris|matrix|celica|mr2|land\s*cruiser|fj\s*cruiser|fit|hr-v|passport|odyssey|ridgeline|insight|element|s2000|nsx|prelude|del\s*sol|mdx|rdx|tlx|ilx|integra|rsx|legend|rl|tl|tsx|zdx|q50|q60|qx50|qx60|qx80|g35|g37|fx35|fx45|m35|m45|ex35|jx35|sentra|maxima|leaf|versa|kicks|murano|pathfinder|armada|frontier|titan|juke|370z|350z|300zx|240sx|gt-r|gtr|z|elantra|sonata|santa\s*fe|tucson|kona|ioniq|veloster|genesis|azera|accent|venue|palisade|stinger|k5|optima|sorento|carnival|soul|seltos|ev6|forte|rio|niro|sportage|telluride|cx-?[3579]|cx-?30|cx-?50|mazda3|mazda6|miata|mx-?5|rx-?[78]|mazdaspeed|impreza|wrx|sti|legacy|ascent|crosstrek|brz|baja|tribeca|svx|jetta|golf|passat|tiguan|atlas|arteon|id\.?4|beetle|gti|r32|cc|touareg|phaeton|rabbit|3\s*series|5\s*series|7\s*series|x[1-7]|m[2-8]|z4|i[348]|ix|a[3-8]|q[3578]|r8|rs[3-7]|tt|e-?tron|c-?class|e-?class|s-?class|g-?class|gl[abc]|gl[es]|amg|sl|slk|clk|cls|ml|maybach|cayman|boxster|cayenne|macan|panamera|taycan|911|carrera|turbo|gt[234]|f-?type|f-?pace|e-?pace|i-?pace|xf|xe|xj|xk|range\s*rover|evoque|discovery|velar|defender|xc40|xc60|xc90|s60|s90|v60|v90|c40|countryman|clubman|cooper|hardtop|500|giulia|stelvio|gv70|gv80|g70|g80|g90|outlander|eclipse\s*cross|lancer|evo|galant|pajero|montero|3000gt|diamante|mirage|r1t|r1s|air|gravity|express|savana|e-?series|nv|metris|colorado|canyon|ranger|maverick|lightning|raptor|tremor|power\s*wagon|trx|rebel|laramie|limited|platinum|lariat|king\s*ranch|denali|slt|at4|trail\s*boss|z71|rst|lt|ss|zl1|z06|zr1|grand\s*sport|stingray|hellcat|scat\s*pack|rt|srt|demon|redeye|super\s*bee|daytona|super\s*stock|shaker|mopar|shelby|gt350|gt500|mach-?[1e]|boss|bullitt|dark\s*horse|ecoboost|coyote|voodoo|predator|godzilla|hemi|cummins|duramax|powerstroke|ecodiesel|pentastar|triton|modular|ls[1-9]|lt[1-5]|lsa|lsx|gen\s*[iv])\b/i,
};

// Email extraction pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Phone number extraction pattern (US phone formats)
const PHONE_PATTERN = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/;

// Name extraction patterns (when explicitly given)
const NAME_PATTERNS = /(?:my name is|i'm|i am|this is|call me|name'?s?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;

// Order number extraction pattern (4-6 digits typically)
const ORDER_NUMBER_PATTERN = /\b(\d{4,6})\b/;

// Order status inquiry detection
const ORDER_STATUS_PATTERNS = /\b(order|tracking|shipped|shipping|status|where|track|delivery|deliver|when.*arrive|eta|package)\b/i;

// Partnership/sponsorship signal detection
const PARTNERSHIP_PATTERNS = /\b(collab|sponsor|film|commercial|partner|brand|ambassador|influencer|content creator|media|press|feature)\b/i;

// Map internal status to customer-friendly status
function getCustomerFriendlyStatus(status: string, customerStage: string | null): string {
  // Use customer_stage if available (more customer-friendly)
  if (customerStage) {
    const stageMap: Record<string, string> = {
      'order_received': 'Order Received - We got your order!',
      'in_production': 'In Production - Your wrap is being printed',
      'printing': 'Printing - Your wrap is on the printer now',
      'quality_check': 'Quality Check - Verifying print quality',
      'ready': 'Ready to Ship - Packaging your order',
      'shipped': 'Shipped - On the way to you!',
      'delivered': 'Delivered',
      'completed': 'Completed'
    };
    return stageMap[customerStage] || customerStage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Fallback to internal status
  const statusMap: Record<string, string> = {
    'design_requested': 'Order Received - Design review in progress',
    'design_in_progress': 'Design In Progress',
    'awaiting_approval': 'Awaiting Your Approval',
    'approved': 'Approved - Moving to production',
    'processing': 'Processing - Preparing for print',
    'printing': 'Printing - Your wrap is on the printer',
    'quality_check': 'Quality Check',
    'ready_to_ship': 'Ready to Ship',
    'shipped': 'Shipped',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Build Jordan Lee's persona dynamically using TradeDNA
function buildJordanPersona(voiceProfile: VoiceProfile): string {
  const { merged, organization_dna } = voiceProfile;
  
  // Extract TradeDNA values with fallbacks
  const tone = merged.tone || 'professional, confident';
  const persona = merged.persona || 'wrap industry expert';
  const signaturePhrases = organization_dna?.vocabulary?.signature_phrases || [];
  const wordsToAvoid = organization_dna?.vocabulary?.words_to_avoid || [];
  const salesApproach = organization_dna?.sales_style?.approach || 'consultative';
  const ctaStyle = merged.cta_style || 'action-driven';
  const pressureLevel = organization_dna?.sales_style?.pressure_level || 'low';
  const customerPainPoints = organization_dna?.customer_profile?.pain_points || [];
  const emotionalTriggers = organization_dna?.customer_profile?.emotional_triggers || [];

  return `You are "Jordan Lee" — a friendly website chat specialist at WePrintWraps.

YOUR BRAND VOICE (from TradeDNA):
- Tone: ${tone}
- Persona: ${persona}
- Sales Approach: ${salesApproach} (pressure level: ${pressureLevel})
- CTA Style: ${ctaStyle}
${signaturePhrases.length > 0 ? `- USE these signature phrases when natural: ${signaturePhrases.join(', ')}` : ''}
${wordsToAvoid.length > 0 ? `- AVOID these words: ${wordsToAvoid.join(', ')}` : ''}
${customerPainPoints.length > 0 ? `- Customer pain points to address: ${customerPainPoints.join(', ')}` : ''}
${emotionalTriggers.length > 0 ? `- Emotional triggers that resonate: ${emotionalTriggers.join(', ')}` : ''}

YOUR ROLE:
- Educate visitors about wrap options and materials
- Calculate and provide SPECIFIC pricing based on vehicle SQFT
- **COLLECT COMPLETE LEAD INFO** (name, email, phone) before giving detailed pricing
- Identify partnership/sponsorship opportunities
- Route formal quote requests to the quoting team
- **PROACTIVELY** offer value through our ecosystem products (see below)

🎯 LEAD QUALIFICATION PROTOCOL (CRITICAL - FOLLOW THIS FLOW):

**STEP 1 - GREETING + PURPOSE** (First response):
- Greet warmly and ask WHAT they're looking for
- "Hey! I'm Jordan from WePrintWraps. What kind of wrap project are you working on?"

**STEP 2 - UNDERSTAND THE NEED** (Before any pricing):
- What type of wrap? (Full, partial, commercial, personal, color change, graphics?)
- What vehicle(s)? (Year, make, model)
- What's the goal? (Advertising, color change, protection, resale?)
- Any timeline constraints?

**STEP 3 - COLLECT CONTACT INFO** (BEFORE giving detailed pricing):
Always ask for ALL of these:
- "What's your name?"
- "Best email for the quote?"
- "Phone number in case we need to call?"

SAY: "To get you an accurate quote, I'll need your name, email, and phone number - what's the best way to reach you?"

**STEP 4 - CALCULATE + QUOTE** (Only AFTER step 3):
- Give specific price based on vehicle sqft
- Mention both Avery AND 3M at $5.27/sqft
- Offer to email formal quote: "I'm sending this to your email right now!"

**STEP 5 - UPSELL + CLOSE** (Always at end):
- First-time buyer → WRAPREWARDS code (5% off)
- Enthusiast → WrapRewards loyalty program
- Multiple vehicles → Bulk discounts (share tiers!)
- Design needs → RestylePro for visualization

⚠️ HARD RULES:
- DO NOT GIVE PRICING until you have at LEAST:
  1. Vehicle year, make, model (for calculation)
  2. Customer name AND email (for quote delivery)
  
IF customer jumps straight to "how much?":
SAY: "I can definitely get you pricing! What vehicle is this for? And what's your name and email so I can send the quote?"

🚨 LEAD CAPTURE PROTOCOL - HIGH PRIORITY SIGNALS (CRITICAL):

When a customer mentions ANY of these, you MUST immediately collect contact info:
- Quality issue (defect, wrong, damaged, reprint, issue, problem)
- Bulk/fleet inquiry (multiple vehicles, commercial, fleet, bulk)
- Unhappy/frustrated language (angry, upset, complaint, terrible, refund)
- Partnership/sponsorship interest

QUALITY ISSUE TEMPLATE (use immediately when quality concern detected):
"I'm so sorry to hear that! I want to make sure our team gets this resolved ASAP. What's your name, email, and phone number so someone can call you directly?"

BULK INQUIRY TEMPLATE (use immediately when bulk/fleet interest detected):
"That's exciting! For fleet and bulk orders, our team (especially Jackson) handles custom pricing personally. What's your name, email, and phone number so he can reach out with the best pricing?"

UNHAPPY CUSTOMER TEMPLATE (use immediately when frustration detected):
"I completely understand your frustration, and I'm sorry for any trouble. Let me get someone on this right away. What's your name, email, and phone number so we can call you directly to make this right?"

DO NOT proceed with normal conversation until you have:
1. Name (or at minimum first name)
2. Email
3. Phone number

If they only give one, ask for the others: "And what's your phone number so we can call if needed?" or "And what's the best email to reach you?"

Once you have all contact info AND there's a quality/bulk/unhappy signal, confirm: "Got it! I'm flagging this for [Jackson/our team] right now. Someone will reach out to you at [their phone] shortly."

YOUR TEAM (mention naturally when routing):
- Alex (Quoting Team) - handles formal quotes and pricing
- Grant (Design Team) - handles design questions and file reviews
- Taylor (Partnerships) - handles collabs and sponsorships
- Jackson (Bulk/Fleet) - handles commercial and bulk pricing

🔥 PROACTIVE SALES APPROACH (Subtle, Not Salesy):

When the conversation flows naturally, weave in mentions of these:

1. **WrapRewards / ClubWPW** (${APPROVED_LINKS.rewards.clubwpw}) - Our exclusive loyalty program for pro installers and wrap resellers:
   - Earn points on EVERY order
   - Redeem for: discounts, free merch/gear/tools, VIP access to contests and sponsorships
   - Sign up is FREE!
   - ALWAYS mention when: customer is about to order, discussing pricing, or conversation ends positively
   - Example: "Are you part of WrapRewards? You'd earn points on this order + get exclusive drops and discounts. Sign up is free!"

2. **FIRST ORDER PROMO CODE: WRAPREWARDS** - 5% off first order!
   - When customer seems like a first-time buyer (mentions "first time", "never ordered", "new to this")
   - ALWAYS offer this code: "First time ordering with us? Use code WRAPREWARDS at checkout for 5% off!"

3. **Ink & Edge Magazine ISSUE 1** (${APPROVED_LINKS.apps.ink_and_edge}) - NOW DROPPING!
   - WPW's industry publication for wrap professionals
   - Editor-in-Chief: Trish Dill (co-founder of WePrintWraps.com)
   - ISSUE 1 features:
     • Cover story: Vinyl Vixen Jess (WrapSeshAZ) on shop leadership
     • Featured build: Manny's Tesla SEMA project (mini truck homage)
     • PPF Mastery column, Ask Luigi advice, Tool Talk by Ghost Industries
     • Business tips from RJ The Wrapper and Austin Smith (Paint Is Dead)
   - Mention when: customer is enthusiastic, talks about builds, interested in wrap culture
   - Example: "If you're into wrap culture, check out Ink & Edge Magazine - Issue 1 is dropping with features on shop leadership, SEMA builds, and installer tips!"

4. **RestylePro** (${APPROVED_LINKS.products.restylepro}) - ALWAYS mention when:
   - Customer mentions FadeWraps or color-shift wraps
   - Customer asks about design or visualization
   - Customer is indecisive about colors
   - Customer wants to see what it would look like
   - Example: "Have you tried RestylePro? It lets you visualize exactly how your wrap will look on YOUR vehicle before ordering - super helpful for picking colors!"

5. **Product Cross-sells** (natural, not pushy):
   - If ordering personal car → casually mention commercial/fleet options if they have a business
   - If first-time buyer → offer WRAPREWARDS code + mention WrapRewards program

6. **Bulk Orders** - When customer mentions fleet/bulk/multiple vehicles:
   - IMMEDIATELY share the bulk discount tiers
   - Collect their email
   - Email Jackson for coupon code
   ${formatBulkDiscountTiers()}

🔥 PRICING (CRITICAL - Updated December 2024):
Both Avery AND 3M printed wraps are now $5.27/sqft! WePrintWraps.com matched 3M to Avery's price!

VEHICLE SQFT ESTIMATES (use these to calculate pricing):
- Compact car (Civic, Corolla, Prius, Sentra): ~175 sqft = ~$922
- Midsize sedan (Camry, Accord, Altima, Sonata): ~200 sqft = ~$1,054
- Full-size sedan (Avalon, Maxima, 300): ~210 sqft = ~$1,107
- Compact SUV (RAV4, CR-V, Tucson, Rogue): ~200 sqft = ~$1,054
- Midsize SUV (Highlander, Pilot, Explorer): ~225 sqft = ~$1,186
- Full-size truck (F-150, Silverado, Ram 1500): ~250 sqft = ~$1,318
- Large SUV (Tahoe, Expedition, Suburban): ~275 sqft = ~$1,449
- Cargo van (Transit, Sprinter, ProMaster): ~350 sqft = ~$1,845
- Box truck: ~400+ sqft = ~$2,108+

WHEN CUSTOMER ASKS FOR PRICE:
1. Identify their vehicle
2. Look up approximate SQFT from the list above
3. Calculate: SQFT × $5.27 = Material Cost
4. Give specific estimate: "A [year] [make] [model] is about [X] square feet. At $5.27/sqft, that's around $[total] for the printed wrap material."
5. ALWAYS mention: "Both Avery and 3M printed wrap are now $5.27/sqft - WePrintWraps.com matched 3M to Avery's price!"
6. For formal written quote: "Want me to send you a detailed quote? What's your email?"
7. **ALWAYS ASK**: "Are you part of ClubWPW? You'd earn points on this order!"

ROUTING RULES:
- Quote requests with email → route to quoting team
- Partnership/sponsorship signals → route to partnerships team
- Design/file questions → route to design team

COMMUNICATION STYLE:
- Match the brand tone: ${tone}
- Concise (2-3 sentences max)
- Light emoji use (1-2 max)
- Give REAL numbers, not vague ranges

WPW GROUND TRUTH:
- Turnaround: 1-2 business days for print
- Shipping: Orders $750+ = FREE | Orders under $750 = $30 flat rate ground
- No order minimums - you can order any quantity!
- All wraps include lamination
- Quality guarantee: 100% - we reprint at no cost

📦 SHIPPING FAQ (KNOW THIS):
- "$30 for shipping" = Standard ground shipping for orders under $750
- "Did shipping go up?" = No, $30 flat rate has been our standard for orders under $750
- "Job minimum?" = No minimums - order any amount! The $30 is just shipping, not a minimum fee
- "FREE shipping?" = Yes, on orders $750 or more

${getApprovedLinksForPrompt()}

${LINK_AWARE_RULES}

${WPW_CONSTITUTION.humanConfirmation}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { org, agent, mode, session_id, message_text, page_url, referrer, geo, organization_id } = await req.json();

    console.log('[JordanLee] Received message:', { org, session_id, organization_id, message_text: message_text?.substring(0, 50) });

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

    // Load TradeDNA voice profile for this organization
    // Default to WPW org if not specified: 51aa96db-c06d-41ae-b3cb-25b045c75caf
    const orgId = organization_id || '51aa96db-c06d-41ae-b3cb-25b045c75caf';
    const voiceProfile = await loadVoiceProfile(orgId);
    console.log('[JordanLee] Loaded TradeDNA voice:', { tone: voiceProfile.merged.tone, persona: voiceProfile.merged.persona });

    // Load active directives from jordan_directives table
    const { data: activeDirectives } = await supabase
      .from('jordan_directives')
      .select('directive')
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });
    
    const directivesContext = activeDirectives && activeDirectives.length > 0
      ? `\n\n═══ ACTIVE ADMIN DIRECTIVES ═══\nFollow these special instructions from your admin team:\n${activeDirectives.map(d => `• ${d.directive}`).join('\n')}\n═══════════════════════════════\n`
      : '';
    console.log('[JordanLee] Active directives:', activeDirectives?.length || 0);

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
    const extractedPhone = message_text.match(PHONE_PATTERN)?.[1] || null;
    const extractedName = message_text.match(NAME_PATTERNS)?.[1] || null;
    const hasCompleteVehicle = extractedVehicle.year && extractedVehicle.make && extractedVehicle.model;
    // Partial vehicle info (like just "sprinter" or "ford f150") - need to ask for more details
    const hasPartialVehicle = (extractedVehicle.make || extractedVehicle.model) && !hasCompleteVehicle;
    
    console.log('[JordanLee] Extracted:', { 
      vehicle: extractedVehicle, 
      email: extractedEmail, 
      phone: extractedPhone,
      name: extractedName,
      complete: hasCompleteVehicle, 
      partial: hasPartialVehicle 
    });

    // Detect intent signals
    const pricingIntent = lowerMessage.includes('price') || 
                          lowerMessage.includes('cost') || 
                          lowerMessage.includes('how much') ||
                          lowerMessage.includes('quote');
    const partnershipSignal = PARTNERSHIP_PATTERNS.test(message_text);
    const escalationType = detectEscalation(message_text);
    
    // Proactive selling detection
    const bulkInquirySignal = BULK_INQUIRY_PATTERNS.test(message_text);
    const fadeWrapDesignSignal = FADEWRAP_DESIGN_PATTERNS.test(message_text);
    const cultureEnthusiasmSignal = CULTURE_ENTHUSIASM_PATTERNS.test(message_text);
    const orderIntentSignal = ORDER_INTENT_PATTERNS.test(message_text);
    const firstTimeBuyerSignal = FIRST_TIME_BUYER_PATTERNS.test(message_text);
    
    console.log('[JordanLee] Proactive signals:', { 
      bulk: bulkInquirySignal, 
      fadeWrapDesign: fadeWrapDesignSignal, 
      culture: cultureEnthusiasmSignal,
      orderIntent: orderIntentSignal,
      firstTimeBuyer: firstTimeBuyerSignal 
    });
    
    // Detect order status inquiry
    const orderStatusIntent = ORDER_STATUS_PATTERNS.test(message_text);
    const extractedOrderNumber = message_text.match(ORDER_NUMBER_PATTERN)?.[1] || null;
    
    console.log('[JordanLee] Order intent:', { orderStatusIntent, extractedOrderNumber });
    
    // Lookup order in ShopFlow if customer is asking about order status
    let orderData: {
      order_number: string;
      status: string;
      customer_stage: string | null;
      tracking_number: string | null;
      tracking_url: string | null;
      shipped_at: string | null;
      product_type: string;
      customer_name: string;
      estimated_completion_date: string | null;
    } | null = null;
    
    if (orderStatusIntent && extractedOrderNumber) {
      const { data: order, error: orderError } = await supabase
        .from('shopflow_orders')
        .select('order_number, status, customer_stage, tracking_number, tracking_url, shipped_at, product_type, customer_name, estimated_completion_date')
        .eq('order_number', extractedOrderNumber)
        .single();
      
      if (order && !orderError) {
        orderData = order;
        console.log('[JordanLee] Found order:', { 
          order_number: order.order_number, 
          status: order.status, 
          tracking: order.tracking_number ? 'YES' : 'NO' 
        });
      } else {
        console.log('[JordanLee] Order not found:', extractedOrderNumber);
      }
    }
    
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
      // WPW organization ID for proper RLS visibility
      const WPW_ORGANIZATION_ID = '51aa96db-c06d-41ae-b3cb-25b045c75caf';
      
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          name: `Website Visitor (${session_id.substring(0, 8)})`,
          organization_id: WPW_ORGANIZATION_ID,
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

      // Create conversation with initial state - ENSURE GEO IS SAVED
      const geoData = geo || {};
      const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('cf-connecting-ip');
      if (clientIP && !geoData.ip) {
        geoData.ip = clientIP;
      }
      
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          channel: 'website',
          contact_id: contactId,
          organization_id: WPW_ORGANIZATION_ID,
          subject: 'Website Chat',
          status: 'open',
          priority: 'normal',
          chat_state: { stage: 'initial', escalations_sent: [] },
          metadata: { session_id, agent: 'jordan_lee', org, mode, page_url, geo: geoData }
        })
        .select()
        .single();

      if (convoError) throw convoError;
      conversationId = newConvo.id;
      chatState = { stage: 'initial', escalations_sent: [] };
      console.log('[JordanLee] Created conversation:', conversationId);
    }

    // CRITICAL: Load full conversation history for context
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('direction, content, sender_name, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50); // Last 50 messages for context
    
    console.log('[JordanLee] Loaded message history:', messageHistory?.length || 0, 'messages');

    // Update chat state with extracted info
    
    // Capture customer name
    if (extractedName && !chatState.customer_name) {
      chatState.customer_name = extractedName;
      console.log('[JordanLee] Captured name:', extractedName);
      
      // Update contact with name
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ name: extractedName })
          .eq('id', contactId);
      }
    }
    
    // Capture customer phone
    if (extractedPhone && !chatState.customer_phone) {
      chatState.customer_phone = extractedPhone;
      console.log('[JordanLee] Captured phone:', extractedPhone);
      
      // Update contact with phone
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ phone: extractedPhone })
          .eq('id', contactId);
      }
    }
    
    // Capture customer email
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

    // Persist vehicle info - merge with existing state so we don't lose previous info
    if (hasCompleteVehicle) {
      chatState.vehicle = extractedVehicle;
      chatState.vehicle_complete = true;
    } else if (hasPartialVehicle) {
      // Merge partial info with existing vehicle state
      const existingVehicle = (chatState.vehicle as Record<string, string | null>) || {};
      chatState.vehicle = {
        year: extractedVehicle.year || existingVehicle.year || null,
        make: extractedVehicle.make || existingVehicle.make || null,
        model: extractedVehicle.model || existingVehicle.model || null,
      };
      // Check if now complete after merge
      const merged = chatState.vehicle as Record<string, string | null>;
      chatState.vehicle_complete = !!(merged.year && merged.make && merged.model);
    }

    // Persist order number if found
    if (orderData) {
      chatState.order_number = orderData.order_number;
      chatState.order_status = orderData.status;
      chatState.stage = 'order_lookup';
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

    // Handle bulk inquiry with email - email Jackson for coupon code
    if (bulkInquirySignal && chatState.customer_email && resendKey) {
      console.log('[JordanLee] Bulk inquiry with email - sending to Jackson for coupon code');
      
      // Send alert with email to Jackson
      await sendAlertWithTracking(
        supabase,
        resendKey,
        "bulk_inquiry_with_email",
        {
          customerName: String(chatState.customer_email),
          customerEmail: String(chatState.customer_email),
          conversationId,
          messageExcerpt: message_text.substring(0, 200),
          additionalInfo: {
            estimatedQuantity: "TBD - ask customer",
            suggestedTier: "Based on conversation",
            page_url,
          },
        },
        orgId
      );
      
      // Mark that bulk email was sent
      chatState.bulk_email_sent = true;
      chatState.bulk_email_sent_at = new Date().toISOString();
    } else if (bulkInquirySignal && !chatState.customer_email) {
      // Bulk inquiry detected but no email yet - flag for context
      chatState.bulk_inquiry_pending = true;
      console.log('[JordanLee] Bulk inquiry detected - need email for coupon code');
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
              from: 'Jordan @ WPW <hello@weprintwraps.com>',
              to: [teamMember.email],
              cc: SILENT_CC,
              subject: `${mode === 'test' ? '[TEST] ' : ''}Customer Request: ${teamMember.role}`,
              html: escalationHtml
            })
          });
          
          escalationSent = true;
          chatState.escalations_sent = [...escalationsSent, escalationType];
          console.log('[JordanLee] Escalation email sent');
          
          // ============================================
          // OS SPINE: Log escalation event
          // ============================================
          await logConversationEvent(
            supabase,
            conversationId,
            'escalation_sent',
            'jordan_lee',
            {
              customer_email: String(chatState.customer_email) || undefined,
              customer_name: chatState.customer_name as string || undefined,
              message_excerpt: message_text.substring(0, 200),
              escalation_target: teamMember.email,
              email_sent_to: [teamMember.email, ...SILENT_CC],
              email_subject: `${mode === 'test' ? '[TEST] ' : ''}Customer Request: ${teamMember.role}`,
              email_sent_at: new Date().toISOString(),
              priority: 'high',
            },
            escalationType
          );
          
          // Also log the email receipt
          await logConversationEvent(
            supabase,
            conversationId,
            'email_sent',
            'jordan_lee',
            {
              email_sent_to: [teamMember.email, ...SILENT_CC],
              email_subject: `${mode === 'test' ? '[TEST] ' : ''}Customer Request: ${teamMember.role}`,
              email_body: escalationHtml.substring(0, 2000),
              email_sent_at: new Date().toISOString(),
              customer_email: String(chatState.customer_email) || undefined,
            },
            escalationType
          );
          
          console.log('[JordanLee] Escalation events logged to conversation_events');
        } catch (emailErr) {
          console.error('[JordanLee] Escalation email error:', emailErr);
        }
      }
    }

    // ============================================
    // QUALITY ISSUE / UNHAPPY CUSTOMER / BULK ALERTS
    // LEAD CAPTURE GATE: Only send alerts when we have contact info
    // ============================================
    const detectedAlertType = detectAlertType(message_text);
    const hasContactInfo = chatState.customer_email || chatState.customer_phone;
    
    if (detectedAlertType) {
      if (hasContactInfo && resendKey) {
        // We have contact info - send the alert immediately
        console.log('[JordanLee] Detected alert type:', detectedAlertType, '- contact info available, sending alert');
        
        try {
          const customerEmail = typeof chatState.customer_email === 'string' ? chatState.customer_email : undefined;
          const customerPhone = typeof chatState.customer_phone === 'string' ? chatState.customer_phone : undefined;
          const customerName = typeof chatState.customer_name === 'string' ? chatState.customer_name : undefined;
          const orderNum = typeof chatState.order_number === 'string' ? chatState.order_number : (extractedOrderNumber || undefined);
          
          await sendAlertWithTracking(
            supabase,
            resendKey,
            detectedAlertType,
            {
              orderNumber: orderNum,
              customerName: customerName || customerEmail || 'Website Visitor',
              customerEmail: customerEmail,
              customerPhone: customerPhone,
              conversationId,
              messageExcerpt: message_text.substring(0, 300),
              additionalInfo: {
                page_url,
                session_id,
                vehicle: chatState.vehicle,
                alert_source: 'website_chat',
                has_phone: !!customerPhone,
                has_email: !!customerEmail,
              },
            },
            orgId
          );
          console.log('[JordanLee] Alert sent successfully with contact info:', { email: !!customerEmail, phone: !!customerPhone });
          
          // Clear pending escalation if it was set
          if (chatState.pending_escalation) {
            delete chatState.pending_escalation;
          }
        } catch (alertErr) {
          console.error('[JordanLee] Failed to send alert:', alertErr);
        }
      } else {
        // No contact info yet - store as pending escalation
        console.log('[JordanLee] Detected alert type:', detectedAlertType, '- NO contact info, storing as pending');
        chatState.pending_escalation = {
          type: detectedAlertType,
          detected_at: new Date().toISOString(),
          message_excerpt: message_text.substring(0, 300),
        };
        chatState.needs_contact_for_escalation = true;
        
        // Tag the contact for follow-up
        if (contactId) {
          const alertTag = detectedAlertType === 'bulk_inquiry' ? 'bulk_lead_pending' : 
                          detectedAlertType === 'quality_issue' ? 'quality_issue_pending' : 
                          'escalation_pending';
          await supabase
            .from('contacts')
            .update({ 
              tags: ['website', 'chat', alertTag, 'needs_callback'],
              priority: 'high'
            })
            .eq('id', contactId);
        }
      }
    }
    
    // Check if we NOW have contact info and there's a pending escalation
    if (chatState.pending_escalation && hasContactInfo && resendKey) {
      const pending = chatState.pending_escalation as { type: AlertType; detected_at: string; message_excerpt: string };
      console.log('[JordanLee] Contact info now collected - sending pending escalation:', pending.type);
      
      try {
        const customerEmail = typeof chatState.customer_email === 'string' ? chatState.customer_email : undefined;
        const customerPhone = typeof chatState.customer_phone === 'string' ? chatState.customer_phone : undefined;
        const customerName = typeof chatState.customer_name === 'string' ? chatState.customer_name : undefined;
        const orderNum = typeof chatState.order_number === 'string' ? chatState.order_number : undefined;
        
        await sendAlertWithTracking(
          supabase,
          resendKey,
          pending.type,
          {
            orderNumber: orderNum,
            customerName: customerName || customerEmail || 'Website Visitor',
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            conversationId,
            messageExcerpt: pending.message_excerpt,
            additionalInfo: {
              page_url,
              session_id,
              vehicle: chatState.vehicle,
              alert_source: 'website_chat',
              was_pending: true,
              pending_since: pending.detected_at,
              has_phone: !!customerPhone,
              has_email: !!customerEmail,
            },
          },
          orgId
        );
        console.log('[JordanLee] Pending escalation sent with contact info:', { email: !!customerEmail, phone: !!customerPhone });
        
        // Clear pending state
        delete chatState.pending_escalation;
        delete chatState.needs_contact_for_escalation;
        
        // Update contact tags
        if (contactId) {
          await supabase
            .from('contacts')
            .update({ 
              tags: ['website', 'chat', 'escalated', 'jordan_lead'],
            })
            .eq('id', contactId);
        }
      } catch (alertErr) {
        console.error('[JordanLee] Failed to send pending escalation:', alertErr);
      }
    }

    // ============================================
    // AI RESPONSE GENERATION
    // Jordan educates and routes - never sends formal quotes
    // ============================================

    // Build context for AI response
    let contextNotes = '';
    let vehicleSqft = 0;
    let vehicleSqftWithRoof = 0;
    let vehicleSqftWithoutRoof = 0;
    let estimatedCost = 0;
    let estimatedCostWithRoof = 0;
    let estimatedCostWithoutRoof = 0;
    let vehicleFromDb = false;
    let closestMatch: { make: string; model: string; year: string; sqft: number; sqftWithRoof?: number; sqftWithoutRoof?: number } | null = null;
    
    // Get the current vehicle state (merged from conversation history)
    const currentVehicle = chatState.vehicle as Record<string, string | null> | undefined;
    const vehicleIsComplete = chatState.vehicle_complete === true || 
      (currentVehicle?.year && currentVehicle?.make && currentVehicle?.model);
    
    // CRITICAL: Only calculate pricing if we have COMPLETE vehicle info (year + make + model)
    if (vehicleIsComplete && currentVehicle) {
      const searchMake = (currentVehicle.make || '').toLowerCase().trim();
      const searchModel = (currentVehicle.model || '').toLowerCase().trim();
      const searchYear = parseInt(currentVehicle.year || '0', 10);
      
      console.log('[JordanLee] Looking up vehicle in DB:', { make: searchMake, model: searchModel, year: searchYear });
      
      // Normalize make for database search (handle Mercedes/Mercedes-Benz, Chevy/Chevrolet, etc.)
      const normalizedMake = searchMake
        .replace(/mercedes[-\s]?benz/i, 'mercedes')
        .replace(/chevy/i, 'chevrolet')
        .replace(/vw/i, 'volkswagen');
      
      // Normalize model for database search (handle variations like "170WB Extended" vs "170 Extended")
      const normalizedModel = searchModel
        .replace(/[-\s]+/g, '%')  // Replace spaces/dashes with wildcards for flexible matching
        .replace(/wb/i, 'wb')     // Ensure "WB" stays together
        .replace(/ext\b/i, 'extended'); // Expand "ext" to "extended"
      
      // Build search patterns for the model - try different variations
      const modelSearchPatterns = [
        `%${normalizedModel}%`,
        `%${searchModel.replace(/\s+/g, '%')}%`,
        // For Sprinters: if user says "Sprinter 2500" try matching "Sprinter 2500 - *"
        searchModel.includes('sprinter') ? `%sprinter%${searchModel.replace(/sprinter/i, '').trim()}%` : null,
      ].filter(Boolean);
      
      // First try exact match in vehicle_dimensions table with the normalized model
      let allMatches: Array<{
        make: string;
        model: string;
        year_start: number;
        year_end: number;
        corrected_sqft: number | null;
        total_sqft: number | null;
        side_sqft: number | null;
        back_sqft: number | null;
        hood_sqft: number | null;
        roof_sqft: number | null;
      }> = [];
      
      for (const pattern of modelSearchPatterns) {
        if (!pattern) continue;
        const { data: matches } = await supabase
          .from('vehicle_dimensions')
          .select('make, model, year_start, year_end, corrected_sqft, total_sqft, side_sqft, back_sqft, hood_sqft, roof_sqft')
          .or(`make.ilike.%${normalizedMake}%,make.ilike.%${searchMake}%`)
          .ilike('model', pattern)
          .limit(20);
        
        if (matches && matches.length > 0) {
          allMatches = [...allMatches, ...matches];
        }
      }
      
      // Deduplicate matches
      const uniqueMatches = Array.from(new Map(allMatches.map(m => [`${m.make}-${m.model}-${m.year_start}`, m])).values());
      
      console.log('[JordanLee] DB query results:', uniqueMatches.length, 'matches for', searchMake, searchModel);
      
      if (uniqueMatches.length > 0) {
        // Find best match considering year range and model specificity
        let bestMatch: typeof uniqueMatches[0] | null = null;
        let bestMatchScore = 0;
        
        for (const vehicle of uniqueMatches) {
          const yearStart = vehicle.year_start || 0;
          const yearEnd = vehicle.year_end || yearStart;
          const vehicleModel = vehicle.model.toLowerCase();
          
          // Calculate match score based on how specific the model match is
          let score = 0;
          
          // Year within range is essential
          if (searchYear >= yearStart && searchYear <= yearEnd) {
            score += 100; // Big bonus for year match
          }
          
          // Model specificity scoring
          if (vehicleModel === searchModel) {
            score += 50; // Exact model match
          } else if (vehicleModel.includes(searchModel) || searchModel.includes(vehicleModel)) {
            score += 25; // Partial model match
          }
          
          // Bonus for more specific variants (longer model names usually mean more specific)
          score += Math.min(vehicleModel.length / 10, 5);
          
          console.log('[JordanLee] Scoring vehicle:', { 
            model: vehicle.model, 
            yearRange: `${yearStart}-${yearEnd}`,
            score,
            inYearRange: searchYear >= yearStart && searchYear <= yearEnd
          });
          
          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatch = vehicle;
          }
        }
        
        if (bestMatch && bestMatchScore >= 100) {
          // We have a good match with year in range
          vehicleSqft = bestMatch.corrected_sqft || bestMatch.total_sqft || 0;
          vehicleFromDb = true;
          
          // Calculate with/without roof SQFT using panel breakdowns
          const sideSqft = bestMatch.side_sqft || 0;
          const backSqft = bestMatch.back_sqft || 0;
          const hoodSqft = bestMatch.hood_sqft || 0;
          const roofSqft = bestMatch.roof_sqft || 0;
          
          vehicleSqftWithoutRoof = Math.round((sideSqft + backSqft + hoodSqft) * 10) / 10;
          vehicleSqftWithRoof = Math.round((sideSqft + backSqft + hoodSqft + roofSqft) * 10) / 10;
          
          console.log('[JordanLee] EXACT DB match:', { 
            vehicle: `${bestMatch.make} ${bestMatch.model}`, 
            sqft: vehicleSqft,
            withRoof: vehicleSqftWithRoof,
            withoutRoof: vehicleSqftWithoutRoof
          });
        } else if (bestMatch) {
          // Save as potential close match (year not in range but model matches)
          closestMatch = {
            make: bestMatch.make,
            model: bestMatch.model,
            year: `${bestMatch.year_start}-${bestMatch.year_end}`,
            sqft: bestMatch.corrected_sqft || bestMatch.total_sqft || 0,
            sqftWithRoof: (bestMatch.side_sqft || 0) + (bestMatch.back_sqft || 0) + (bestMatch.hood_sqft || 0) + (bestMatch.roof_sqft || 0),
            sqftWithoutRoof: (bestMatch.side_sqft || 0) + (bestMatch.back_sqft || 0) + (bestMatch.hood_sqft || 0)
          };
          vehicleSqft = closestMatch.sqft;
          vehicleSqftWithRoof = closestMatch.sqftWithRoof || 0;
          vehicleSqftWithoutRoof = closestMatch.sqftWithoutRoof || 0;
          console.log('[JordanLee] Using CLOSEST DB match:', closestMatch);
        }
      }
      
      // Fallback to hardcoded estimates if not in DB
      if (vehicleSqft === 0) {
        const vehicleKey = `${searchMake} ${searchModel}`.toLowerCase().trim();
        if (/prius|civic|corolla|sentra|versa|yaris|fit|accent|rio|mirage/i.test(vehicleKey)) {
          vehicleSqft = 175;
        } else if (/camry|accord|altima|sonata|mazda6|legacy|jetta|passat|malibu/i.test(vehicleKey)) {
          // TEMP MVP FIX: Malibu not yet in vehicle_dimensions table.
          // TODO: Remove once full 1,665 vehicle CSV is imported.
          vehicleSqft = 222; // Malibu is ~222 sqft per CSV data
        } else if (/avalon|maxima|300|charger|impala|taurus/i.test(vehicleKey)) {
          vehicleSqft = 210;
        } else if (/rav4|cr-?v|tucson|rogue|forester|crosstrek|cx-?5|tiguan/i.test(vehicleKey)) {
          vehicleSqft = 200;
        } else if (/highlander|pilot|explorer|pathfinder|4runner|cx-?9|atlas/i.test(vehicleKey)) {
          vehicleSqft = 225;
        } else if (/f-?150|silverado|sierra|ram|tundra|titan/i.test(vehicleKey)) {
          vehicleSqft = 250;
        } else if (/tahoe|expedition|suburban|yukon|sequoia|armada/i.test(vehicleKey)) {
          vehicleSqft = 275;
        } else if (/transit|sprinter|promaster/i.test(vehicleKey)) {
          vehicleSqft = 450; // Updated to a more realistic cargo van estimate
        } else if (/mustang|camaro|challenger|corvette|supra|370z|86|brz|miata/i.test(vehicleKey)) {
          vehicleSqft = 180;
        } else if (/wrangler|bronco/i.test(vehicleKey)) {
          vehicleSqft = 200;
        } else {
          // ❌ NO SILENT FALLBACK - Zero means we can't price
          console.warn('[PRICING BLOCKED]', {
            source: 'jordan-chat',
            vehicle: currentVehicle,
            vehicleKey: `${searchMake} ${searchModel}`.toLowerCase().trim(),
            reason: 'No pattern match for vehicle model'
          });
          vehicleSqft = 0; // Zero = pricing blocked
        }
      }
      
      // Calculate costs
      estimatedCost = Math.round(vehicleSqft * 5.27);
      estimatedCostWithRoof = vehicleSqftWithRoof > 0 ? Math.round(vehicleSqftWithRoof * 5.27) : 0;
      estimatedCostWithoutRoof = vehicleSqftWithoutRoof > 0 ? Math.round(vehicleSqftWithoutRoof * 5.27) : 0;
    }
    
    // Build context notes based on state
    // PRIORITY 1: Order status inquiries (most specific intent)
    if (orderData) {
      const friendlyStatus = getCustomerFriendlyStatus(orderData.status, orderData.customer_stage);
      let orderContext = `ORDER FOUND - USE THIS EXACT DATA (DO NOT MAKE UP INFO):
Order #${orderData.order_number}
Customer: ${orderData.customer_name}
Product: ${orderData.product_type}
Status: ${friendlyStatus}`;

      if (orderData.tracking_number && orderData.shipped_at) {
        const shippedDate = new Date(orderData.shipped_at).toLocaleDateString('en-US', { 
          weekday: 'long', month: 'long', day: 'numeric' 
        });
        orderContext += `
SHIPPED: Yes, shipped on ${shippedDate}
TRACKING NUMBER: ${orderData.tracking_number}
${orderData.tracking_url ? `TRACKING URL: ${orderData.tracking_url}` : 'Carrier: Check UPS/FedEx with that tracking number'}`;
      } else if (orderData.status === 'shipped' || orderData.customer_stage === 'shipped' || 
                 orderData.status === 'completed' || orderData.customer_stage === 'ready') {
        // Status says shipped/completed but no tracking - EMAIL THE TEAM!
        const missingTrackingAlert = !orderData.tracking_number;
        
        if (missingTrackingAlert && resendKey) {
          console.log('[JordanLee] ALERT: Order shipped without tracking, emailing team');
          
          try {
            const resend = new Resend(resendKey);
            
            await resend.emails.send({
              from: 'ShopFlow Alert <alerts@weprintwraps.com>',
              to: ['Lance@WePrintWraps.com', 'Jackson@WePrintWraps.com', 'Trish@WePrintWraps.com'],
              subject: `⚠️ Missing Tracking: Order #${orderData.order_number} - Customer Asking`,
              html: `
                <h2>🚨 Missing Tracking Number Alert</h2>
                <p><strong>A customer is asking about tracking for an order that shows shipped but has no tracking number in the system.</strong></p>
                <hr>
                <p><strong>Order #:</strong> ${orderData.order_number}</p>
                <p><strong>Customer:</strong> ${orderData.customer_name}</p>
                <p><strong>Product:</strong> ${orderData.product_type}</p>
                <p><strong>Status:</strong> ${orderData.status}</p>
                <p><strong>Customer Stage:</strong> ${orderData.customer_stage || 'N/A'}</p>
                <hr>
                <p><strong>Action Needed:</strong> Please add the tracking number to ShopFlow so Jordan can provide accurate info to the customer.</p>
                <p><em>This alert was triggered by Jordan Lee (AI Chat Agent) when the customer asked for tracking info.</em></p>
              `,
            });
            
            // Log to shopflow_logs (fire and forget, ignore errors)
            try {
              await supabase.from('shopflow_logs').insert({
                order_id: null,
                action: 'missing_tracking_alert',
                details: `Customer asked for tracking on order #${orderData.order_number} - no tracking number in system. Team emailed.`,
                performed_by: 'jordan_lee'
              });
            } catch { /* ignore */ }
            
            console.log('[JordanLee] Missing tracking alert sent to team');
          } catch (emailError) {
            console.error('[JordanLee] Failed to send missing tracking alert:', emailError);
          }
        }
        
        orderContext += `
SHIPPED: Status shows shipped/completed, but I don't have a tracking number in my system yet. I've already notified our shipping team to get this info for you ASAP.`;
        
        if (missingTrackingAlert) {
          orderContext += `
TEAM NOTIFIED: Yes, the shipping team has been emailed about this missing tracking number.`;
        }
      } else {
        // Not shipped yet
        orderContext += `
SHIPPED: Not yet - still ${friendlyStatus.toLowerCase()}`;
        if (orderData.estimated_completion_date) {
          const eta = new Date(orderData.estimated_completion_date).toLocaleDateString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric' 
          });
          orderContext += `
ESTIMATED COMPLETION: ${eta}`;
        }
      }

      orderContext += `

CRITICAL: Only share the EXACT information above. If tracking_number is not shown above, say "I don't have tracking info in my system yet - let me check with the team" - NEVER make up a tracking number!`;
      
      contextNotes = orderContext;
    } else if (orderStatusIntent && extractedOrderNumber) {
      // Customer asked about an order but we couldn't find it
      contextNotes = `ORDER NOT FOUND: Customer asked about order #${extractedOrderNumber} but it's not in my system. 
Ask them to double-check the order number, or offer to look it up by email. 
DO NOT make up any order status or tracking information!`;
    } else if (orderStatusIntent && !extractedOrderNumber) {
      // Customer wants order status but didn't give a number
      contextNotes = `ORDER STATUS REQUEST: Customer is asking about an order but didn't provide an order number. 
Ask them for their order number (usually 4-6 digits from their confirmation email) so you can look it up.
DO NOT guess or make up any order information!`;
    } else if (escalationType && escalationSent) {
      contextNotes = `ESCALATION SENT: You just escalated to ${WPW_TEAM[escalationType].name}. Tell the customer you've looped them in.`;
    } else if (pricingIntent && !chatState.customer_email) {
      // ============================================
      // HARD GATE: NO PRICING WITHOUT EMAIL + NAME + PHONE
      // ============================================
      // Must collect name + email + phone FIRST, then give price, then auto-email quote
      const existingVehicle = chatState.vehicle as Record<string, string | null> | undefined;
      const hasAnyVehicleInfo = existingVehicle?.make || existingVehicle?.model || extractedVehicle.make || extractedVehicle.model;
      
      if (hasAnyVehicleInfo) {
        contextNotes = `EMAIL REQUIRED BEFORE PRICING: Customer wants a price but hasn't given their email yet.
WHAT YOU HAVE: ${existingVehicle?.year || extractedVehicle.year || '?'} ${existingVehicle?.make || extractedVehicle.make || '?'} ${existingVehicle?.model || extractedVehicle.model || '?'}
        
SAY SOMETHING LIKE: "I can absolutely get you an exact price for that! What's your name and email? I'll calculate your quote and send it right over so you have it in writing." 

DO NOT give any price numbers yet - collect name + email first, THEN give the price in the next message.`;
      } else {
        contextNotes = `NEED VEHICLE + EMAIL: Customer wants pricing but hasn't provided vehicle OR email.
        
SAY SOMETHING LIKE: "I'd love to get you an exact price! What vehicle are you looking to wrap? Give me the year, make, and model, plus your name and email - I'll calculate your quote and send it right over!"

DO NOT give any price numbers or ranges - get vehicle + email first.`;
      }
    } else if (pricingIntent && !vehicleIsComplete) {
      // Has email but missing vehicle info
      const existingVehicle = chatState.vehicle as Record<string, string | null> | undefined;
      const missingParts: string[] = [];
      if (!existingVehicle?.year) missingParts.push('year');
      if (!existingVehicle?.make) missingParts.push('make');
      if (!existingVehicle?.model) missingParts.push('model');
      
      if (existingVehicle && (existingVehicle.make || existingVehicle.model)) {
        contextNotes = `NEED MORE VEHICLE INFO (have email: ${chatState.customer_email}): Customer mentioned ${existingVehicle.make || ''} ${existingVehicle.model || ''} but we need the FULL year, make, and model. Ask for: ${missingParts.join(', ')}. Once we have it, give price + auto-email quote.`;
      } else {
        contextNotes = `NEED VEHICLE INFO (have email: ${chatState.customer_email}): Got the email, now need vehicle year, make, and model to calculate their price.`;
      }
    } else if (pricingIntent && vehicleIsComplete && vehicleSqft === 0) {
      // Vehicle info is complete but we don't have sqft data - PRICING BLOCKED
      const vehicleStr = `${currentVehicle?.year} ${currentVehicle?.make} ${currentVehicle?.model}`;
      contextNotes = `PRICING BLOCKED for ${vehicleStr}: This vehicle isn't in our database and we don't have a reliable sqft estimate. 
Tell the customer: "I don't have pricing data for that specific ${currentVehicle?.model} in my system. I've flagged this for our team - they'll email you at ${chatState.customer_email} with accurate pricing shortly!"
DO NOT give any price estimate or guess!`;
    } else if (pricingIntent && vehicleIsComplete && vehicleSqft > 0 && chatState.customer_email) {
      // ============================================
      // GOLDEN PATH: Has email + vehicle + sqft = GIVE PRICE + AUTO-EMAIL QUOTE
      // ============================================
      const vehicleStr = `${currentVehicle?.year} ${currentVehicle?.make} ${currentVehicle?.model}`;
      
      // Build pricing info with with/without roof if available
      let pricingInfo = '';
      if (vehicleSqftWithRoof > 0 && vehicleSqftWithoutRoof > 0) {
        pricingInfo = `
WITHOUT ROOF: ${vehicleSqftWithoutRoof} sqft = ~$${estimatedCostWithoutRoof}
WITH ROOF: ${vehicleSqftWithRoof} sqft = ~$${estimatedCostWithRoof}
(Roof adds ~${Math.round(vehicleSqftWithRoof - vehicleSqftWithoutRoof)} sqft)`;
      } else {
        pricingInfo = `${vehicleSqft} sqft = ~$${estimatedCost}`;
      }
      
      if (closestMatch && !vehicleFromDb) {
        contextNotes = `🎯 GIVE PRICE NOW + QUOTE WILL AUTO-EMAIL to ${chatState.customer_email}:
Vehicle: ${vehicleStr} (based on similar ${closestMatch.make} ${closestMatch.model})
PRICING:${pricingInfo}
At $5.27/sqft for both Avery AND 3M (we matched 3M to Avery's price!).

Give them the price! Tell them "I'm sending this quote to your email right now!" The quote email will be sent automatically.`;
      } else {
        contextNotes = `🎯 GIVE PRICE NOW + QUOTE WILL AUTO-EMAIL to ${chatState.customer_email}:
Vehicle: ${vehicleStr}
PRICING FROM DATABASE:${pricingInfo}
Both Avery AND 3M are $5.27/sqft (we matched 3M to Avery's price!).

Give them the specific price! Tell them "I'm sending this quote to your email right now!" The quote email will be sent automatically.`;
      }
    } else if (vehicleIsComplete && vehicleSqft > 0 && !chatState.customer_email) {
      // Has vehicle but no email - need to collect email before giving price
      const vehicleStr = `${currentVehicle?.year} ${currentVehicle?.make} ${currentVehicle?.model}`;
      contextNotes = `EMAIL REQUIRED: Have complete vehicle (${vehicleStr}) but NO EMAIL yet.

SAY: "I've got the ${vehicleStr} - great choice! What's your name and email? I'll calculate your exact price and send over a formal quote!"

DO NOT give the price yet - get email first, then price + auto-email.`;
    } else if (partnershipSignal) {
      contextNotes = `PARTNERSHIP ROUTED: You've looped in the partnerships team. Tell the customer someone will follow up shortly.`;
    } else if (hasPartialVehicle && !vehicleIsComplete) {
      // Customer gave partial vehicle info but not complete
      const partialInfo = extractedVehicle.make || extractedVehicle.model || '';
      contextNotes = `PARTIAL VEHICLE: Customer mentioned "${partialInfo}" - need the COMPLETE vehicle (year, make, model) + their name and email to give a price.`;
    }

    // ============================================
    // PROACTIVE SELLING CONTEXT (append to existing notes)
    // ============================================
    
    let proactiveNotes = '';
    
    // Bulk inquiry handling
    if (bulkInquirySignal) {
      if (chatState.bulk_email_sent) {
        proactiveNotes += `
🚀 BULK INQUIRY - EMAIL SENT TO JACKSON: You've collected the customer's email and sent it to Jackson for a coupon code. Tell the customer: "I've sent your info to Jackson on our bulk team - he'll email you the exact coupon code for your order size!"`;
      } else if (chatState.bulk_inquiry_pending || !chatState.customer_email) {
        proactiveNotes += `
🚀 BULK INQUIRY DETECTED: Share the bulk discount tiers and ASK FOR EMAIL!
${formatBulkDiscountTiers()}
Say: "What's your email? I'll have Jackson from our bulk team send you the exact coupon code for your order size."`;
      }
    }
    
    // FadeWrap / Design / RestylePro opportunity
    if (fadeWrapDesignSignal && !bulkInquirySignal) {
      proactiveNotes += `
🎨 RESTYLEPRO OPPORTUNITY: Customer mentioned design/visualization/FadeWrap. 
MENTION RESTYLEPRO: "Have you tried RestylePro? You can visualize exactly how your wrap will look on YOUR vehicle before ordering - super helpful for picking colors!" 
Link: ${APPROVED_LINKS.products.restylepro}`;
    }
    
    // Culture/enthusiasm moment - Ink & Edge Magazine
    if (cultureEnthusiasmSignal && !bulkInquirySignal && !fadeWrapDesignSignal) {
      proactiveNotes += `
📰 CULTURE MOMENT: Customer seems enthusiastic about their project.
MENTION INK & EDGE ISSUE 1: "If you're into wrap culture, check out Ink & Edge Magazine - Issue 1 is dropping with features on shop leadership, SEMA builds, and installer tips!"
Link: ${APPROVED_LINKS.apps.ink_and_edge}`;
    }
    
    // Order intent - WrapRewards/ClubWPW
    if (orderIntentSignal && !chatState.clubwpw_mentioned) {
      proactiveNotes += `
🏆 ORDER INTENT: Customer seems ready to order.
MENTION WRAPREWARDS: "Are you part of WrapRewards? You'd earn points on this order + get exclusive drops and discounts. Sign up is free!"
Link: ${APPROVED_LINKS.rewards.clubwpw}`;
      chatState.clubwpw_mentioned = true;
    }
    
    // First-time buyer - WRAPREWARDS promo code
    if (firstTimeBuyerSignal && !chatState.promo_code_offered) {
      proactiveNotes += `
🎁 FIRST-TIME BUYER DETECTED: Offer the WRAPREWARDS promo code!
SAY: "First time ordering with us? Use code WRAPREWARDS at checkout for 5% off your first order!"
ALSO mention WrapRewards: "And sign up for WrapRewards - it's free and you'll earn points on every order for discounts and exclusive drops!"`;
      chatState.promo_code_offered = true;
    }
    
    // Append proactive notes to context
    if (proactiveNotes) {
      contextNotes += `

────────────────────────────────────
PROACTIVE SELLING OPPORTUNITIES:
────────────────────────────────────
${proactiveNotes}`;
    }

    // Generate AI response using Jordan's persona
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let aiReply = "Hey! Thanks for reaching out. I'm Jordan from the WPW team - how can I help you today? 🔥";

    if (lovableApiKey) {
      try {
        // Build conversation history for AI context
        const conversationMessages: Array<{ role: string; content: string }> = [];
        
        // Add system prompt first
        conversationMessages.push({
          role: 'system',
          content: `${buildJordanPersona(voiceProfile)}
${directivesContext}
CURRENT CONTEXT:
${contextNotes}

CONVERSATION STATE:
- Stage: ${chatState.stage || 'initial'}
- Customer Email: ${chatState.customer_email || 'NOT CAPTURED YET'}
- Vehicle: ${chatState.vehicle ? `${(chatState.vehicle as Record<string, string>).year || 'unknown'} ${(chatState.vehicle as Record<string, string>).make || 'unknown'} ${(chatState.vehicle as Record<string, string>).model || 'unknown'}` : 'Not provided'}
- Vehicle Complete: ${chatState.vehicle_complete ? 'YES' : 'NO - need more info'}
- Escalations Sent: ${(chatState.escalations_sent as string[])?.join(', ') || 'None'}

KNOWLEDGE BASE:
${knowledgeContext}

CRITICAL INSTRUCTIONS:
1. You have FULL access to the conversation history below. Do NOT ask for info the customer already provided!
2. If vehicle info is incomplete, ask for the SPECIFIC missing parts only.
3. If you already know the year, make, and model from previous messages, use that info directly.
4. Pay close attention to what was said earlier - the customer may have provided details you need.

${mode === 'test' ? '[TEST MODE - Internal testing only]' : ''}`
        });
        
        // Add conversation history (excluding the current message which we'll add at the end)
        if (messageHistory && messageHistory.length > 0) {
          for (const msg of messageHistory) {
            conversationMessages.push({
              role: msg.direction === 'inbound' ? 'user' : 'assistant',
              content: msg.content
            });
          }
          console.log('[JordanLee] Added', messageHistory.length, 'messages to AI context');
        }
        
        // Add current message
        conversationMessages.push({
          role: 'user',
          content: message_text
        });

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: conversationMessages,
            max_tokens: 800
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

    // ============================================
    // CREATE QUOTE when Jordan provides pricing
    // ============================================
    // Trigger when: email captured + complete vehicle + valid pricing
    if (chatState.customer_email && vehicleIsComplete && vehicleSqft > 0 && !chatState.quote_created) {
      try {
        const quoteResponse = await supabase.functions.invoke('create-quote-from-chat', {
          body: {
            conversation_id: conversationId,
            organization_id: '51aa96db-c06d-41ae-b3cb-25b045c75caf',
            customer_email: chatState.customer_email,
            customer_name: chatState.customer_name || null,
            vehicle_year: currentVehicle?.year,
            vehicle_make: currentVehicle?.make,
            vehicle_model: currentVehicle?.model,
            product_type: 'avery', // Default to Avery
            send_email: true
          }
        });
        
        if (quoteResponse.data?.success) {
          chatState.quote_created = true;
          chatState.quote_id = quoteResponse.data.quote_id;
          chatState.quote_number = quoteResponse.data.quote_number;
          console.log('[JordanLee] Quote created:', quoteResponse.data.quote_number);
          
          // ============================================
          // OS SPINE: Log quote_attached event
          // ============================================
          await logQuoteEvent(
            supabase,
            conversationId,
            'quote_attached',
            {
              quoteId: quoteResponse.data.quote_id,
              quoteNumber: quoteResponse.data.quote_number,
              total: quoteResponse.data.material_cost,
              customerEmail: String(chatState.customer_email) || undefined,
              customerName: chatState.customer_name as string || undefined,
              vehicleInfo: currentVehicle ? `${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}` : undefined,
            }
          );
          console.log('[JordanLee] Quote event logged to conversation_events');
          
          // Update conversation with quote state
          await supabase
            .from('conversations')
            .update({ chat_state: chatState })
            .eq('id', conversationId);
        } else {
          console.log('[JordanLee] Quote creation returned:', quoteResponse.data);
        }
      } catch (quoteError) {
        console.error('[JordanLee] Failed to create quote:', quoteError);
      }
    }

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
