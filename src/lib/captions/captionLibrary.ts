/**
 * Tag-Driven Caption Library
 * 
 * Pre-written captions that can be selected based on content tags.
 * Eliminates AI "thinking" and provides consistent, tested copy.
 */

export interface CaptionTemplate {
  id: string;
  tags: {
    wrap_type_category?: "commercial" | "restyle" | "ppf" | "tint";
    content_goal?: "price_drop" | "promotion" | "education" | "showcase" | "testimonial";
    persuasion_style?: "sabri" | "dara" | "clean";
  };
  caption: string;
  hashtags: string[];
}

export const CAPTION_LIBRARY: CaptionTemplate[] = [
  // ============ SABRI PRICE DROP ============
  {
    id: "sabri_price_drop_1",
    tags: {
      wrap_type_category: "commercial",
      content_goal: "price_drop",
      persuasion_style: "sabri",
    },
    caption:
      "Margins are tighter than ever.\n\nSo we dropped the price on 3M IJ180.\nSame premium film. Better profit per job.\n\nNow $5.27 / sq ft — limited time.",
    hashtags: [
      "#WePrintWraps",
      "#3MIJ180",
      "#WrapLife",
      "#WrapShops",
      "#BetterMargins",
    ],
  },
  {
    id: "sabri_price_drop_2",
    tags: {
      wrap_type_category: "commercial",
      content_goal: "price_drop",
      persuasion_style: "sabri",
    },
    caption:
      "If your costs go up, your margins disappear.\n\nThat's why we cut IJ180 pricing.\nNo compromise. Just better numbers.\n\nShop before pricing resets.",
    hashtags: [
      "#WrapBusiness",
      "#3MWrap",
      "#WePrintWraps",
      "#VinylWrap",
    ],
  },

  // ============ SABRI PROMOTION ============
  {
    id: "sabri_promo_1",
    tags: {
      wrap_type_category: "commercial",
      content_goal: "promotion",
      persuasion_style: "sabri",
    },
    caption:
      "Every installer knows:\nGood materials = Good margins.\n\nThis week only: Premium wrap film at installer pricing.\n\nDon't sleep on this.",
    hashtags: [
      "#WrapDeals",
      "#WePrintWraps",
      "#InstallerLife",
      "#WrapMaterials",
    ],
  },

  // ============ DARA RESTYLE ============
  {
    id: "dara_restyle_1",
    tags: {
      wrap_type_category: "restyle",
      content_goal: "showcase",
      persuasion_style: "dara",
    },
    caption:
      "POV: You finally pulled the trigger on that color change.\n\nSame car. Complete transformation.\nThis is what premium wrap film does.\n\n📍 Link in bio for the full reveal",
    hashtags: [
      "#ColorChange",
      "#WrapTransformation",
      "#CarWrap",
      "#WrapLife",
      "#Satisfying",
    ],
  },
  {
    id: "dara_restyle_2",
    tags: {
      wrap_type_category: "restyle",
      content_goal: "showcase",
      persuasion_style: "dara",
    },
    caption:
      "They said: \"Just get it painted.\"\n\nBut paint can't do THIS.\n\nRemovable. Customizable. Head-turning.\nThat's the wrap difference.",
    hashtags: [
      "#WrapVsPaint",
      "#VinylWrap",
      "#CarWrap",
      "#WePrintWraps",
    ],
  },

  // ============ CLEAN EDUCATION ============
  {
    id: "clean_education_1",
    tags: {
      content_goal: "education",
      persuasion_style: "clean",
    },
    caption:
      "Quick tip for installers:\n\nProper surface prep = cleaner install.\n\nWipe down. Tack off. Then apply.\n\nYour future self will thank you.",
    hashtags: [
      "#WrapTips",
      "#InstallerTips",
      "#VinylWrap",
      "#WrapEducation",
    ],
  },

  // ============ COMMERCIAL FLEET ============
  {
    id: "sabri_commercial_1",
    tags: {
      wrap_type_category: "commercial",
      content_goal: "showcase",
      persuasion_style: "sabri",
    },
    caption:
      "Your fleet is a moving billboard.\n\nMake it count.\n\nCommercial-grade wrap that handles the miles.\nYour brand, everywhere you go.",
    hashtags: [
      "#FleetWrap",
      "#CommercialWrap",
      "#VehicleBranding",
      "#WePrintWraps",
    ],
  },

  // ============ PPF ============
  {
    id: "clean_ppf_1",
    tags: {
      wrap_type_category: "ppf",
      content_goal: "education",
      persuasion_style: "clean",
    },
    caption:
      "Paint Protection Film:\nInvisible armor for your investment.\n\nRock chips? Handled.\nBird drops? No problem.\nPeace of mind? Included.",
    hashtags: [
      "#PPF",
      "#PaintProtection",
      "#ClearBra",
      "#CarCare",
    ],
  },
];

/**
 * Select a caption template based on tags
 * Returns a random match to avoid repetition
 */
export function selectCaptionFromTags(tags: {
  wrap_type_category?: string;
  content_goal?: string;
  persuasion_style?: string;
}): CaptionTemplate | null {
  const matches = CAPTION_LIBRARY.filter((c) => {
    const categoryMatch = !c.tags.wrap_type_category || 
      c.tags.wrap_type_category === tags.wrap_type_category;
    const goalMatch = !c.tags.content_goal || 
      c.tags.content_goal === tags.content_goal;
    const styleMatch = !c.tags.persuasion_style || 
      c.tags.persuasion_style === tags.persuasion_style;
    
    return categoryMatch && goalMatch && styleMatch;
  });

  if (matches.length === 0) return null;

  // Rotate to avoid repetition
  return matches[Math.floor(Math.random() * matches.length)];
}

/**
 * Get all captions for a specific style
 */
export function getCaptionsByStyle(style: "sabri" | "dara" | "clean"): CaptionTemplate[] {
  return CAPTION_LIBRARY.filter((c) => c.tags.persuasion_style === style);
}

/**
 * Get all captions for a specific goal
 */
export function getCaptionsByGoal(goal: string): CaptionTemplate[] {
  return CAPTION_LIBRARY.filter((c) => c.tags.content_goal === goal);
}
