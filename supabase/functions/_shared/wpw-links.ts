// WePrintWraps Approved Links - Single Source of Truth
// Jordan Lee and other agents ONLY use links from this map
// Prevents hallucinated URLs

export const APPROVED_LINKS = {
  products: {
    custom_printed_wraps: "https://weprintwraps.com/products/custom-printed-wraps",
    commercialpro: "https://weprintwraps.com/pages/commercialpro",
    restylepro: "https://weprintwraps.com/pages/restylepro",
    laminates: "https://weprintwraps.com/collections/laminates",
    // Core product pages from PDF
    wall_wrap: "https://weprintwraps.com/our-products/wall-wrap-printed-vinyl/",
    custom_wrap_design: "https://weprintwraps.com/our-products/custom-wrap-design/",
    design_setup_file_output: "https://weprintwraps.com/our-products/design-setup-file-output/",
    pre_designed_fade_wraps: "https://weprintwraps.com/our-products/pre-designed-fade-wraps/",
    avery_1105: "https://weprintwraps.com/our-products/avery-1105egrs-with-doz13607-lamination/",
    "3m_ij180": "https://weprintwraps.com/our-products/3m-ij180-printed-wrap-film/",
    avery_cut_contour: "https://weprintwraps.com/our-products/avery-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/",
    "3m_cut_contour": "https://weprintwraps.com/our-products/3m-cut-contour-vinyl-graphics-54-roll-max-artwork-size-50/",
    perforated_window: "https://weprintwraps.com/our-products/perforated-window-vinyl-50-50-unlaminated/",
    // Wrap By The Yard collections
    wbty_wicked_wild: "https://weprintwraps.com/our-products/wrap-by-the-yard-wicked-wild-wrap-prints/",
    wbty_bape_camo: "https://weprintwraps.com/our-products/wrap-by-the-yard-bape-camo/",
    wbty_modern_trippy: "https://weprintwraps.com/our-products/wrap-by-the-yard-modern-trippy/",
    wbty_metal_marble: "https://weprintwraps.com/our-products/wrap-by-the-yard-metal-marble/",
    wbty_camo_carbon: "https://weprintwraps.com/our-products/camo-carbon-wrap-by-the-yard/",
  },
  ordering: {
    homepage_quote: "https://weprintwraps.com/#quote",
    upload_artwork: "https://weprintwraps.com/pages/upload-artwork",
    login: "https://weprintwraps.com/my-account",
  },
  rewards: {
    clubwpw: "https://weprintwraps.com/pages/clubwpw",
  },
  apps: {
    ink_and_edge: "https://inkandedgemagazine.com",
    wrapcommandai: "https://weprintwraps.com/pages/wrapcommandai",
  },
} as const;

// Helper to format links for system prompt injection
export function getApprovedLinksForPrompt(): string {
  return `
APPROVED LINKS (use ONLY these - never invent URLs):
- Custom Printed Wraps: ${APPROVED_LINKS.products.custom_printed_wraps}
- CommercialPro (fleets/business): ${APPROVED_LINKS.products.commercialpro}
- RestylePro (restyle/enthusiast): ${APPROVED_LINKS.products.restylepro}
- Avery 1105 Printed Wrap: ${APPROVED_LINKS.products.avery_1105}
- 3M IJ180 Printed Wrap: ${APPROVED_LINKS.products["3m_ij180"]}
- Avery Cut Contour Vinyl: ${APPROVED_LINKS.products.avery_cut_contour}
- 3M Cut Contour Vinyl: ${APPROVED_LINKS.products["3m_cut_contour"]}
- Perforated Window Vinyl: ${APPROVED_LINKS.products.perforated_window}
- Pre-Designed Fade Wraps: ${APPROVED_LINKS.products.pre_designed_fade_wraps}
- Wrap By The Yard - Wicked Wild: ${APPROVED_LINKS.products.wbty_wicked_wild}
- Wrap By The Yard - Bape Camo: ${APPROVED_LINKS.products.wbty_bape_camo}
- Homepage Quote Tool: ${APPROVED_LINKS.ordering.homepage_quote}
- Upload Artwork: ${APPROVED_LINKS.ordering.upload_artwork}
- Account Login: ${APPROVED_LINKS.ordering.login}
- ClubWPW Rewards: ${APPROVED_LINKS.rewards.clubwpw}
- Ink & Edge Magazine: ${APPROVED_LINKS.apps.ink_and_edge}
- WrapCommandAI: ${APPROVED_LINKS.apps.wrapcommandai}`;
}

// Link-aware behavior rules for system prompt
export const LINK_AWARE_RULES = `
────────────────────────────────────
LINK-AWARE BEHAVIOR (CRITICAL)
────────────────────────────────────

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
• User asks about rewards, apps, or platforms → offer relevant link
• User asks about CommercialPro or RestylePro → explain + offer link

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

────────────────────────────────────
PLATFORM ROUTING KNOWLEDGE
────────────────────────────────────

• For businesses / fleets / repeat orders → CommercialPro
• For custom, restyle, enthusiast wraps → RestylePro
• For standard online orders → WePrintWraps.com

────────────────────────────────────
CLUBWPW ELITE REWARDS
────────────────────────────────────

You may:
• Ask if the customer is logged in
• Offer to help them sign in or create an account
• Explain rewards points, discounts, and perks
• Mention points earnings on orders
• Explain how rewards apply at checkout

If they are not logged in:
→ Offer to help them log in before checkout.

────────────────────────────────────
ECOSYSTEM KNOWLEDGE
────────────────────────────────────

You know and can explain:

• Ink & Edge Magazine
  – Industry publication for wrap culture
  – Features trends, tips, and community stories

• RestylePro
  – Visualizer & restyle tools for enthusiasts
  – Design-forward ordering experience

• WrapCommandAI
  – Backend order, quote, and automation system
  – Powers chat, quotes, follow-ups, and workflows
`;
