// WePrintWraps Approved Links - Single Source of Truth
// VERIFIED URLS - February 2026
// Jordan Lee and other agents ONLY use links from this map
// Prevents hallucinated URLs

export const APPROVED_LINKS = {
  // ============================================================================
  // MAIN SITE PAGES
  // ============================================================================
  site: {
    homepage: "https://weprintwraps.com/",
    how_to_order: "https://weprintwraps.com/how-to-order/",
    faqs: "https://weprintwraps.com/faqs/",
    shipping: "https://weprintwraps.com/#shipping",
    rewards: "https://weprintwraps.com/reward-landing/",
    media: "https://weprintwraps.com/media/",
    design_videos: "https://weprintwraps.com/design-videos/",
    video_gallery: "https://weprintwraps.com/video-gallery/",
    contact: "https://weprintwraps.com/contact/",
  },

  // ============================================================================
  // PRODUCT PAGES (VERIFIED - DO NOT CHANGE)
  // ============================================================================
  products: {
    // Printed Wrap Films
    avery_1105: "https://weprintwraps.com/our-products/avery-1105egrs-with-doz13607-lamination/",
    "3m_ij180": "https://weprintwraps.com/our-products/3m-ij180-printed-wrap-film/",
    
    // Contour Cut
    avery_contour: "https://weprintwraps.com/our-products/avery-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/",
    "3m_contour": "https://weprintwraps.com/our-products/3m-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/",
    
    // Window & Wall
    window_perf: "https://weprintwraps.com/our-products/perforated-window-vinyl-5050-unlaminated/",
    wall_wrap: "https://weprintwraps.com/our-products/wall-wrap-printed-vinyl/",
    
    // Pre-Designed
    fade_wraps: "https://weprintwraps.com/our-products/pre-designed-fade-wraps/",
    
    // Wrap By The Yard Collections
    wbty_wicked_wild: "https://weprintwraps.com/our-products/wrap-by-the-yard-wicked-wild-wrap-prints/",
    wbty_bape_camo: "https://weprintwraps.com/our-products/wrap-by-the-yard-bape-camo/",
    wbty_modern_trippy: "https://weprintwraps.com/our-products/wrap-by-the-yard-modern-trippy/",
    wbty_metal_marble: "https://weprintwraps.com/our-products/wrap-by-the-yard-metal-marble/",
    wbty_camo_carbon: "https://weprintwraps.com/our-products/camo-carbon-wrap-by-the-yard/",
    
    // Design Services
    custom_design: "https://weprintwraps.com/our-products/custom-wrap-design/",
    design_setup: "https://weprintwraps.com/our-products/design-setupfile-output/",
  },

  // ============================================================================
  // ORDERING & ACCOUNT
  // ============================================================================
  ordering: {
    homepage_quote: "https://weprintwraps.com/#quote",
    how_to_order: "https://weprintwraps.com/how-to-order/",
  },

} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to format links for system prompt injection
export function getApprovedLinksForPrompt(): string {
  return `
APPROVED LINKS (use ONLY these - never invent URLs):

MAIN SITE:
- Homepage: ${APPROVED_LINKS.site.homepage}
- How to Order: ${APPROVED_LINKS.site.how_to_order}
- FAQs: ${APPROVED_LINKS.site.faqs}
- Shipping Info: ${APPROVED_LINKS.site.shipping}
- Rewards: ${APPROVED_LINKS.site.rewards}
- Contact: ${APPROVED_LINKS.site.contact}

PRINTED WRAP FILMS:
- Avery MPI 1105 ($5.27/sqft): ${APPROVED_LINKS.products.avery_1105}
- 3M IJ180 ($5.27/sqft): ${APPROVED_LINKS.products["3m_ij180"]}

CONTOUR CUT:
- Avery Contour ($6.32/sqft): ${APPROVED_LINKS.products.avery_contour}
- 3M Contour ($6.92/sqft): ${APPROVED_LINKS.products["3m_contour"]}

SPECIALTY:
- Window Perf ($5.95/sqft): ${APPROVED_LINKS.products.window_perf}
- Wall Wrap ($3.25/sqft): ${APPROVED_LINKS.products.wall_wrap}
- Fade Wraps ($600-$990): ${APPROVED_LINKS.products.fade_wraps}

WRAP BY THE YARD ($95.50/yard):
- Wicked & Wild: ${APPROVED_LINKS.products.wbty_wicked_wild}
- Bape Camo: ${APPROVED_LINKS.products.wbty_bape_camo}
- Modern & Trippy: ${APPROVED_LINKS.products.wbty_modern_trippy}
- Metal & Marble: ${APPROVED_LINKS.products.wbty_metal_marble}
- Camo & Carbon: ${APPROVED_LINKS.products.wbty_camo_carbon}

DESIGN SERVICES:
- Custom Design ($750): ${APPROVED_LINKS.products.custom_design}
- Design Setup ($50): ${APPROVED_LINKS.products.design_setup}`;
}

// Link-aware behavior rules for system prompt
export const LINK_AWARE_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINK-AWARE BEHAVIOR (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are link-aware.

You may send links when they are helpful, relevant, and timely.

LINK RULES:
• Never invent URLs — only use links from the approved list above
• Never send more than ONE primary link at a time unless specifically asked for multiple
• Always explain why you are sending the link in plain language
• If a user is confused, ask before sending links
• If a user asks "how do I order", links are encouraged
• If a user asks for pricing or info, answer first, then offer a link

WHEN TO OFFER LINKS:
• User says "how do I order" → offer ordering link
• User says "send me the link" → send the relevant link
• User is ready to buy → offer product or quote link
• User asks about specific products → offer that product's page

WHEN NOT TO OFFER LINKS:
• User is still confused → clarify first
• User is unhappy → address concern first
• User is mid-problem → solve first, link later
• User is asking purely informational questions → answer first, then offer link

When appropriate, you may say:
• "I can send you the exact product page."
• "Want the direct order link?"
• "I'll drop the link here so you don't have to hunt for it."

Do not stack links.
Do not push links aggressively.
Trust is more important than clicks.
`;

// ============================================================================
// URL VALIDATION (for testing)
// ============================================================================
export function getAllUrls(): string[] {
  const urls: string[] = [];
  
  Object.values(APPROVED_LINKS.site).forEach(url => urls.push(url));
  Object.values(APPROVED_LINKS.products).forEach(url => urls.push(url));
  Object.values(APPROVED_LINKS.ordering).forEach(url => urls.push(url));
  
  return urls;
}

// Count of approved URLs (for verification)
export const APPROVED_URL_COUNT = getAllUrls().length; // Should be 22

