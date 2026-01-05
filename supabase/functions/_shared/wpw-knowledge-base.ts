// WPW Knowledge Base - Single source of truth for all AI agents
// This is the anti-hallucination system - agents reference this, never invent

export interface KnowledgeEntry {
  category: string;
  title: string;
  content: string;
  appliesTo: string[]; // Agent IDs
  keywords: string[];
  priority: number; // Higher = more important
}

// =============================================================================
// HARD FACTS (NON-NEGOTIABLE)
// =============================================================================

export const WPW_PRICING: KnowledgeEntry = {
  category: "pricing",
  title: "WPW Product Pricing",
  appliesTo: ["alex_morgan", "jordan_lee", "taylor_brooks"],
  keywords: ["price", "cost", "how much", "quote", "pricing"],
  priority: 100,
  content: `
WPW OFFICIAL PRICING (Updated December 2024):

🔥 PRICE DROP: Both Avery AND 3M printed wraps are now $5.27/sqft!

PRINTED WRAP FILMS:
- Avery MPI 1105 with DOL 1460Z Lamination: $5.27/sqft
- 3M IJ180Cv3 with 8518 Lamination: $5.27/sqft ← PRICE DROP! (was $6.32)

CUT CONTOUR VINYL:
- Avery Cut Contour Vinyl: $6.32/sqft
- 3M Cut Contour Vinyl: $6.92/sqft

SPECIALTY:
- Window Perf 50/50: $5.95/sqft
- Fade Wraps (Wrap By The Yard): $600 flat

DESIGN SERVICES:
- Custom Design: Starting at $750
- Design Setup Fee: $50
- Hourly Design Rate: $150/hour

PRICING CALCULATION:
- Material Cost = Vehicle SQFT × $5.27/sqft
- Example: Toyota Prius (~175 sqft) = $922 for material
- Example: Ford F-150 (~250 sqft) = $1,318 for material

SHIPPING:
- FREE shipping on orders over $750
- Standard shipping: 1-3 business days

All prices include lamination. No hidden fees.
`,
};

export const WPW_TURNAROUND: KnowledgeEntry = {
  category: "turnaround",
  title: "Production & Shipping Times",
  appliesTo: ["alex_morgan", "jordan_lee", "grant_miller"],
  keywords: ["turnaround", "how long", "when", "shipping", "production", "timeline"],
  priority: 90,
  content: `
TURNAROUND TIMES:

PRODUCTION:
- Standard: 1-2 business days after artwork approval
- Rush: Same-day or next-day available (contact for pricing)

SHIPPING:
- Standard Ground: 1-3 business days
- Express: Available upon request

TOTAL TYPICAL TIMELINE:
- Artwork approved → Delivered: 3-5 business days

IMPORTANT:
- Clock starts AFTER artwork is approved
- Weekend/holidays not included
- Large orders may require additional time
`,
};

export const WPW_FILE_REQUIREMENTS: KnowledgeEntry = {
  category: "design",
  title: "File Requirements & Specifications",
  appliesTo: ["grant_miller", "alex_morgan"],
  keywords: ["file", "artwork", "specs", "requirements", "format", "resolution", "dpi"],
  priority: 95,
  content: `
FILE REQUIREMENTS:

ACCEPTED FORMATS:
- PDF (preferred)
- AI (Adobe Illustrator)
- EPS

NOT ACCEPTED:
- JPG, PNG (not print-ready)
- Corel files
- Publisher files
- Canva exports (not print-ready)

SPECIFICATIONS:
- Resolution: Minimum 72 DPI at full scale (150 DPI recommended)
- Color Mode: CMYK for best accuracy
- Bleed: 1/8" on all sides
- Text: Convert ALL text to outlines/paths

FILE REVIEW:
- File review is FREE
- Grant reviews all files before production
- Complex issues escalate to Lance (human)

CANVA FILES:
If customer uploads Canva PDF for wrap:
→ File is NOT print-ready
→ Offer File Output Service ($95 after 10-day hold)
`,
};

export const WPW_POLICIES: KnowledgeEntry = {
  category: "policies",
  title: "Business Policies",
  appliesTo: ["alex_morgan", "jordan_lee", "grant_miller", "casey_ramirez"],
  keywords: ["policy", "file hold", "guarantee", "returns", "refund"],
  priority: 85,
  content: `
WPW POLICIES:

FILE HOLD POLICY:
- Customer files held for 10 days after order completion
- After 10 days: $95 file retrieval fee applies
- Communicate this BEFORE order if relevant

QUALITY GUARANTEE:
- 100% satisfaction guarantee
- If there's a print issue, we reprint at no cost
- Customer must notify within 7 days of receipt

WHAT WPW DOES:
- Prints wrap film
- Ships direct to customer or installer
- Provides design services

WHAT WPW DOES NOT DO:
- Installation (all installs done by third-party shops)
- Local pickup (ship only)
- Store customer files indefinitely

PAYMENT:
- Payment required before production begins
- Accepted: Credit card, ACH
`,
};

export const WPW_AFFILIATE_PROGRAM: KnowledgeEntry = {
  category: "affiliate",
  title: "Affiliate Program Details",
  appliesTo: ["evan_porter", "casey_ramirez", "taylor_brooks"],
  keywords: ["affiliate", "commission", "code", "promote", "referral", "earn"],
  priority: 80,
  content: `
WPW AFFILIATE PROGRAM:

COMMISSION RATES:
- WePrintWraps orders: 2.5% commission
- Software/Apps (at launch): 20% commission

WHO CAN JOIN:
- Wrap shops
- Content creators
- Industry influencers
- Fleet managers
- Anyone with relevant audience

WHAT AFFILIATES GET:
- Unique tracking code/link
- Dashboard access
- Promotional materials
- Priority support

IMPORTANT RULES:
- No income promises
- Commissions paid after order ships
- Minimum payout threshold applies
- Terms subject to approval

Evan Porter handles all affiliate onboarding and questions.
`,
};

// =============================================================================
// PROCESS RULES
// =============================================================================

export const WPW_QUOTE_PROCESS: KnowledgeEntry = {
  category: "process",
  title: "Quote Process Rules",
  appliesTo: ["jordan_lee", "alex_morgan", "casey_ramirez"],
  keywords: ["quote", "pricing", "email"],
  priority: 90,
  content: `
QUOTE PROCESS RULES:

PRICING APPROACH (Updated Dec 2024):
1. When customer provides vehicle info, calculate: SQFT × $5.27/sqft
2. Give specific material cost estimate based on vehicle size
3. ALWAYS mention: "Both Avery and 3M are now $5.27/sqft - 3M just had a price drop!"

VEHICLE-BASED PRICING EXAMPLES:
- Small car (Prius, Civic): ~175 sqft = ~$922
- Midsize sedan (Camry, Accord): ~200 sqft = ~$1,054
- Full-size truck (F-150, Silverado): ~250 sqft = ~$1,318
- Large SUV (Tahoe, Expedition): ~275 sqft = ~$1,449
- Sprinter/Transit Van: ~350 sqft = ~$1,845

FORMAL QUOTE DELIVERY:
- Collect email for formal written quotes
- Quotes sent from hello@weprintwraps.com
- Alex Morgan handles formal quote delivery

ROUTING:
- Website chat → Jordan calculates estimate → collect email → route to Alex for formal quote
- Email pricing request → Alex handles directly

WHAT JORDAN SHOULD SAY:
- "A [vehicle] is about [X] square feet. At $5.27/sqft, that's around $[total] for material."
- "Both Avery and 3M printed wrap are now $5.27/sqft - 3M just dropped their price!"
- "Want me to send you a formal quote? What's your email?"
`,
};

export const WPW_DESIGN_PROCESS: KnowledgeEntry = {
  category: "process",
  title: "Design Process Flow",
  appliesTo: ["grant_miller", "alex_morgan"],
  keywords: ["design", "file", "review", "lance"],
  priority: 85,
  content: `
DESIGN PROCESS FLOW:

STANDARD FLOW:
1. Customer submits files to design@weprintwraps.com
2. Grant Miller reviews files
3. Simple issues → Grant resolves
4. Complex issues → Escalate to Lance (human)
5. Files approved → Production begins

GRANT'S AUTHORITY:
- File review and pre-flight checks
- Design specifications guidance
- Timeline estimates
- Quality control

LANCE'S AUTHORITY (HUMAN):
- Complex quality decisions
- Customer disputes
- Technical exceptions
- Final approval on edge cases

DESIGN PRICING:
- File review: FREE
- Custom design: Starting at $750
- Design setup: $50
- Hourly design: $150/hour
`,
};

export const WPW_ESCALATION_RULES: KnowledgeEntry = {
  category: "process",
  title: "Escalation Rules",
  appliesTo: ["ops_desk", "jordan_lee", "alex_morgan", "grant_miller", "casey_ramirez"],
  keywords: ["escalate", "help", "issue", "problem", "complaint"],
  priority: 95,
  content: `
ESCALATION RULES:

IMMEDIATE ESCALATION TRIGGERS:
- Multiple angry emails from same customer
- Quality complaints
- Refund requests over $500
- Legal threats
- Social media complaints with traction

ESCALATION PATH:
1. Agent detects trigger
2. Route to Ops Desk
3. Ops Desk creates task for Jackson
4. Jackson reviews and decides
5. Trish CC'd on all escalations

WHO HANDLES WHAT:
- Pricing disputes → Jackson
- Quality issues → Lance → Jackson
- Partnership commitments → Jackson → Trish
- Legal/serious → Trish directly

RULE:
If KB is silent on how to handle → route to human.
Never guess. Never invent.
`,
};

// =============================================================================
// APPROVED LANGUAGE
// =============================================================================

export const WPW_APPROVED_LANGUAGE: KnowledgeEntry = {
  category: "language",
  title: "Approved Response Language",
  appliesTo: ["jordan_lee", "alex_morgan", "grant_miller", "casey_ramirez", "taylor_brooks", "evan_porter"],
  keywords: ["response", "script", "language", "say"],
  priority: 80,
  content: `
APPROVED LANGUAGE SNIPPETS:

FILE HOLD EXPLANATION:
"Just so you know, we hold files for 10 days after your order ships. After that, there's a $95 retrieval fee if you need them again."

TURNAROUND EXPLANATION:
"Once your artwork is approved, production is 1-2 business days, then shipping is typically 1-3 days depending on your location."

QUALITY GUARANTEE:
"All our wraps come with a 100% satisfaction guarantee. If there's ever a print issue, we reprint at no cost."

HUMAN CONFIRMATION:
"This was reviewed and handled by our team."

ROUTING TO TEAM:
"Let me loop in the right person on our team to help you with that."

COLLECTING EMAIL:
"I can get you an exact quote - what's your email so we can send it over?"

AFFILIATE INTEREST:
"That could be a good fit. I'll loop in the person who handles affiliates and partnerships so you get accurate info."

PARTNERSHIP INTEREST:
"That sounds interesting - I'm looping this to our team to take a closer look. Someone will follow up shortly."

PRICING REDIRECT:
"I can give you a rough idea, but we send official pricing by email so nothing gets lost. What's your email?"
`,
};

// =============================================================================
// SALES POSITIONING
// =============================================================================

export const WPW_POSITIONING: KnowledgeEntry = {
  category: "sales",
  title: "Sales Positioning & Value Props",
  appliesTo: ["jordan_lee", "taylor_brooks", "alex_morgan"],
  keywords: ["why", "benefits", "value", "compare", "vs"],
  priority: 75,
  content: `
WPW VALUE PROPOSITION:

WHY WPW:
- Direct wholesale pricing (no middleman markup)
- 1-2 day production (fastest in industry)
- Free shipping over $750
- All wraps include lamination
- 100% quality guarantee

COMPETITIVE ADVANTAGES:
- Print-only focus = lower prices
- Volume capacity = fast turnaround
- Direct to installer model = streamlined

TARGET CUSTOMERS:
- Wrap shops buying film
- Fleet managers
- Dealerships
- Sign shops
- Independent installers

MATERIALS:
- Avery MPI 1105 (excellent quality, 5-7 year durability)
- 3M IJ180Cv3 (premium quality, 7-10 year durability)
- Both include proper lamination
`,
};

// =============================================================================
// SPECIALTY PRODUCTS (LOCKED PRICING - January 2025)
// =============================================================================

export const WPW_INKFUSION: KnowledgeEntry = {
  category: "products",
  title: "InkFusion™ Premium Vinyl",
  appliesTo: ["jordan_lee", "alex_morgan", "taylor_brooks"],
  keywords: ["inkfusion", "ink fusion", "paint quality", "sw900", "premium", "roll"],
  priority: 95,
  content: `
INKFUSION™ - AUTOMOTIVE PAINT-QUALITY VINYL

⚠️ CRITICAL: InkFusion is a SUITE-BASED PRODUCT, not chat-quoted!

PRICE: $2,075 per roll (FULL ROLL ONLY)
COVERAGE: 375 sq ft (~24 yards)
WIDTH: 60"
MATERIAL: Avery SW900 Cast Vinyl + DOL1360 Max Gloss Laminate
FINISHES: Gloss or Luster (same price) - Matte NOT recommended
TURNAROUND: 1-2 business days
PRODUCT ID: 69439

ORDER PATH:
RestylePro → PrintPro Suite → Select colors/finishes → Add to Cart → WPW WooCommerce

JORDAN MUST:
1. Acknowledge we DO sell InkFusion
2. State: "$2,075 per full roll (375 sqft)"
3. Explain it's ordered through PrintPro Suite
4. Offer to explain the Suite or answer finish questions

JORDAN MUST NEVER:
❌ Quote InkFusion by square foot
❌ Ask "how many sqft?"
❌ Say "we don't sell InkFusion"
❌ Treat it like a standard wrap product

APPROVED RESPONSE:
"InkFusion™ is our premium paint-quality printed vinyl system.
It's sold as a full 375 sq ft roll for $2,075, printed on Avery SW900 with our Max Gloss laminate.
InkFusion is ordered through our PrintPro Suite in RestylePro, where you can select colors and finishes.
Want me to show you how to access it or answer questions about finishes?"

Product page: https://weprintwraps.com/product/inkfusion/
`,
};

export const WPW_WBTY: KnowledgeEntry = {
  category: "products",
  title: "Wrap By The Yard",
  appliesTo: ["jordan_lee", "alex_morgan", "taylor_brooks"],
  keywords: ["wrap by the yard", "wbty", "yard", "bape", "camo", "marble", "trippy", "wicked wild", "nebula", "galaxy", "starry night", "matrix"],
  priority: 85,
  content: `
WRAP BY THE YARD - PRE-DESIGNED PRINTS

PRICE: $95.50 per yard
QUANTITIES: 1, 5, 10, 25, or 50 yards

QUICK MATH:
• 1 yard = $95.50
• 5 yards = $477.50
• 10 yards = $955
• 25 yards = $2,387.50
• 50 yards = $4,775

COLLECTIONS:
• Camo & Carbon (ID: 1726) - Sand Camo, Black Camo, Gray Carbon, etc.
• Metal & Marble (ID: 39698) - Gray Marble, Gold Foil, Diamond Plate, etc.
• Wicked & Wild (ID: 4181) - Nebula Galaxy, Starry Night, Matrix, etc.
• Bape Camo (ID: 42809) - Red/Blue/Purple/Pink Bape patterns
• Modern & Trippy (ID: 52489) - Modern Wave, Psychedelic Drip, etc.

WHEN CUSTOMER ASKS ABOUT A PATTERN:
1. Identify which collection it belongs to
2. Quote: "$95.50/yard - how many yards do you need?"
3. Calculate total
4. Offer quote email or order link

JORDAN RESPONSE EXAMPLE:
"That pattern is in our Wicked & Wild collection! It's $95.50 per yard.
How many yards do you need? I can calculate your total and send a quote."
`,
};

export const WPW_FADEWRAPS: KnowledgeEntry = {
  category: "products",
  title: "FadeWraps Pre-Designed",
  appliesTo: ["jordan_lee", "alex_morgan", "taylor_brooks"],
  keywords: ["fade", "fadewrap", "fade wrap", "pre-designed", "sides"],
  priority: 85,
  content: `
FADEWRAPS - PRE-DESIGNED FADE GRAPHICS

PRODUCT ID: 58391

SIZE OPTIONS (Driver + Passenger Sides):
• Small (144x59.5"): $600
• Medium (172x59.5"): $710
• Large (200x59.5"): $825
• XL (240x59.5"): $990

ADD-ONS:
• Hood (72x59.5"): $160
• Front Bumper (38x120.5"): $200
• Rear + Bumper (59x72.5" + 38x120"): $395
• Roof Small (72x59.5"): $160
• Roof Medium (110x59.5"): $225
• Roof Large (160x59.5"): $330

FINISHES: Gloss, Luster, or Matte
MATERIAL: Avery MPI 1105 with UV laminate

JORDAN'S RESPONSE:
"FadeWraps start at $600 for small sides (both driver + passenger).
Medium is $710, Large is $825, XL is $990.
Want to add hood ($160) or roof ($160-$330)?
What size vehicle is this for so I can recommend the right size?"

Product page: https://weprintwraps.com/our-products/pre-designed-fade-wraps/
`,
};

export const WPW_STANDALONE_PRODUCTS: KnowledgeEntry = {
  category: "products",
  title: "Standalone Products (No Vehicle Required)",
  appliesTo: ["jordan_lee", "alex_morgan"],
  keywords: ["window perf", "perforated", "window vinyl", "cut contour", "decal", "graphic", "standalone"],
  priority: 90,
  content: `
STANDALONE PRODUCTS - NO VEHICLE CONTEXT REQUIRED

These products are sold STANDALONE. Jordan must quote them directly!

✅ WINDOW PERF (Perforated Window Vinyl 50/50)
   • Price: $5.95/sqft
   • Product ID: 80
   • Sold standalone - no wrap required
   • Calculate: Sqft × $5.95
   • Example: "100 sqft = $595"
   • Link: https://weprintwraps.com/product/perforated-window-vinyl/

✅ CUT CONTOUR VINYL (Decals/Graphics)
   • Avery: $6.32/sqft (ID: 108)
   • 3M: $6.92/sqft (ID: 19420)
   • Weeded and masked, ready to install

WHEN CUSTOMER ASKS FOR THESE:
1. Give the sqft price immediately
2. Calculate total if they provide sqft
3. Offer quote email or order link
4. DO NOT ask for vehicle info - it's not needed!

JORDAN MUST NEVER SAY:
❌ "We don't typically offer window perf as a standalone product"
❌ "We don't sell that"
❌ "What vehicle is this for?" (when asking about window perf)

WE DO SELL THESE STANDALONE. ALWAYS QUOTE THEM!

Example Response:
"Window perf is $5.95 per square foot. 100 sqft would be $595.
Want me to email you a quote? What's your email address?"
`,
};

// =============================================================================
// FULL KNOWLEDGE BASE EXPORT
// =============================================================================

export const WPW_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  WPW_PRICING,
  WPW_TURNAROUND,
  WPW_FILE_REQUIREMENTS,
  WPW_POLICIES,
  WPW_AFFILIATE_PROGRAM,
  WPW_QUOTE_PROCESS,
  WPW_DESIGN_PROCESS,
  WPW_ESCALATION_RULES,
  WPW_APPROVED_LANGUAGE,
  WPW_POSITIONING,
  // Specialty Products (January 2025)
  WPW_INKFUSION,
  WPW_WBTY,
  WPW_FADEWRAPS,
  WPW_STANDALONE_PRODUCTS,
];

/**
 * Get all knowledge entries for a specific agent
 */
export function getKnowledgeForAgent(agentId: string): KnowledgeEntry[] {
  return WPW_KNOWLEDGE_BASE
    .filter(entry => entry.appliesTo.includes(agentId))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Search knowledge base by keywords
 */
export function searchKnowledge(query: string): KnowledgeEntry[] {
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/);
  
  return WPW_KNOWLEDGE_BASE
    .filter(entry => {
      // Check if any keyword matches
      return keywords.some(kw => 
        entry.keywords.some(entryKw => entryKw.includes(kw) || kw.includes(entryKw)) ||
        entry.content.toLowerCase().includes(kw) ||
        entry.title.toLowerCase().includes(kw)
      );
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get knowledge by category
 */
export function getKnowledgeByCategory(category: string): KnowledgeEntry[] {
  return WPW_KNOWLEDGE_BASE
    .filter(entry => entry.category === category)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Build context string for AI prompt injection
 */
export function buildKnowledgeContext(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) return "";
  
  return `
=== WPW KNOWLEDGE BASE CONTEXT ===
Use ONLY this information to respond. Do not invent or guess.

${entries.map(e => `## ${e.title}\n${e.content}`).join("\n\n")}

=== END KNOWLEDGE BASE ===
`;
}
