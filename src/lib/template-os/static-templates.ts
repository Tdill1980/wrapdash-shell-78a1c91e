// Template OS - Static High-Converting Templates (12 Total)

export interface StaticTemplate {
  id: string;
  name: string;
  brand: "wpw" | "restylepro" | "both";
  category: "comparison" | "showcase" | "social_proof" | "app_demo" | "promo";
  description: string;
  useCase: string;
  layout: {
    type: "split" | "hero" | "grid" | "overlay" | "feature_list";
    orientation?: "horizontal" | "vertical";
    imagePosition?: "left" | "right" | "center" | "background";
  };
  sizes: {
    instagram_feed: { width: number; height: number };
    instagram_story: { width: number; height: number };
    facebook_ad: { width: number; height: number };
  };
  textZones: {
    headline: { position: string; maxChars: number };
    subheadline: { position: string; maxChars: number };
    cta: { position: string; maxChars: number };
  };
  defaultCopy: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  variations: string[];
}

export const STATIC_TEMPLATES: Record<string, StaticTemplate> = {
  // ═══════════════════════════════════════════════════════════════
  // COMPARISON TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  before_after_static: {
    id: "before_after_static",
    name: "Before & After (Static)",
    brand: "both",
    category: "comparison",
    description: "Large left/right split showing transformation",
    useCase: "Quality demonstration, conversion-focused",
    layout: {
      type: "split",
      orientation: "horizontal",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 40 },
      subheadline: { position: "bottom-center", maxChars: 60 },
      cta: { position: "bottom-right", maxChars: 25 },
    },
    defaultCopy: {
      headline: "THIS is what pro print looks like.",
      subheadline: "See the difference quality makes",
      cta: "Order Now",
    },
    variations: [
      "The Print Difference",
      "Before → After",
      "Transform Your Wraps",
    ],
  },

  before_after_swipe: {
    id: "before_after_swipe",
    name: "Before & After (Swipe Reveal)",
    brand: "both",
    category: "comparison",
    description: "3-second swipe transition from before to after",
    useCase: "Engagement-focused, reel/story format",
    layout: {
      type: "overlay",
      orientation: "vertical",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 30 },
      subheadline: { position: "center", maxChars: 40 },
      cta: { position: "bottom-center", maxChars: 20 },
    },
    defaultCopy: {
      headline: "SWIPE →",
      subheadline: "Watch the transformation",
      cta: "See More",
    },
    variations: [
      "Swipe to reveal",
      "The magic moment",
      "Transformation time",
    ],
  },

  us_vs_them: {
    id: "us_vs_them",
    name: "US vs THEM Side-by-Side",
    brand: "wpw",
    category: "comparison",
    description: "Dark overlay for THEM, bright crisp overlay for US",
    useCase: "Competitive positioning, pain point targeting",
    layout: {
      type: "split",
      orientation: "horizontal",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 35 },
      subheadline: { position: "bottom-center", maxChars: 50 },
      cta: { position: "bottom-right", maxChars: 25 },
    },
    defaultCopy: {
      headline: "PRO RESULTS. NOT PROBLEMS.",
      subheadline: "Stop fixing bad prints in the field",
      cta: "Switch to WPW",
    },
    variations: [
      "Cheap vs Pro",
      "Their print vs Our print",
      "Why shops switch",
    ],
  },

  problem_solution: {
    id: "problem_solution",
    name: "Problem → Solution",
    brand: "both",
    category: "comparison",
    description: "Visual problem (grain, banding) → Clean WPW print",
    useCase: "Pain point targeting, problem-aware audience",
    layout: {
      type: "split",
      orientation: "vertical",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-left", maxChars: 40 },
      subheadline: { position: "center-right", maxChars: 50 },
      cta: { position: "bottom-center", maxChars: 25 },
    },
    defaultCopy: {
      headline: "Stop fixing prints in the field.",
      subheadline: "Get it right the first time",
      cta: "Order Now",
    },
    variations: [
      "The problem with cheap print",
      "Why installs fail",
      "Fix your print partner",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SHOWCASE TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  premium_craft_closeup: {
    id: "premium_craft_closeup",
    name: "Premium Craft Close-Ups",
    brand: "wpw",
    category: "showcase",
    description: "Macro shots of lamination, gradients, edges",
    useCase: "Quality showcase, craft-focused",
    layout: {
      type: "hero",
      imagePosition: "center",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "bottom-left", maxChars: 35 },
      subheadline: { position: "bottom-left", maxChars: 50 },
      cta: { position: "bottom-right", maxChars: 20 },
    },
    defaultCopy: {
      headline: "Craft matters. Print it right.",
      subheadline: "Premium lamination, perfect gradients",
      cta: "See Quality",
    },
    variations: [
      "The details matter",
      "Close-up perfection",
      "Quality you can see",
    ],
  },

  feature_benefits: {
    id: "feature_benefits",
    name: "Feature Benefits Callout",
    brand: "both",
    category: "showcase",
    description: "Top: Big bold reason, Bottom: 3 bullet benefits",
    useCase: "Feature communication, installer targeting",
    layout: {
      type: "feature_list",
      imagePosition: "left",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 40 },
      subheadline: { position: "center", maxChars: 100 },
      cta: { position: "bottom-center", maxChars: 25 },
    },
    defaultCopy: {
      headline: "Why Pro Shops Choose WPW",
      subheadline: "✓ UV inks, color-accurate\n✓ 1-2 day production\n✓ Coast-to-coast shipping",
      cta: "Get Started",
    },
    variations: [
      "3 reasons to switch",
      "What sets us apart",
      "The WPW difference",
    ],
  },

  show_car_winner: {
    id: "show_car_winner",
    name: "Show Car Winner",
    brand: "wpw",
    category: "showcase",
    description: "Hero vehicle + trophies showcase",
    useCase: "Authority building, enthusiast targeting",
    layout: {
      type: "hero",
      imagePosition: "center",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 45 },
      subheadline: { position: "bottom-center", maxChars: 50 },
      cta: { position: "bottom-right", maxChars: 20 },
    },
    defaultCopy: {
      headline: "Winning wraps start with winning printing.",
      subheadline: "Trusted by show car champions",
      cta: "Join Winners",
    },
    variations: [
      "Trophy-winning print",
      "Champions choose WPW",
      "Award-winning quality",
    ],
  },

  commercial_fleet: {
    id: "commercial_fleet",
    name: "Commercial Fleet Showcase",
    brand: "wpw",
    category: "showcase",
    description: "Brand consistency highlight for fleet vehicles",
    useCase: "Commercial B2B, fleet managers",
    layout: {
      type: "hero",
      imagePosition: "center",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-left", maxChars: 45 },
      subheadline: { position: "bottom-left", maxChars: 55 },
      cta: { position: "bottom-right", maxChars: 25 },
    },
    defaultCopy: {
      headline: "Your clients trust you. Trust your print partner.",
      subheadline: "Brand consistency across every vehicle",
      cta: "Fleet Pricing",
    },
    variations: [
      "Fleet-ready printing",
      "Consistent branding",
      "Commercial-grade quality",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL PROOF TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  social_proof_installer: {
    id: "social_proof_installer",
    name: "Social Proof (Installer Quote)",
    brand: "wpw",
    category: "social_proof",
    description: "Quote from a real shop or installer",
    useCase: "Trust building, testimonial-driven",
    layout: {
      type: "overlay",
      imagePosition: "background",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "center", maxChars: 120 },
      subheadline: { position: "bottom-center", maxChars: 40 },
      cta: { position: "bottom-right", maxChars: 20 },
    },
    defaultCopy: {
      headline: '"WPW prints are clean. Panels drop in perfectly."',
      subheadline: "— Pro Installer, Texas",
      cta: "Read Reviews",
    },
    variations: [
      "What installers say",
      "Real shop reviews",
      "Trusted by pros",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // APP DEMO TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  app_demo_visualizer: {
    id: "app_demo_visualizer",
    name: "App Demo (RestylePro)",
    brand: "restylepro",
    category: "app_demo",
    description: "Phone mockup showing RestylePro in action",
    useCase: "App promotion, tool demonstration",
    layout: {
      type: "hero",
      imagePosition: "center",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 45 },
      subheadline: { position: "bottom-center", maxChars: 50 },
      cta: { position: "bottom-center", maxChars: 20 },
    },
    defaultCopy: {
      headline: "Show customers the wrap BEFORE you wrap.",
      subheadline: "5-second previews that close deals",
      cta: "Try Free",
    },
    variations: [
      "See it before you wrap it",
      "Instant wrap previews",
      "Close jobs faster",
    ],
  },

  suite_overview: {
    id: "suite_overview",
    name: "Suite Overview (RestylePro)",
    brand: "restylepro",
    category: "app_demo",
    description: "Multi-app ecosystem showcase",
    useCase: "Full suite promotion, ecosystem awareness",
    layout: {
      type: "grid",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "top-center", maxChars: 40 },
      subheadline: { position: "center", maxChars: 60 },
      cta: { position: "bottom-center", maxChars: 25 },
    },
    defaultCopy: {
      headline: "The Wrap Shop Operating System.",
      subheadline: "RestylePro • PatternPro • DesignPanelPro",
      cta: "Explore Suite",
    },
    variations: [
      "All-in-one wrap tools",
      "The complete toolkit",
      "Everything you need",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PROMO TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  promo_cta: {
    id: "promo_cta",
    name: "Promo CTA",
    brand: "both",
    category: "promo",
    description: "Clean CTA-driven layout with promo code",
    useCase: "Sales, promotions, limited offers",
    layout: {
      type: "hero",
      imagePosition: "background",
    },
    sizes: {
      instagram_feed: { width: 1080, height: 1080 },
      instagram_story: { width: 1080, height: 1920 },
      facebook_ad: { width: 1080, height: 1350 },
    },
    textZones: {
      headline: { position: "center", maxChars: 35 },
      subheadline: { position: "center", maxChars: 45 },
      cta: { position: "bottom-center", maxChars: 30 },
    },
    defaultCopy: {
      headline: "LIMITED TIME OFFER",
      subheadline: "Use code PROPRINT for 10% off",
      cta: "Shop Now →",
    },
    variations: [
      "Flash sale",
      "New customer special",
      "First order discount",
    ],
  },
};

export const getStaticTemplatesByBrand = (brand: "wpw" | "restylepro" | "both"): StaticTemplate[] => {
  return Object.values(STATIC_TEMPLATES).filter(
    (t) => t.brand === brand || t.brand === "both" || brand === "both"
  );
};

export const getStaticTemplatesByCategory = (category: StaticTemplate["category"]): StaticTemplate[] => {
  return Object.values(STATIC_TEMPLATES).filter((t) => t.category === category);
};

export const getStaticTemplateById = (id: string): StaticTemplate | undefined => {
  return STATIC_TEMPLATES[id];
};
