// Template OS - Reel/Video Templates (10 Total)

export interface ReelTemplate {
  id: string;
  name: string;
  brand: "wpw" | "restylepro" | "both";
  duration: number; // seconds
  description: string;
  useCase: string;
  structure: {
    scenes: ReelScene[];
  };
  suggestedAudio: string[];
  hookVariations: string[];
  ctaVariations: string[];
}

export interface ReelScene {
  id: string;
  name: string;
  duration: number; // seconds
  type: "hero" | "grid_reveal" | "before_after" | "text_overlay" | "product_shot" | "cta";
  animation: "fade" | "slide_up" | "slide_left" | "zoom_in" | "reveal_swipe" | "grid_pop";
  textOverlay?: {
    position: "top" | "center" | "bottom";
    style: "bold" | "subtle" | "animated";
  };
}

export const REEL_TEMPLATES: Record<string, ReelTemplate> = {
  // ═══════════════════════════════════════════════════════════════
  // WPW REEL TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  moodboard_reel: {
    id: "moodboard_reel",
    name: "Moodboard Reel",
    brand: "wpw",
    duration: 15,
    description: "Animated 3×3 grid with staggered reveal of premium prints",
    useCase: "Brand awareness, portfolio showcase",
    structure: {
      scenes: [
        { id: "s1", name: "Search bar intro", duration: 2, type: "text_overlay", animation: "slide_up", textOverlay: { position: "top", style: "bold" } },
        { id: "s2", name: "Grid cell 1-3", duration: 3, type: "grid_reveal", animation: "grid_pop" },
        { id: "s3", name: "Grid cell 4-6", duration: 3, type: "grid_reveal", animation: "grid_pop" },
        { id: "s4", name: "Grid cell 7-9", duration: 3, type: "grid_reveal", animation: "grid_pop" },
        { id: "s5", name: "Full grid + CTA", duration: 4, type: "cta", animation: "fade", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["upbeat-corporate", "modern-tech", "inspiring-ambient"],
    hookVariations: [
      "PREMIUM PRINT GALLERY",
      "WRAP SHOP MOODBOARD",
      "PRO-LEVEL PRINTING",
    ],
    ctaVariations: [
      "WEPRINTWRAPS.COM",
      "Order Now →",
      "See Quality",
    ],
  },

  before_after_reveal: {
    id: "before_after_reveal",
    name: "Before & After Reveal",
    brand: "both",
    duration: 8,
    description: "Dramatic swipe transition from before to after",
    useCase: "Transformation showcase, engagement driver",
    structure: {
      scenes: [
        { id: "s1", name: "Before shot", duration: 2, type: "before_after", animation: "fade", textOverlay: { position: "top", style: "subtle" } },
        { id: "s2", name: "Swipe transition", duration: 2, type: "before_after", animation: "reveal_swipe" },
        { id: "s3", name: "After reveal", duration: 3, type: "hero", animation: "zoom_in" },
        { id: "s4", name: "CTA", duration: 1, type: "cta", animation: "slide_up", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["dramatic-reveal", "whoosh-transition", "uplifting-drop"],
    hookVariations: [
      "SWIPE →",
      "WATCH THIS",
      "THE DIFFERENCE",
    ],
    ctaVariations: [
      "See More Transformations",
      "Order Now",
      "Link in Bio",
    ],
  },

  installer_pov_squeegee: {
    id: "installer_pov_squeegee",
    name: "Installer POV Squeegee",
    brand: "wpw",
    duration: 12,
    description: "First-person view of clean install with satisfying squeegee action",
    useCase: "Installer targeting, ASMR engagement",
    structure: {
      scenes: [
        { id: "s1", name: "Hook text", duration: 2, type: "text_overlay", animation: "slide_up", textOverlay: { position: "center", style: "bold" } },
        { id: "s2", name: "POV squeegee action", duration: 6, type: "hero", animation: "fade" },
        { id: "s3", name: "Final reveal", duration: 2, type: "product_shot", animation: "zoom_in" },
        { id: "s4", name: "CTA + logo", duration: 2, type: "cta", animation: "fade", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["asmr-satisfying", "minimal-ambient", "clean-pop"],
    hookVariations: [
      "When the print is right...",
      "Satisfying installs only",
      "This is pro print",
    ],
    ctaVariations: [
      "WEPRINTWRAPS.COM",
      "Get Clean Prints",
      "Order Now",
    ],
  },

  grid_reveal_reel: {
    id: "grid_reveal_reel",
    name: "Grid Reveal Reel",
    brand: "both",
    duration: 10,
    description: "Each grid cell pops in with subtle animation",
    useCase: "Portfolio showcase, brand awareness",
    structure: {
      scenes: [
        { id: "s1", name: "Empty grid + title", duration: 1.5, type: "text_overlay", animation: "fade", textOverlay: { position: "top", style: "bold" } },
        { id: "s2", name: "Cells 1-9 pop", duration: 6, type: "grid_reveal", animation: "grid_pop" },
        { id: "s3", name: "Hold full grid", duration: 1.5, type: "hero", animation: "fade" },
        { id: "s4", name: "CTA overlay", duration: 1, type: "cta", animation: "slide_up", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["upbeat-pop", "modern-electronic", "catchy-beat"],
    hookVariations: [
      "Our recent work",
      "Portfolio drop",
      "Quality gallery",
    ],
    ctaVariations: [
      "See More",
      "Follow for more",
      "Link in bio",
    ],
  },

  commercial_fleet_reel: {
    id: "commercial_fleet_reel",
    name: "Commercial Fleet Reel",
    brand: "wpw",
    duration: 15,
    description: "Multiple fleet vehicles showcasing brand consistency",
    useCase: "B2B commercial targeting",
    structure: {
      scenes: [
        { id: "s1", name: "Hook headline", duration: 2, type: "text_overlay", animation: "slide_up", textOverlay: { position: "center", style: "bold" } },
        { id: "s2", name: "Vehicle 1", duration: 3, type: "hero", animation: "slide_left" },
        { id: "s3", name: "Vehicle 2", duration: 3, type: "hero", animation: "slide_left" },
        { id: "s4", name: "Vehicle 3", duration: 3, type: "hero", animation: "slide_left" },
        { id: "s5", name: "Fleet lineup + CTA", duration: 4, type: "cta", animation: "zoom_in", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["corporate-professional", "confident-brand", "modern-business"],
    hookVariations: [
      "Fleet branding done right",
      "Brand consistency matters",
      "Commercial-grade printing",
    ],
    ctaVariations: [
      "Get Fleet Pricing",
      "Request Quote",
      "WEPRINTWRAPS.COM",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // RESTYLEPRO REEL TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  app_demo_reel: {
    id: "app_demo_reel",
    name: "App Demo Reel (RestylePro)",
    brand: "restylepro",
    duration: 12,
    description: "Phone mockup showing app in action with color swap demo",
    useCase: "App promotion, feature demonstration",
    structure: {
      scenes: [
        { id: "s1", name: "Problem hook", duration: 2, type: "text_overlay", animation: "slide_up", textOverlay: { position: "center", style: "bold" } },
        { id: "s2", name: "Phone with app", duration: 3, type: "hero", animation: "zoom_in" },
        { id: "s3", name: "Color swap demo", duration: 4, type: "product_shot", animation: "fade" },
        { id: "s4", name: "Result + CTA", duration: 3, type: "cta", animation: "slide_up", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["tech-modern", "app-demo", "upbeat-digital"],
    hookVariations: [
      "Customers can't visualize?",
      "5 seconds to wow",
      "Show them the wrap",
    ],
    ctaVariations: [
      "Try Free",
      "RESTYLEPRO.AI",
      "See Demo",
    ],
  },

  patternpro_animation: {
    id: "patternpro_animation",
    name: "PatternPro Animation",
    brand: "restylepro",
    duration: 10,
    description: "Animated pattern showcase with vehicle application",
    useCase: "Pattern feature promotion",
    structure: {
      scenes: [
        { id: "s1", name: "Pattern grid intro", duration: 2, type: "grid_reveal", animation: "grid_pop" },
        { id: "s2", name: "Pattern selection", duration: 3, type: "product_shot", animation: "zoom_in" },
        { id: "s3", name: "Apply to vehicle", duration: 3, type: "hero", animation: "fade" },
        { id: "s4", name: "CTA", duration: 2, type: "cta", animation: "slide_up", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["creative-modern", "pattern-beat", "design-flow"],
    hookVariations: [
      "Unlimited patterns",
      "Custom wrap designs",
      "Create unique wraps",
    ],
    ctaVariations: [
      "Try PatternPro",
      "Design Now",
      "PATTERNPRO.AI",
    ],
  },

  problem_solution_reel: {
    id: "problem_solution_reel",
    name: "Problem → Solution Reel",
    brand: "both",
    duration: 10,
    description: "Visual problem statement followed by solution reveal",
    useCase: "Pain point targeting, conversion-focused",
    structure: {
      scenes: [
        { id: "s1", name: "Problem statement", duration: 3, type: "text_overlay", animation: "slide_up", textOverlay: { position: "center", style: "bold" } },
        { id: "s2", name: "Problem visual", duration: 2, type: "hero", animation: "fade" },
        { id: "s3", name: "Solution reveal", duration: 3, type: "hero", animation: "reveal_swipe" },
        { id: "s4", name: "CTA", duration: 2, type: "cta", animation: "slide_up", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["tension-release", "problem-solve", "dramatic-positive"],
    hookVariations: [
      "Bad print?",
      "Losing jobs?",
      "Customers confused?",
    ],
    ctaVariations: [
      "Fix it now",
      "Get Started",
      "Learn More",
    ],
  },

  show_car_winner_reel: {
    id: "show_car_winner_reel",
    name: "Show Car Winner Reel",
    brand: "wpw",
    duration: 15,
    description: "Award-winning vehicle showcase with trophy reveal",
    useCase: "Authority building, enthusiast targeting",
    structure: {
      scenes: [
        { id: "s1", name: "Trophy shot", duration: 2, type: "hero", animation: "zoom_in" },
        { id: "s2", name: "Vehicle reveal", duration: 4, type: "hero", animation: "slide_left" },
        { id: "s3", name: "Detail shots", duration: 4, type: "product_shot", animation: "fade" },
        { id: "s4", name: "WPW print callout", duration: 3, type: "text_overlay", animation: "slide_up", textOverlay: { position: "center", style: "bold" } },
        { id: "s5", name: "CTA", duration: 2, type: "cta", animation: "fade", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["epic-reveal", "champion-theme", "prestige-moment"],
    hookVariations: [
      "Award-winning print",
      "Champions trust WPW",
      "Where winners print",
    ],
    ctaVariations: [
      "Join the winners",
      "WEPRINTWRAPS.COM",
      "Order Now",
    ],
  },

  promo_swipe_up_reel: {
    id: "promo_swipe_up_reel",
    name: "Promo Swipe Up Reel",
    brand: "both",
    duration: 8,
    description: "Quick promo with urgent CTA",
    useCase: "Sales, limited offers, conversions",
    structure: {
      scenes: [
        { id: "s1", name: "Attention hook", duration: 1.5, type: "text_overlay", animation: "zoom_in", textOverlay: { position: "center", style: "bold" } },
        { id: "s2", name: "Offer details", duration: 3, type: "text_overlay", animation: "slide_up", textOverlay: { position: "center", style: "animated" } },
        { id: "s3", name: "Product/visual", duration: 2, type: "hero", animation: "fade" },
        { id: "s4", name: "Urgent CTA", duration: 1.5, type: "cta", animation: "slide_up", textOverlay: { position: "bottom", style: "bold" } },
      ],
    },
    suggestedAudio: ["urgent-promo", "flash-sale", "countdown-beat"],
    hookVariations: [
      "LIMITED TIME",
      "FLASH SALE",
      "DON'T MISS THIS",
    ],
    ctaVariations: [
      "Shop Now →",
      "Use Code: PROPRINT",
      "Link in Bio",
    ],
  },
};

export const getReelTemplatesByBrand = (brand: "wpw" | "restylepro" | "both"): ReelTemplate[] => {
  return Object.values(REEL_TEMPLATES).filter(
    (t) => t.brand === brand || t.brand === "both" || brand === "both"
  );
};

export const getReelTemplateById = (id: string): ReelTemplate | undefined => {
  return REEL_TEMPLATES[id];
};
