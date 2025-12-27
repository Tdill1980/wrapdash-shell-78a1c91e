/**
 * Sabri Suby Grid Overlay Templates
 * 
 * Deterministic overlay templates for different content goals.
 * These are used instead of AI generation to ensure consistent, on-brand messaging.
 */

export type OverlayRole =
  | "pain"
  | "agitate"
  | "proof"
  | "solution"
  | "outcome"
  | "cta";

export interface GridOverlay {
  slot: 1 | 2 | 3 | 4;
  text: string;
  role: OverlayRole;
}

export interface EndFrame {
  text: string;
  role: "cta";
}

/**
 * SABRI – Price Drop (Grid Style)
 * Use when:
 * - content_goal = price_drop
 * - persuasion_style = sabri
 */
export const SABRI_GRID_PRICE_DROP: GridOverlay[] = [
  {
    slot: 1,
    text: "Margins getting tight?",
    role: "pain",
  },
  {
    slot: 2,
    text: "Same 3M IJ180 film",
    role: "proof",
  },
  {
    slot: 3,
    text: "Now $5.27 / sq ft",
    role: "solution",
  },
  {
    slot: 4,
    text: "More profit per job",
    role: "outcome",
  },
];

export const SABRI_END_FRAME: EndFrame = {
  text: "Limited time. Shop WePrintWraps.com",
  role: "cta",
};

/**
 * SABRI – New Product Launch
 */
export const SABRI_GRID_NEW_PRODUCT: GridOverlay[] = [
  {
    slot: 1,
    text: "Looking for something fresh?",
    role: "pain",
  },
  {
    slot: 2,
    text: "Meet the new collection",
    role: "solution",
  },
  {
    slot: 3,
    text: "Pro-tested, installer approved",
    role: "proof",
  },
  {
    slot: 4,
    text: "Level up your installs",
    role: "outcome",
  },
];

/**
 * SABRI – Commercial Fleet
 */
export const SABRI_GRID_COMMERCIAL: GridOverlay[] = [
  {
    slot: 1,
    text: "Fleet branding that lasts",
    role: "pain",
  },
  {
    slot: 2,
    text: "Premium commercial grade",
    role: "proof",
  },
  {
    slot: 3,
    text: "Roll it. Apply it. Done.",
    role: "solution",
  },
  {
    slot: 4,
    text: "Your brand, everywhere",
    role: "outcome",
  },
];

/**
 * SABRI – Restyle/Color Change
 */
export const SABRI_GRID_RESTYLE: GridOverlay[] = [
  {
    slot: 1,
    text: "Ready for a new look?",
    role: "pain",
  },
  {
    slot: 2,
    text: "Same car. Total transformation.",
    role: "solution",
  },
  {
    slot: 3,
    text: "Premium wrap film",
    role: "proof",
  },
  {
    slot: 4,
    text: "Turn heads everywhere",
    role: "outcome",
  },
];

/**
 * Get overlay template by content goal
 */
export function getSabriGridTemplate(contentGoal: string): GridOverlay[] {
  switch (contentGoal) {
    case "price_drop":
    case "promotion":
      return SABRI_GRID_PRICE_DROP;
    case "new_product":
    case "launch":
      return SABRI_GRID_NEW_PRODUCT;
    case "commercial":
    case "fleet":
      return SABRI_GRID_COMMERCIAL;
    case "restyle":
    case "color_change":
      return SABRI_GRID_RESTYLE;
    default:
      return SABRI_GRID_RESTYLE; // Default fallback
  }
}
