// Template OS - AI Messaging Engine
// Complete copy frameworks for WPW + RestylePro

export interface MessageCategory {
  id: string;
  name: string;
  brand: "wpw" | "restylepro" | "both";
  messages: string[];
}

export interface Hook {
  id: string;
  text: string;
  maxChars: number;
  category: "attention" | "pain" | "benefit" | "urgency" | "social_proof";
  brand: "wpw" | "restylepro" | "both";
}

export interface CTAVariation {
  id: string;
  text: string;
  style: "direct" | "soft" | "urgent";
  brand: "wpw" | "restylepro" | "both";
}

// ═══════════════════════════════════════════════════════════════
// PAIN POINTS
// ═══════════════════════════════════════════════════════════════

export const PAIN_POINTS: Record<string, MessageCategory> = {
  installer_pain: {
    id: "installer_pain",
    name: "Installer Pain Points",
    brand: "wpw",
    messages: [
      "Bad print ruins good installs.",
      "Stop trimming around banding + color issues.",
      "Don't fix prints in the field — fix your print partner.",
      "The customer approves faster when they SEE it first.",
      "You shouldn't have to fix someone else's mistakes.",
      "Your reputation is on the line with every wrap.",
      "One bad print can cost you a referral.",
      "Cheap print costs more in callbacks.",
      "Your skill deserves better materials.",
      "Stop wasting time on print corrections.",
    ],
  },
  commercial_pain: {
    id: "commercial_pain",
    name: "Commercial Buyer Pain Points",
    brand: "wpw",
    messages: [
      "Brand consistency across vehicles is non-negotiable.",
      "Fast turnaround keeps your fleet on the road.",
      "Crisp logos + colors every time — or it's not branding.",
      "Durable lamination means long-lasting UV protection.",
      "One inconsistent wrap breaks the whole fleet look.",
      "Your vehicles are moving billboards — print matters.",
      "Don't let cheap print dilute your brand image.",
      "Fleet managers need reliability, not excuses.",
      "Every vehicle should match. Every time.",
      "Brand recognition depends on print quality.",
    ],
  },
  app_pain: {
    id: "app_pain",
    name: "App User Pain Points",
    brand: "restylepro",
    messages: [
      "Customers can't visualize what they're buying.",
      "Too many revisions because they 'didn't expect that'.",
      "Lost jobs because competitors showed previews.",
      "Hours spent explaining color differences.",
      "Approvals take forever without visuals.",
      "They say yes, then change their mind at install.",
      "Design files don't translate to customer understanding.",
      "Customers need to SEE it to believe it.",
      "Guessing games lose jobs.",
      "Visualization closes deals. Period.",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// VALUE PROPOSITIONS
// ═══════════════════════════════════════════════════════════════

export const VALUE_PROPS: Record<string, MessageCategory> = {
  wpw_value: {
    id: "wpw_value",
    name: "WPW Value Props",
    brand: "wpw",
    messages: [
      "Printed on 3M / Avery",
      "UV inks, color-accurate",
      "Installer-ready paneling",
      "No minimums",
      "1–2 day production",
      "Coast-to-coast shipping",
      "Color-matched every time",
      "Professional lamination included",
      "Print files checked before production",
      "Dedicated support for wrap shops",
    ],
  },
  restylepro_value: {
    id: "restylepro_value",
    name: "RestylePro Value Props",
    brand: "restylepro",
    messages: [
      "Instant wrap previews",
      "Close jobs faster",
      "Customers stop guessing",
      "Cleaner approvals",
      "Better upsells (patterns, fades, PPF)",
      "5-second visualization",
      "Works on any vehicle photo",
      "No design skills needed",
      "Mobile-friendly for on-site demos",
      "Professional output customers trust",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// CONVERSION HOOKS
// ═══════════════════════════════════════════════════════════════

export const CONVERSION_HOOKS: Hook[] = [
  // WPW Hooks
  { id: "wpw_1", text: "Your wrap is only as good as your print.", maxChars: 45, category: "attention", brand: "wpw" },
  { id: "wpw_2", text: "Pro results, every time.", maxChars: 25, category: "benefit", brand: "wpw" },
  { id: "wpw_3", text: "Stop fixing prints.", maxChars: 20, category: "pain", brand: "wpw" },
  { id: "wpw_4", text: "Print it right the first time.", maxChars: 30, category: "benefit", brand: "wpw" },
  { id: "wpw_5", text: "Good installers deserve good print.", maxChars: 35, category: "attention", brand: "wpw" },
  { id: "wpw_6", text: "Award-winning quality.", maxChars: 22, category: "social_proof", brand: "wpw" },
  { id: "wpw_7", text: "Ships in 1-2 days.", maxChars: 18, category: "urgency", brand: "wpw" },
  { id: "wpw_8", text: "No minimums. No excuses.", maxChars: 25, category: "benefit", brand: "wpw" },
  { id: "wpw_9", text: "Trusted by top shops.", maxChars: 21, category: "social_proof", brand: "wpw" },
  { id: "wpw_10", text: "Print partner upgrade.", maxChars: 22, category: "attention", brand: "wpw" },
  
  // RestylePro Hooks
  { id: "rsp_1", text: "Show → Approve → Install.", maxChars: 26, category: "benefit", brand: "restylepro" },
  { id: "rsp_2", text: "Stop losing jobs over bad visuals.", maxChars: 35, category: "pain", brand: "restylepro" },
  { id: "rsp_3", text: "5 seconds to wow.", maxChars: 18, category: "attention", brand: "restylepro" },
  { id: "rsp_4", text: "See it before you wrap it.", maxChars: 26, category: "benefit", brand: "restylepro" },
  { id: "rsp_5", text: "Close deals faster.", maxChars: 20, category: "benefit", brand: "restylepro" },
  { id: "rsp_6", text: "Customers need to SEE it.", maxChars: 25, category: "pain", brand: "restylepro" },
  { id: "rsp_7", text: "Visualization sells.", maxChars: 20, category: "attention", brand: "restylepro" },
  { id: "rsp_8", text: "Try it free.", maxChars: 12, category: "urgency", brand: "restylepro" },
  { id: "rsp_9", text: "The wrap shop secret weapon.", maxChars: 28, category: "attention", brand: "restylepro" },
  { id: "rsp_10", text: "From quote to close in minutes.", maxChars: 32, category: "benefit", brand: "restylepro" },
];

// ═══════════════════════════════════════════════════════════════
// CTA VARIATIONS
// ═══════════════════════════════════════════════════════════════

export const CTA_VARIATIONS: CTAVariation[] = [
  // WPW CTAs
  { id: "wpw_cta_1", text: "Order Now", style: "direct", brand: "wpw" },
  { id: "wpw_cta_2", text: "Get Started", style: "soft", brand: "wpw" },
  { id: "wpw_cta_3", text: "Shop Now →", style: "direct", brand: "wpw" },
  { id: "wpw_cta_4", text: "See Quality", style: "soft", brand: "wpw" },
  { id: "wpw_cta_5", text: "Request Quote", style: "soft", brand: "wpw" },
  { id: "wpw_cta_6", text: "Switch to WPW", style: "direct", brand: "wpw" },
  { id: "wpw_cta_7", text: "Limited Time →", style: "urgent", brand: "wpw" },
  { id: "wpw_cta_8", text: "Join Winners", style: "soft", brand: "wpw" },
  { id: "wpw_cta_9", text: "Fleet Pricing", style: "direct", brand: "wpw" },
  { id: "wpw_cta_10", text: "Read Reviews", style: "soft", brand: "wpw" },
  
  // RestylePro CTAs
  { id: "rsp_cta_1", text: "Try Free", style: "direct", brand: "restylepro" },
  { id: "rsp_cta_2", text: "See Demo", style: "soft", brand: "restylepro" },
  { id: "rsp_cta_3", text: "Start Now →", style: "direct", brand: "restylepro" },
  { id: "rsp_cta_4", text: "Explore Suite", style: "soft", brand: "restylepro" },
  { id: "rsp_cta_5", text: "Get Started", style: "soft", brand: "restylepro" },
  { id: "rsp_cta_6", text: "Watch Demo", style: "soft", brand: "restylepro" },
  { id: "rsp_cta_7", text: "Upgrade Now", style: "urgent", brand: "restylepro" },
  { id: "rsp_cta_8", text: "Free Trial", style: "direct", brand: "restylepro" },
  { id: "rsp_cta_9", text: "Learn More", style: "soft", brand: "restylepro" },
  { id: "rsp_cta_10", text: "See It Work", style: "soft", brand: "restylepro" },
];

// ═══════════════════════════════════════════════════════════════
// SEARCH BAR TEXT (for Grid Templates)
// ═══════════════════════════════════════════════════════════════

export const SEARCH_BAR_TEXT: Record<string, string[]> = {
  wpw_moodboard: [
    "PREMIUM WRAP PRINTING",
    "WRAP SHOP MOODBOARD",
    "PREMIUM PRINT INSPIRATION",
    "CAR WRAP DESIGN IDEAS",
  ],
  wpw_before_after: [
    "BEFORE & AFTER: THE PRINT DIFFERENCE",
    "THE PRINT DIFFERENCE",
    "TRANSFORMATION GALLERY",
  ],
  wpw_us_vs_them: [
    "PRO PRINT VS CHEAP PRINT",
    "QUALITY COMPARISON",
    "WHY WPW WINS",
  ],
  wpw_show_car: [
    "AWARD-WINNING WRAPS",
    "SHOW CAR GALLERY",
    "TROPHY-WINNING PRINTS",
  ],
  wpw_commercial: [
    "COMMERCIAL WRAPS THAT WIN CLIENTS",
    "FLEET WRAP GALLERY",
    "BRAND YOUR FLEET",
  ],
  rsp_visualizer: [
    "RESTYLEPRO WRAP IDEAS",
    "VISUALIZER RENDER GALLERY",
    "INSTANT WRAP PREVIEWS",
  ],
  rsp_patternpro: [
    "PATTERNPRO DESIGNS",
    "PATTERN GALLERY",
    "CUSTOM WRAP PATTERNS",
  ],
  rsp_designpanelpro: [
    "DESIGNPANELPRO GALLERY",
    "PANEL-READY DESIGNS",
    "DESIGN → PRINT",
  ],
  rsp_ecosystem: [
    "THE WRAP SHOP TOOLKIT",
    "RESTYLEPRO SUITE",
    "ALL-IN-ONE WRAP TOOLS",
  ],
};

// ═══════════════════════════════════════════════════════════════
// HEADLINE LIBRARY
// ═══════════════════════════════════════════════════════════════

export const HEADLINE_LIBRARY: Record<string, string[]> = {
  wpw_quality: [
    "THIS is what pro print looks like.",
    "Quality you can see. Results you can trust.",
    "When the print is right, the wrap installs clean.",
    "Craft matters. Print it right.",
    "Premium printing for pro-level wrap shops.",
  ],
  wpw_comparison: [
    "Good installers deserve good print.",
    "PRO RESULTS. NOT PROBLEMS.",
    "Stop fixing prints in the field.",
    "Your wrap is only as good as your print.",
    "Cheap print costs more in callbacks.",
  ],
  wpw_authority: [
    "Award-winning wraps start with award-winning printing.",
    "Trusted by show car champions.",
    "Winning wraps start with winning printing.",
    "The print partner pros trust.",
    "Where champions get their prints.",
  ],
  wpw_commercial: [
    "Your clients trust you. Trust your print partner.",
    "Brand consistency across every vehicle.",
    "Fleet-ready printing. Every time.",
    "Your vehicles are moving billboards.",
    "Professional fleet printing.",
  ],
  rsp_demo: [
    "Show customers the wrap BEFORE you wrap.",
    "5-second wrap previews.",
    "See it before you wrap it.",
    "Visualization sells.",
    "From quote to close in minutes.",
  ],
  rsp_benefits: [
    "Close jobs faster.",
    "Stop losing jobs over bad visuals.",
    "Customers need to SEE it.",
    "The wrap shop secret weapon.",
    "Better upsells. Faster closes.",
  ],
  rsp_suite: [
    "The Wrap Shop Operating System.",
    "Visualize. Design. Print. Repeat.",
    "All-in-one wrap tools.",
    "The complete toolkit.",
    "Everything you need to close.",
  ],
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const getHooksByBrand = (brand: "wpw" | "restylepro" | "both"): Hook[] => {
  return CONVERSION_HOOKS.filter(
    (h) => h.brand === brand || h.brand === "both" || brand === "both"
  );
};

export const getHooksByCategory = (category: Hook["category"]): Hook[] => {
  return CONVERSION_HOOKS.filter((h) => h.category === category);
};

export const getCTAsByBrand = (brand: "wpw" | "restylepro" | "both"): CTAVariation[] => {
  return CTA_VARIATIONS.filter(
    (c) => c.brand === brand || c.brand === "both" || brand === "both"
  );
};

export const getCTAsByStyle = (style: CTAVariation["style"]): CTAVariation[] => {
  return CTA_VARIATIONS.filter((c) => c.style === style);
};

export const getRandomHook = (brand: "wpw" | "restylepro"): Hook => {
  const hooks = getHooksByBrand(brand);
  return hooks[Math.floor(Math.random() * hooks.length)];
};

export const getRandomCTA = (brand: "wpw" | "restylepro"): CTAVariation => {
  const ctas = getCTAsByBrand(brand);
  return ctas[Math.floor(Math.random() * ctas.length)];
};

export const getRandomHeadline = (category: keyof typeof HEADLINE_LIBRARY): string => {
  const headlines = HEADLINE_LIBRARY[category];
  return headlines[Math.floor(Math.random() * headlines.length)];
};

export const getRandomSearchBarText = (templateKey: keyof typeof SEARCH_BAR_TEXT): string => {
  const texts = SEARCH_BAR_TEXT[templateKey];
  return texts[Math.floor(Math.random() * texts.length)];
};
