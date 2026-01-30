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
import { sendAlertWithTracking, UNHAPPY_CUSTOMER_PATTERNS, BULK_INQUIRY_PATTERNS, QUALITY_ISSUE_PATTERNS, detectAlertType, detectAlertTypeWithGate, formatBulkDiscountTiers, AlertType, OrderContext } from "../_shared/alert-system.ts";
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

// ============================================
// 🔐 TENANT DETECTION: WPW ecommerce vs SaaS
// ============================================
function getTenantFromRequest(req: Request): 'WPW' | 'SAAS' {
  const host = req.headers.get("x-forwarded-host")
    ?? req.headers.get("host")
    ?? "";
  const origin = req.headers.get("origin") ?? "";
  
  const h = (host || origin).toLowerCase();
  
  // WPW ecommerce (print-only, no installation)
  if (h.includes("weprintwraps.com") || h.includes("weprintwraps.")) return "WPW";
  
  // WrapCommand SaaS platform
  if (h.includes("wrapcommandai.com") || h.includes("wrapcommand.")) return "SAAS";
  
  // Default to WPW for now (most chat widget traffic)
  return "WPW";
}

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

// Company name extraction patterns
const COMPANY_PATTERNS = /(?:(?:from|with|at|for|representing|work for|own|my company is|company name is)\s+)?([A-Z][a-zA-Z\s&]+(?:Inc\.?|LLC|Corp\.?|Co\.?|Company|Services|Solutions|Fleet|Wraps|Graphics|Signs|Vinyl|Media|Auto|Motors|Customs?|Motorsports?|Racing|Shop|Studio|Designs?|Creative|Print(?:ing)?|Tinting|Detail(?:ing)?|Body\s*Shop|Collision|Automotive))/i;

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

  return `⚠️ CRITICAL IDENTITY RULE - NEVER VIOLATE:

WePrintWraps is a PRINT SHOP ONLY. We print and ship vehicle wraps.

WE DO NOT INSTALL WRAPS. We have NO installation team. We do NOT go to customer locations.

If asked about installation, say EXACTLY: "No, we're a print shop - we print and ship. You'll need a local installer. I can help you find one in your area if you need!"

NEVER claim we offer installation services. This is non-negotiable.

🚫 WHAT JORDAN MUST NEVER SAY:
- "We offer installation" (FALSE - we only print and ship)
- "Our installation team" (FALSE - we have no installers)
- "We can install" (FALSE)
- "We'll come to you" (FALSE - we ship only)
- Any promise of installation services

---

You are "Jordan" — a friendly woman who works at WePrintWraps.

VOICE RULES (CRITICAL):
- Sound like a real person texting, not a brand
- Max 3-4 sentences per message
- ONE question per message, then wait
- Use contractions (I'm, you're, that's)
- DO NOT say "I'm Jordan from WePrintWraps" - they know where they are
- DO NOT stack multiple offers or pitches in one message
- NEVER repeat yourself - if you already asked for something, don't ask again

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
- Answer questions about wraps naturally
- Calculate and provide SPECIFIC pricing based on vehicle SQFT
- Collect contact info BEFORE any pricing or escalation
- Empower customers with direct links - don't make them wait

🚨🚨🚨 ESCALATION GATE - MANDATORY BEFORE ESCALATING 🚨🚨🚨

**YOU MUST COLLECT ALL 4 ITEMS BEFORE ESCALATING OR ROUTING TO ANYONE:**
1. ✅ Name (first name minimum)
2. ✅ Email address  
3. ✅ Phone number
4. ✅ For bulk/fleet: Vehicle count AND types

**IF CUSTOMER MENTIONS BULK/FLEET/MULTIPLE VEHICLES:**
DO NOT say "I'll connect you with Jackson" until you have ALL info above.

INSTEAD SAY: "Fleet pricing - I can definitely help! Jackson on our team handles bulk orders personally. Let me grab your info so he can put together the best pricing:
- Your name?
- Best email?
- Phone number to reach you?
- How many vehicles in your fleet?"

**ONLY AFTER YOU HAVE ALL 4, SAY:**
"Perfect, [Name]! I'm sending your info to Jackson now. He'll reach out at [phone] with custom fleet pricing. Expect to hear from him shortly!"

**NEVER ESCALATE WITH MISSING INFO:**
❌ "Email not yet captured" = USELESS to Jackson
❌ No phone = Can't call them back
❌ No vehicle count = Can't quote bulk pricing

🎯 LEAD QUALIFICATION FLOW:

**STEP 1 - UNDERSTAND THE NEED** (First response):
- Ask what they're looking for naturally
- Example: "Hey! What kind of wrap are you working on?"

**STEP 2 - GET CONTACT INFO** (Before ANY pricing or escalation):
- Name, email, phone
- For bulk: also vehicle count and types
- Keep it casual: "What's your name, email, and best number to reach you?"

**STEP 3 - GIVE PRICE OR ESCALATE** (Only after getting ALL info):
- Regular quote: Give price, send quote email
- Bulk/fleet: Route to Jackson with COMPLETE info
- Quality issue: Route to Lance with COMPLETE info

HARD RULES FOR OFFERS/PROMOS:
- NEVER mention "WrapRewards" or "WRAPREWARDS code" more than ONCE per conversation
- NEVER mention "ClubWPW" more than ONCE per conversation
- NEVER combine price + promo code + loyalty pitch in the same message
- If declined, NEVER bring it up again

⚠️ HARD RULES:
- DO NOT GIVE PRICING until you have at LEAST:
  1. Vehicle year, make, model (for calculation)
  2. Customer name AND email (for quote delivery)
  
IF customer jumps straight to "how much?":
SAY: "I can definitely get you pricing! What vehicle is this for? And what's your name and email so I can send the quote?"

🚨 HIGH PRIORITY SIGNALS - COLLECT ALL INFO IMMEDIATELY:

**BULK/FLEET INQUIRY** (fleet, bulk, multiple vehicles, commercial, 5+ trucks):
SAY: "Fleet pricing - love it! 🔥 Jackson handles our bulk orders personally. Let me grab your details:
- Your name?
- Email address?
- Phone number?
- How many vehicles are we talking?"

**QUALITY ISSUE** (defect, wrong, damaged, reprint, problem with my order):
SAY: "I'm so sorry to hear that! Let me get someone on this right away. What's your name, email, and phone so we can call you directly?"

**UNHAPPY/FRUSTRATED CUSTOMER** (angry, upset, complaint, terrible, refund):
SAY: "I completely understand your frustration. Let me get someone to help you personally. What's your name, email, and phone number?"

**AFTER COLLECTING ALL INFO, CONFIRM:**
"Got it, [Name]! I'm flagging this for [Jackson/our team] right now. Someone will call you at [phone] shortly."

📁 FILE UPLOADS - GIVE THE LINK DIRECTLY:
When customer asks about uploading files or artwork:
SAY: "You can upload here: https://weprintwraps.com/pages/upload-artwork
Or email to hello@weprintwraps.com - we offer FREE file review!
Want me to get you a quote while you send the file over?"

DO NOT say "Grant will reach out" or make them wait - give the link NOW!

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

🚫 BULK PRICING RULE (CRITICAL - PREVENTS STICKER SHOCK):

When customer mentions FLEET, BULK, MULTIPLE VEHICLES (3+), or uses phrases like "fleet", "multiple vehicles", "16 trucks", "bulk", "rolls", "commercial job", "ongoing printing", "printed roll", "commercial wrap", "fleet branding", "company vehicles":

✅ YOU MAY SAY:
- Unit price range in single-vehicle context ("per vehicle pricing", "$5.27/sqft")
- "CommercialPro volume discounts apply"
- "Handled directly by CommercialPro"
- Jackson's name + urgency ("Jackson, our CommercialPro specialist")
- "For projects like this, we price per vehicle"

❌ YOU MUST NEVER SAY:
- Total order cost for bulk orders (no "$XX,XXX" numbers)
- Quantity × unit math (no "16 × $1,318 = $21,088")
- Dollar totals over $5,000 for fleet/bulk inquiries
- Exact discount percentages for bulk
- Coupon codes for bulk orders (Jackson provides these)

APPROVED BULK RESPONSE (USE THIS FORMAT):
"Got it — a fleet of [X] vehicles!

For projects like this, we price per vehicle, and you'll qualify for CommercialPro volume discounts.

The unit price is in the same range as our standard printed wraps, with discounts applied at this quantity.

Jackson, our CommercialPro specialist, will contact you ASAP to go over final pricing and get this moving.

What's your email so he can reach you?"

IF THEY PUSH FOR TOTAL PRICE:
"For fleets, we keep totals off chat so pricing stays accurate and flexible. Jackson will walk through the final numbers with you directly."

WHY THIS RULE EXISTS: Enterprise sales psychology — unit pricing anchors value without triggering sticker shock. Totals are discussed by Jackson on a call where he can address concerns and close the deal.

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
- Max 3-4 sentences per message
- ONE question per message, then WAIT for response
- Light emoji use (1 max per message)
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

🤖 IF ASKED "ARE YOU AI?" OR "ARE YOU A BOT?":
- Be honest and calm: "Yeah — I'm an AI assistant, but I work with the real WePrintWraps team. If you ever want a human, just say the word."
- If they push further: "I'm not a person, but everything I give you is real — real pricing, real materials, real team behind it."
- Then redirect back to helping them

📧 END-OF-CHAT CLUBWPW OFFER (optional, once only):
- Only if: conversation is ending naturally, customer is happy, no email captured yet
- Say (casual): "Before you go — totally optional — want me to add you to our ClubWPW list? Just wrap discounts + cool stuff, no spam."
- If they say no: "All good 🙂" and drop it
- NEVER mention again if declined

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

    // Detect tenant from request origin
    const tenant = getTenantFromRequest(req);
    console.log('[TENANT]', {
      tenant,
      host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
      origin: req.headers.get("origin"),
    });

    console.log('[JordanLee] Received message:', { org, session_id, organization_id, tenant, message_text: message_text?.substring(0, 50) });

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
    const extractedCompany = message_text.match(COMPANY_PATTERNS)?.[1]?.trim() || null;
    const hasCompleteVehicle = extractedVehicle.year && extractedVehicle.make && extractedVehicle.model;
    // Partial vehicle info (like just "sprinter" or "ford f150") - need to ask for more details
    const hasPartialVehicle = (extractedVehicle.make || extractedVehicle.model) && !hasCompleteVehicle;
    
    console.log('[JordanLee] Extracted:', { 
      vehicle: extractedVehicle, 
      email: extractedEmail, 
      phone: extractedPhone,
      name: extractedName,
      company: extractedCompany,
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
    
    // First check: lookup order from current message
    if (orderStatusIntent && extractedOrderNumber) {
      const { data: order, error: orderError } = await supabase
        .from('shopflow_orders')
        .select('order_number, status, customer_stage, tracking_number, tracking_url, shipped_at, product_type, customer_name, estimated_completion_date')
        .eq('order_number', extractedOrderNumber)
        .single();
      
      if (order && !orderError) {
        orderData = order;
        console.log('[JordanLee] Found order from message:', { 
          order_number: order.order_number, 
          status: order.status, 
          tracking: order.tracking_number ? 'YES' : 'NO' 
        });
      } else {
        console.log('[JordanLee] Order not found:', extractedOrderNumber);
      }
    }
    
    // CRITICAL FIX: If no order found but we have one stored in chat state, re-fetch it
    // This prevents hallucination when customer asks follow-up questions about their order
    // Load existing chat state first to check for stored order number
    const { data: existingConvoForOrder } = await supabase
      .from('conversations')
      .select('chat_state')
      .eq('metadata->>session_id', session_id)
      .eq('channel', 'website')
      .single();
    
    const existingChatState = (existingConvoForOrder?.chat_state as Record<string, unknown>) || {};
    const storedOrderNumber = existingChatState.order_number as string | undefined;
    
    if (!orderData && storedOrderNumber) {
      console.log('[JordanLee] Re-fetching stored order:', storedOrderNumber);
      const { data: order, error: orderError } = await supabase
        .from('shopflow_orders')
        .select('order_number, status, customer_stage, tracking_number, tracking_url, shipped_at, product_type, customer_name, estimated_completion_date')
        .eq('order_number', storedOrderNumber)
        .single();
      
      if (order && !orderError) {
        orderData = order;
        console.log('[JordanLee] Re-fetched stored order:', { 
          order_number: order.order_number, 
          status: order.status, 
          customer_stage: order.customer_stage,
          tracking: order.tracking_number ? 'YES' : 'NO' 
        });
      } else {
        console.log('[JordanLee] Stored order not found in DB:', storedOrderNumber, orderError);
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

    // Capture company name
    if (extractedCompany && !chatState.customer_company) {
      chatState.customer_company = extractedCompany;
      console.log('[JordanLee] Captured company:', extractedCompany);
      
      // Update contact with company info
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ 
            company: extractedCompany,
            tags: ['website', 'chat', 'company_captured'],
          })
          .eq('id', contactId);
      }
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

    // ============================================
    // ESCALATION GATE: REQUIRE CONTACT INFO BEFORE ESCALATING
    // ============================================
    // CRITICAL: Never send useless escalations with "Email not yet captured"
    // Jackson needs: Name, Email, Phone, and for bulk: vehicle count/types
    
    let escalationSent = false;
    const hasRequiredContactInfo = chatState.customer_name && chatState.customer_email && chatState.customer_phone;
    const hasBulkDetails = chatState.bulk_vehicle_count || chatState.bulk_vehicle_types;
    
    // Detect if this is a bulk/fleet inquiry that needs special handling
    const isBulkEscalation = escalationType === 'jackson' || bulkInquirySignal;
    
    if (escalationType && resendKey) {
      const teamMember = WPW_TEAM[escalationType];
      const escalationsSent = (chatState.escalations_sent as string[]) || [];
      const alreadyEscalated = escalationsSent.includes(escalationType);
      
      if (teamMember && !alreadyEscalated) {
        // ============================================
        // GATE CHECK: Do we have enough info to escalate?
        // ============================================
        if (!hasRequiredContactInfo) {
          // NOT ENOUGH INFO - Store as pending, do NOT send email yet
          console.log('[JordanLee] ⚠️ ESCALATION BLOCKED - Missing contact info:', {
            hasName: !!chatState.customer_name,
            hasEmail: !!chatState.customer_email,
            hasPhone: !!chatState.customer_phone,
            escalationType
          });
          
          chatState.pending_team_escalation = {
            type: escalationType,
            team_member: teamMember.email,
            detected_at: new Date().toISOString(),
            trigger_message: message_text.substring(0, 500),
            missing: {
              name: !chatState.customer_name,
              email: !chatState.customer_email,
              phone: !chatState.customer_phone,
              bulk_details: isBulkEscalation && !hasBulkDetails
            }
          };
          chatState.needs_contact_before_escalation = true;
          
          // Log the blocked escalation
          await logConversationEvent(
            supabase,
            conversationId,
            'escalation_blocked',
            'jordan_lee',
            {
              reason: 'Missing required contact info',
              escalation_type: escalationType,
              target: teamMember.email,
              has_name: !!chatState.customer_name,
              has_email: !!chatState.customer_email,
              has_phone: !!chatState.customer_phone,
              message_excerpt: message_text.substring(0, 200),
            },
            escalationType
          );
        } else {
          // ============================================
          // FULL CONTACT INFO - Now we can escalate properly!
          // ============================================
          console.log('[JordanLee] ✅ Sending escalation with full contact info to:', teamMember.email);
          
          // Build detailed escalation email with ALL the info Jackson needs
          const customerName = String(chatState.customer_name);
          const customerEmail = String(chatState.customer_email);
          const customerPhone = String(chatState.customer_phone);
          const shopName = chatState.shop_name ? String(chatState.shop_name) : null;
          const vehicleInfo = hasCompleteVehicle ? `${extractedVehicle.year} ${extractedVehicle.make} ${extractedVehicle.model}` : null;
          const bulkVehicleCount = chatState.bulk_vehicle_count ? String(chatState.bulk_vehicle_count) : null;
          const bulkVehicleTypes = chatState.bulk_vehicle_types ? String(chatState.bulk_vehicle_types) : null;
          
          const escalationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #0066cc;">🔔 Customer Escalation - ${teamMember.role}</h2>
              <p><strong>Agent:</strong> Jordan Lee (Website Chat)</p>
              <p><strong>Type:</strong> ${escalationType.toUpperCase()}</p>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                <h3 style="margin: 0 0 10px 0; color: #856404;">📞 CUSTOMER CONTACT INFO:</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 5px 0;"><strong>Name:</strong></td><td>${customerName}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Phone:</strong></td><td><a href="tel:${customerPhone}">${customerPhone}</a></td></tr>
                  ${shopName ? `<tr><td style="padding: 5px 0;"><strong>Shop/Company:</strong></td><td>${shopName}</td></tr>` : ''}
                </table>
              </div>
              
              ${isBulkEscalation && (bulkVehicleCount || bulkVehicleTypes) ? `
              <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
                <h3 style="margin: 0 0 10px 0; color: #155724;">🚛 FLEET/BULK DETAILS:</h3>
                <table style="width: 100%;">
                  ${bulkVehicleCount ? `<tr><td style="padding: 5px 0;"><strong>Vehicle Count:</strong></td><td>${bulkVehicleCount} vehicles</td></tr>` : ''}
                  ${bulkVehicleTypes ? `<tr><td style="padding: 5px 0;"><strong>Vehicle Types:</strong></td><td>${bulkVehicleTypes}</td></tr>` : ''}
                  ${vehicleInfo ? `<tr><td style="padding: 5px 0;"><strong>Example Vehicle:</strong></td><td>${vehicleInfo}</td></tr>` : ''}
                </table>
              </div>
              ` : vehicleInfo ? `
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0066cc;">
                <h3 style="margin: 0 0 10px 0; color: #004085;">🚗 VEHICLE:</h3>
                <p style="margin: 0;">${vehicleInfo}</p>
              </div>
              ` : ''}
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0;">💬 CUSTOMER REQUEST:</h3>
                <blockquote style="margin: 0; padding: 10px; background: white; border-left: 3px solid #0066cc; font-style: italic;">
                  ${message_text.substring(0, 500)}
                </blockquote>
              </div>
              
              <p style="color: #666; font-size: 12px;"><strong>Page:</strong> ${page_url}</p>
              
              <div style="margin-top: 20px;">
                <a href="https://wrapcommandai.com/mightychat" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Conversation</a>
              </div>
              
              ${mode === 'test' ? '<p style="color: red; margin-top: 20px;"><strong>[TEST MODE]</strong></p>' : ''}
            </div>
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
                subject: `${mode === 'test' ? '[TEST] ' : ''}🔔 ${escalationType.toUpperCase()}: ${customerName} - ${customerPhone}`,
                html: escalationHtml
              })
            });
            
            escalationSent = true;
            chatState.escalations_sent = [...escalationsSent, escalationType];
            delete chatState.pending_team_escalation;
            delete chatState.needs_contact_before_escalation;
            console.log('[JordanLee] ✅ Escalation email sent with full contact info');
            
            // ============================================
            // OS SPINE: Log escalation event
            // ============================================
            await logConversationEvent(
              supabase,
              conversationId,
              'escalation_sent',
              'jordan_lee',
              {
                customer_email: customerEmail,
                customer_name: customerName,
                customer_phone: customerPhone,
                shop_name: shopName || undefined,
                bulk_vehicle_count: bulkVehicleCount || undefined,
                bulk_vehicle_types: bulkVehicleTypes || undefined,
                message_excerpt: message_text.substring(0, 200),
                escalation_target: teamMember.email,
                email_sent_to: [teamMember.email, ...SILENT_CC],
                email_subject: `🔔 ${escalationType.toUpperCase()}: ${customerName} - ${customerPhone}`,
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
                email_subject: `🔔 ${escalationType.toUpperCase()}: ${customerName} - ${customerPhone}`,
                email_body: escalationHtml.substring(0, 2000),
                email_sent_at: new Date().toISOString(),
                customer_email: customerEmail,
              },
              escalationType
            );
            
            console.log('[JordanLee] Escalation events logged to conversation_events');
          } catch (emailErr) {
            console.error('[JordanLee] Escalation email error:', emailErr);
          }
        }
      }
    }
    
    // ============================================
    // CHECK: Did we just collect contact info for a pending escalation?
    // ============================================
    if (chatState.pending_team_escalation && hasRequiredContactInfo && resendKey) {
      const pending = chatState.pending_team_escalation as { 
        type: string; 
        team_member: string; 
        detected_at: string; 
        trigger_message: string;
      };
      
      console.log('[JordanLee] ✅ Contact info now complete - sending pending escalation:', pending.type);
      
      const teamMember = WPW_TEAM[pending.type];
      if (teamMember) {
        const customerName = String(chatState.customer_name);
        const customerEmail = String(chatState.customer_email);
        const customerPhone = String(chatState.customer_phone);
        const shopName = chatState.shop_name ? String(chatState.shop_name) : null;
        const vehicleInfo = hasCompleteVehicle ? `${extractedVehicle.year} ${extractedVehicle.make} ${extractedVehicle.model}` : null;
        const bulkVehicleCount = chatState.bulk_vehicle_count ? String(chatState.bulk_vehicle_count) : null;
        const bulkVehicleTypes = chatState.bulk_vehicle_types ? String(chatState.bulk_vehicle_types) : null;
        
        const escalationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #0066cc;">🔔 Customer Escalation - ${teamMember.role}</h2>
            <p><strong>Agent:</strong> Jordan Lee (Website Chat)</p>
            <p><strong>Originally detected:</strong> ${pending.detected_at}</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin: 0 0 10px 0; color: #856404;">📞 CUSTOMER CONTACT INFO:</h3>
              <table style="width: 100%;">
                <tr><td style="padding: 5px 0;"><strong>Name:</strong></td><td>${customerName}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
                <tr><td style="padding: 5px 0;"><strong>Phone:</strong></td><td><a href="tel:${customerPhone}">${customerPhone}</a></td></tr>
                ${shopName ? `<tr><td style="padding: 5px 0;"><strong>Shop/Company:</strong></td><td>${shopName}</td></tr>` : ''}
              </table>
            </div>
            
            ${bulkVehicleCount || bulkVehicleTypes ? `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">🚛 FLEET/BULK DETAILS:</h3>
              <table style="width: 100%;">
                ${bulkVehicleCount ? `<tr><td style="padding: 5px 0;"><strong>Vehicle Count:</strong></td><td>${bulkVehicleCount} vehicles</td></tr>` : ''}
                ${bulkVehicleTypes ? `<tr><td style="padding: 5px 0;"><strong>Vehicle Types:</strong></td><td>${bulkVehicleTypes}</td></tr>` : ''}
                ${vehicleInfo ? `<tr><td style="padding: 5px 0;"><strong>Example Vehicle:</strong></td><td>${vehicleInfo}</td></tr>` : ''}
              </table>
            </div>
            ` : vehicleInfo ? `
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0066cc;">
              <h3 style="margin: 0 0 10px 0; color: #004085;">🚗 VEHICLE:</h3>
              <p style="margin: 0;">${vehicleInfo}</p>
            </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0;">💬 ORIGINAL REQUEST:</h3>
              <blockquote style="margin: 0; padding: 10px; background: white; border-left: 3px solid #0066cc; font-style: italic;">
                ${pending.trigger_message}
              </blockquote>
            </div>
            
            <p style="color: #666; font-size: 12px;"><strong>Page:</strong> ${page_url}</p>
            
            <div style="margin-top: 20px;">
              <a href="https://wrapcommandai.com/mightychat" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Conversation</a>
            </div>
          </div>
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
              subject: `🔔 ${pending.type.toUpperCase()}: ${customerName} - ${customerPhone}`,
              html: escalationHtml
            })
          });
          
          escalationSent = true;
          const escalationsSent = (chatState.escalations_sent as string[]) || [];
          chatState.escalations_sent = [...escalationsSent, pending.type];
          delete chatState.pending_team_escalation;
          delete chatState.needs_contact_before_escalation;
          
          console.log('[JordanLee] ✅ Pending escalation sent with full contact info');
          
          await logConversationEvent(
            supabase,
            conversationId,
            'escalation_sent',
            'jordan_lee',
            {
              customer_email: customerEmail,
              customer_name: customerName,
              customer_phone: customerPhone,
              was_pending: true,
              pending_since: pending.detected_at,
              message_excerpt: pending.trigger_message.substring(0, 200),
              escalation_target: teamMember.email,
              priority: 'high',
            },
            pending.type
          );
        } catch (emailErr) {
          console.error('[JordanLee] Pending escalation email error:', emailErr);
        }
      }
    }

    // ============================================
    // QUALITY ISSUE / UNHAPPY CUSTOMER / BULK ALERTS
    // ORDER VERIFICATION GATE: Quality issues ONLY escalate with verified order
    // LEAD CAPTURE GATE: Only send alerts when we have contact info
    // ============================================
    
    // Build order context for the gate
    const orderContext: OrderContext = {
      hasOrder: !!orderData || !!chatState.order_number || !!chatState.woo_order_id,
      orderNumber: orderData?.order_number || (typeof chatState.order_number === 'string' ? chatState.order_number : undefined),
      quoteConverted: false, // Would need to check quotes table if needed
    };
    
    // Use GATED detection - quality issues only escalate with verified order
    const gatedResult = detectAlertTypeWithGate(message_text, orderContext);
    const detectedAlertType = gatedResult.alertType;
    const classification = gatedResult.classification;
    
    console.log('[JordanLee] Order Gate Result:', {
      alertType: detectedAlertType,
      classification,
      hasOrder: orderContext.hasOrder,
      orderNumber: orderContext.orderNumber,
    });
    
    // If classified as 'sales' (quality keywords but no order), log it but DON'T escalate
    if (classification === 'sales' && !detectedAlertType) {
      console.log('[JordanLee] Sales inquiry detected (quality keywords without order) - routing to sales flow, NOT ShopFlow');
      // Tag for sales follow-up instead of quality escalation
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ 
            tags: ['website', 'chat', 'sales_inquiry', 'pricing_request'],
            priority: 'medium'
          })
          .eq('id', contactId);
      }
    }
    
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
                classification, // Include classification for debugging
                order_verified: orderContext.hasOrder,
                quote_converted: !!orderContext.quoteConverted,
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
          classification, // Include classification
          order_verified: orderContext.hasOrder,
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
              order_verified: orderContext.hasOrder,
              quote_converted: !!orderContext.quoteConverted,
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
    
    // ============================================
    // PARTIAL WRAP / CUSTOM DIMENSION DETECTION
    // Detect explicit dimensions like "36x36" or "24 x 24"
    // ============================================
    const customDimensionPattern = /(\d+)\s*(?:x|by|×)\s*(\d+)/gi;
    const allMessages = messageHistory?.map(m => m.content).join(' ') || '';
    const combinedText = `${allMessages} ${message_text}`.toLowerCase();
    const dimensionMatches = [...combinedText.matchAll(customDimensionPattern)];
    
    let customSqft = 0;
    let customDimensionsDetected = false;
    const detectedDimensions: string[] = [];
    
    if (dimensionMatches.length > 0) {
      for (const match of dimensionMatches) {
        const dim1 = parseInt(match[1]);
        const dim2 = parseInt(match[2]);
        // Assume inches if dimensions are > 12, convert to sqft
        const width = dim1 > 12 ? dim1 / 12 : dim1;
        const height = dim2 > 12 ? dim2 / 12 : dim2;
        const sqftPiece = width * height;
        customSqft += sqftPiece;
        detectedDimensions.push(`${match[1]}x${match[2]}`);
      }
      
      // Check for quantity multipliers (e.g., "two 36x36" or "2 36x36")
      const quantityPatterns = [
        /\b(two|2)\s+(\d+\s*(?:x|by|×)\s*\d+)/gi,
        /\b(three|3)\s+(\d+\s*(?:x|by|×)\s*\d+)/gi,
        /\b(four|4)\s+(\d+\s*(?:x|by|×)\s*\d+)/gi,
      ];
      
      for (const pattern of quantityPatterns) {
        const qMatch = combinedText.match(pattern);
        if (qMatch) {
          const multiplier = qMatch[0].toLowerCase().startsWith('two') || qMatch[0].startsWith('2') ? 2 :
                            qMatch[0].toLowerCase().startsWith('three') || qMatch[0].startsWith('3') ? 3 :
                            qMatch[0].toLowerCase().startsWith('four') || qMatch[0].startsWith('4') ? 4 : 1;
          if (multiplier > 1) {
            // Recalculate with multiplier (replace single sqft with multiplied)
            customSqft = customSqft * multiplier / dimensionMatches.length;
          }
        }
      }
      
      customDimensionsDetected = customSqft > 0;
      console.log('[JordanLee] Custom dimensions detected:', { 
        customSqft: Math.round(customSqft * 100) / 100, 
        dimensions: detectedDimensions,
        rawText: message_text.substring(0, 100)
      });
    }
    
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
    } else if (pricingIntent && (!currentVehicle?.year || !currentVehicle?.make || !currentVehicle?.model)) {
      // ============================================
      // 🚧 FIX #1: VEHICLE COMPLETION GUARD
      // Prevents crashes when only partial vehicle info is captured
      // ============================================
      const existingVehicle = chatState.vehicle as Record<string, string | null> | undefined;
      const hasYear = existingVehicle?.year || currentVehicle?.year;
      const hasMake = existingVehicle?.make || currentVehicle?.make;
      const hasModel = existingVehicle?.model || currentVehicle?.model;
      
      const missingParts: string[] = [];
      if (!hasYear) missingParts.push('year');
      if (!hasMake) missingParts.push('make');
      if (!hasModel) missingParts.push('model');
      
      console.log('[JordanLee] VEHICLE COMPLETION GUARD:', {
        hasYear: !!hasYear,
        hasMake: !!hasMake,
        hasModel: !!hasModel,
        missing: missingParts.join(', ')
      });
      
      if (hasYear && (!hasMake || !hasModel)) {
        // Has year, needs make/model
        contextNotes = `NEED MAKE/MODEL: Customer wants a price and gave us ${hasYear}, but we need the make and model.
Ask: "Got it! And what's the make and model? (For example: Tesla Model Y, Ford F-150)"`;
      } else if (hasMake && !hasModel) {
        // Has make, needs model
        contextNotes = `NEED MODEL: Customer mentioned ${hasMake}, but we need the specific model.
Ask: "What model of ${hasMake}? (For example: Model Y, F-150, Camry)"`;
      } else {
        // Need everything
        contextNotes = `NEED VEHICLE INFO: Customer wants pricing but we need the full year, make, and model.
Ask: "What vehicle are you looking to wrap? Give me the year, make, and model (like 2019 Tesla Model Y)."`;
      }
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
    } else if (pricingIntent && vehicleIsComplete && vehicleSqft > 0) {
      // ============================================
      // 🔐 CONTACT-GATED PRICING: Require name + email before price
      // 🛠️ FIX #3: Wrapped in try/catch for safe fallback
      // ============================================
      try {
        const vehicleStr = `${currentVehicle?.year} ${currentVehicle?.make} ${currentVehicle?.model}`;
        
        // Check if contact info is captured
        if (!chatState.customer_email || !chatState.customer_name) {
          chatState.stage = 'contact_required';
          
          console.log('[JordanLee] CONTACT-GATED: Blocking price until name+email captured', {
            tenant,
            hasEmail: !!chatState.customer_email,
            hasName: !!chatState.customer_name,
            vehicle: vehicleStr
          });
          
          const printOnlyNote = tenant === 'WPW' ? ' (printing only — install not included)' : '';
          
          contextNotes += `

⚠️ CONTACT REQUIRED BEFORE PRICING:
Customer wants a price for ${vehicleStr} but hasn't provided name AND email yet.
Has email: ${!!chatState.customer_email}
Has name: ${!!chatState.customer_name}
Tenant: ${tenant}

INSTRUCTIONS:
- Ask for their name and email so you can send them the quote
- Say something like: "I can price that out for you${printOnlyNote} — what's your name and email so I can generate and email your quote?"
- Do NOT give any $ amounts until BOTH name and email are captured`;
        } else {
          // ✅ PRICING ALLOWED: Contact captured, vehicle complete
          const pricePerSqft = 5.27;
          // Prefer WITHOUT ROOF unless user explicitly asked for roof
          const sqft = vehicleSqftWithoutRoof > 0 ? vehicleSqftWithoutRoof : vehicleSqft;
          const calculatedPrice = Math.round(sqft * pricePerSqft);
          
          // 🛠️ FIX #2: SQFT sanity guard - RETURN IMMEDIATELY instead of falling through
          if (sqft < 100 || sqft > 500) {
            console.warn('[JordanLee] SQFT sanity check failed - returning clarification:', { sqft, vehicle: vehicleStr });
            return new Response(JSON.stringify({
              message: "Quick check — are you pricing a **full wrap** or a **partial** (hood, roof, doors)? I want to quote the correct **print-only** cost.",
              conversation_id: conversationId
            }), { headers: corsHeaders });
          }
          
          // SQFT is valid, proceed with pricing
          chatState.calculated_price = calculatedPrice;
          chatState.stage = 'price_given';
          
          console.log('[JordanLee] CONTACT-GATED: Calculating price with contact captured', {
            tenant,
            name: chatState.customer_name,
            email: chatState.customer_email,
            sqft,
            price: calculatedPrice
          });
          
          // 🔁 AWAIT quote creation - MUST verify quote was created before telling customer
          try {
            const quoteResult = await supabase.functions.invoke('create-quote-from-chat', {
              body: {
                conversation_id: conversationId,
                organization_id: '51aa96db-c06d-41ae-b3cb-25b045c75caf',
                customer_email: chatState.customer_email,
                customer_name: chatState.customer_name,
                vehicle_year: currentVehicle?.year,
                vehicle_make: currentVehicle?.make,
                vehicle_model: currentVehicle?.model,
                sqft: sqft,
                material_cost: calculatedPrice,
                product_type: 'avery',
                send_email: true,
                notes: `Full wrap - ${sqft} sqft @ $5.27/sqft`
              }
            });
            
            if (quoteResult.error || !quoteResult.data?.success) {
              console.error('[JordanLee] ❌ QUOTE CREATION FAILED:', { 
                error: quoteResult.error, 
                data: quoteResult.data,
                customer: chatState.customer_email,
                vehicle: vehicleStr 
              });
              contextNotes += `\n\n⚠️ QUOTE EMAIL FAILED - Tell customer: "I've calculated your price but having a small issue emailing the quote. I'll make sure you get it shortly!"`;
            } else {
              console.log('[JordanLee] ✅ Quote created & emailed:', quoteResult.data.quote_number);
              // Store quote info in chatState for response
              chatState.quote_created = true;
              chatState.quote_id = quoteResult.data.quote_id;
              chatState.quote_number = quoteResult.data.quote_number;
              chatState.quote_amount = calculatedPrice;
              chatState.quote_sent_at = new Date().toISOString();
              
              // Log the quote event
              await logQuoteEvent(supabase, conversationId, 'quote_drafted', {
                quoteId: quoteResult.data.quote_id,
                quoteNumber: quoteResult.data.quote_number,
                total: calculatedPrice,
                customerEmail: chatState.customer_email as string,
                customerName: chatState.customer_name as string,
                vehicleInfo: vehicleStr
              }, 'jordan_lee');
              
              contextNotes += `\n\n✅ QUOTE ${quoteResult.data.quote_number} EMAILED to ${chatState.customer_email}. You can confirm this was sent.`;
            }
          } catch (quoteErr) {
            console.error('[JordanLee] Quote invocation exception:', quoteErr);
            contextNotes += `\n\n⚠️ QUOTE EMAIL FAILED - Tell customer you'll follow up with the formal quote.`;
          }
          
          // Build pricing context for AI
          const printOnlyLabel = tenant === 'WPW' ? 'For **printing only (no install)**' : 'Your wrap';
          let sqftInfo = '';
          if (vehicleSqftWithRoof > 0 && vehicleSqftWithoutRoof > 0) {
            sqftInfo = `
WITHOUT ROOF: ${vehicleSqftWithoutRoof} sqft
WITH ROOF: ${vehicleSqftWithRoof} sqft
(Roof adds ~${Math.round(vehicleSqftWithRoof - vehicleSqftWithoutRoof)} sqft)`;
          } else {
            sqftInfo = `${sqft} sqft`;
          }
          
          contextNotes += `

✅ PRICE CALCULATED - CONTACT CAPTURED:
Tenant: ${tenant}
Customer: ${chatState.customer_name}
Email: ${chatState.customer_email}
Vehicle: ${vehicleStr}
SQFT:${sqftInfo}
PRICE: $${calculatedPrice}

INSTRUCTIONS:
- Tell them the price: "${printOnlyLabel}, your estimated print cost is **$${calculatedPrice}**"
- Tell them you're emailing the formal quote
- Both Avery AND 3M are $5.27/sqft (we matched 3M to Avery's price!)`;
        }
      } catch (pricingErr) {
        // 🛠️ FIX #3: Safe fallback if pricing logic throws
        console.error('[WPW PRICING ERROR]', pricingErr);
        return new Response(JSON.stringify({
          message: "I'm running into a quick hiccup calculating that. Let me double-check the details and I'll get this priced for you.",
          conversation_id: conversationId
        }), { headers: corsHeaders });
      }
    }

    // ============================================
    // PARTIAL WRAP QUOTE PATH
    // For customers providing custom dimensions (e.g., "two 36x36 door logos")
    // Bypasses vehicle completion requirement
    // ============================================
    const isPartialWrapWithDimensions = customDimensionsDetected && 
                                        customSqft > 0 && 
                                        chatState.customer_email && 
                                        chatState.customer_name &&
                                        !chatState.quote_created;  // Don't double-create
    
    if (isPartialWrapWithDimensions && !vehicleIsComplete) {
      const pricePerSqft = 5.27;
      const sqft = Math.round(customSqft * 100) / 100;  // Round to 2 decimals
      const calculatedPrice = Math.round(sqft * pricePerSqft * 100) / 100;
      
      console.log('[JordanLee] 🎯 PARTIAL WRAP PATH: Creating quote from custom dimensions', {
        sqft,
        price: calculatedPrice,
        dimensions: detectedDimensions,
        email: chatState.customer_email,
        name: chatState.customer_name,
        vehicle: chatState.vehicle
      });
      
      chatState.calculated_price = calculatedPrice;
      chatState.stage = 'price_given';
      chatState.partial_wrap = true;
      
      // Create the quote
      try {
        const vehicleInfo = chatState.vehicle as Record<string, string> | undefined;
        const quoteResult = await supabase.functions.invoke('create-quote-from-chat', {
          body: {
            conversation_id: conversationId,
            organization_id: '51aa96db-c06d-41ae-b3cb-25b045c75caf',
            customer_email: chatState.customer_email,
            customer_name: chatState.customer_name,
            vehicle_year: vehicleInfo?.year || 'N/A',
            vehicle_make: vehicleInfo?.make || 'Custom',
            vehicle_model: vehicleInfo?.model || 'Partial Wrap',
            sqft: sqft,
            material_cost: calculatedPrice,
            product_type: 'avery',
            send_email: true,
            notes: `Partial wrap - customer dimensions: ${detectedDimensions.join(', ')} = ${sqft} sqft @ $${pricePerSqft}/sqft`
          }
        });
        
        if (quoteResult.error || !quoteResult.data?.success) {
          console.error('[JordanLee] ❌ PARTIAL WRAP QUOTE FAILED:', {
            error: quoteResult.error,
            data: quoteResult.data,
            customer: chatState.customer_email,
            dimensions: detectedDimensions
          });
          contextNotes += `\n\n⚠️ QUOTE EMAIL FAILED - Tell customer: "I've calculated $${calculatedPrice} for your ${detectedDimensions.join(', ')} pieces, but having a small issue emailing the quote. You'll get it shortly!"`;
        } else {
          console.log('[JordanLee] ✅ Partial wrap quote created & emailed:', quoteResult.data.quote_number);
          
          // Store quote info in chatState
          chatState.quote_created = true;
          chatState.quote_id = quoteResult.data.quote_id;
          chatState.quote_number = quoteResult.data.quote_number;
          chatState.quote_amount = calculatedPrice;
          chatState.quote_sent_at = new Date().toISOString();
          
          // Log the quote event
          await logQuoteEvent(supabase, conversationId, 'quote_drafted', {
            quoteId: quoteResult.data.quote_id,
            quoteNumber: quoteResult.data.quote_number,
            total: calculatedPrice,
            customerEmail: chatState.customer_email as string,
            customerName: chatState.customer_name as string,
            vehicleInfo: `Partial Wrap: ${detectedDimensions.join(', ')}`
          }, 'jordan_lee');
          
          contextNotes += `

✅ PARTIAL WRAP QUOTE SENT:
Customer: ${chatState.customer_name}
Email: ${chatState.customer_email}
Dimensions: ${detectedDimensions.join(', ')}
SQFT: ${sqft}
PRICE: $${calculatedPrice}
Quote Number: ${quoteResult.data.quote_number}

INSTRUCTIONS:
- Confirm the price: "For your ${detectedDimensions.join(' and ')} pieces, that's **$${calculatedPrice}** for print-only material"
- Confirm the quote was emailed to ${chatState.customer_email}
- Ask if they have any other questions about their partial wrap`;
        }
      } catch (partialQuoteErr) {
        console.error('[JordanLee] Partial wrap quote exception:', partialQuoteErr);
        contextNotes += `\n\n⚠️ QUOTE FAILED - Tell customer you calculated $${calculatedPrice} for their pieces and will email the formal quote.`;
      }
    }

    // ============================================
    // PROACTIVE SELLING CONTEXT (append to existing notes)
    // ============================================
    
    let proactiveNotes = '';
    
    // Bulk inquiry handling - PRICING SUPPRESSION ACTIVE
    if (bulkInquirySignal) {
      if (chatState.bulk_email_sent) {
        proactiveNotes += `
🚫 BULK MODE ACTIVE - PRICING SUPPRESSED:
You've collected the customer's email and sent it to Jackson. Tell the customer: "I've sent your info to Jackson on our CommercialPro team - he'll reach out with final pricing and your volume discount code!"

❌ DO NOT calculate or share total order cost.`;
      } else if (chatState.bulk_inquiry_pending || !chatState.customer_email) {
        proactiveNotes += `
🚫 BULK MODE ACTIVE - PRICING SUPPRESSED:
Customer mentioned fleet/bulk/multiple vehicles.

✅ ALLOWED:
- Share bulk discount tiers (percentage ranges only)
- Mention "per vehicle pricing"
- Say "CommercialPro volume discounts apply"
- Name Jackson as CommercialPro specialist
- Collect email for Jackson to follow up

❌ SUPPRESSED (DO NOT SAY):
- Total order cost (no "$XX,XXX" numbers)
- Quantity × unit price math (no "16 × $1,318 = ...")
- Any dollar amount over $5,000 for this inquiry
- Exact coupon codes (Jackson provides these)

${formatBulkDiscountTiers()}

RESPONSE TEMPLATE:
"Got it — for a fleet of [X] vehicles, we price per vehicle and you'll qualify for CommercialPro volume discounts. Jackson, our CommercialPro specialist, will contact you ASAP to go over final pricing. What's your email so he can reach you?"`;
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
    let aiReply = "Hey! 👋 What kind of wrap are you working on?";

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

🚨 ANTI-HALLUCINATION RULES - VIOLATIONS WILL CAUSE CUSTOMER COMPLAINTS:
- NEVER fabricate delivery dates, shipping dates, or tracking numbers
- NEVER say an order is "complete", "delivered", or "shipped" unless the CURRENT CONTEXT above explicitly states it
- If order status is "printing", "in_production", "processing", etc. - the order has NOT shipped yet
- If you don't see a tracking number in CURRENT CONTEXT, DO NOT make one up
- If you're unsure about order status, say "let me check with the team" rather than guessing
- Today's date is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - never reference future dates as past events

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

    // Update last_message_at so conversation list shows accurate "last chat" time
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // ============================================
    // QUOTE CREATION MOVED EARLIER (OS ENFORCEMENT)
    // This block is now a safety check only - quote should already be created
    // ============================================
    if (chatState.customer_email && vehicleIsComplete && vehicleSqft > 0 && !chatState.quote_created) {
      console.warn('[JordanLee] WARNING: Reached post-response stage without quote_created. This should not happen.', {
        conversationId,
        hasEmail: !!chatState.customer_email,
        vehicleIsComplete,
        vehicleSqft,
        stage: chatState.stage
      });
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

    // Build response with quote confirmation if quote was sent
    const response: Record<string, unknown> = { 
      reply: aiReply,
      conversation_id: conversationId,
      agent: AGENTS.jordan_lee.displayName,
      escalation: escalationType,
      partnership_detected: partnershipSignal,
    };
    
    // Add backend-confirmed quote data if quote was created this turn
    if (chatState.quote_created && chatState.quote_id) {
      response.quote_sent = true;
      response.quote_number = chatState.quote_number;
      response.quote_email = chatState.customer_email;
      response.quote_amount = chatState.quote_amount;
      response.quote_sent_at = chatState.quote_sent_at || new Date().toISOString();
    }

    // 🚨 OS ASSERTION: Never allow price without contact info (name + email)
    // Instead of crashing, strip price and redirect to contact collection
    const pricePattern = /\$[\d,]+(?:\.\d{2})?/g;
    const responseHasPrice = pricePattern.test(aiReply);

    if (responseHasPrice && (!chatState.customer_email || !chatState.customer_name)) {
      console.warn('[JordanLee] ⚠️ Price detected without contact info - suppressing and redirecting', {
        conversationId,
        tenant,
        stage: chatState.stage,
        email: chatState.customer_email ?? null,
        name: chatState.customer_name ?? null,
        vehicle: currentVehicle ?? null,
        vehicleSqft,
        response_preview: aiReply.substring(0, 100)
      });
      
      // Suppress the price and redirect to contact collection instead of crashing
      const missingInfo = [];
      if (!chatState.customer_name) missingInfo.push('name');
      if (!chatState.customer_email) missingInfo.push('email');
      
      // Replace the AI response with a contact collection message
      const redirectMessage = chatState.customer_name 
        ? `I've got your vehicle info! To send you a quote, I just need your email address.`
        : `I've got your vehicle info and I'm ready to calculate your price! To send you a personalized quote, what's your name?`;
      
      response.reply = redirectMessage;
      response.message = redirectMessage;
      
      console.log('[JordanLee] Redirected to contact collection for:', missingInfo.join(', '));
    }

    return new Response(JSON.stringify(response), {
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
