// Template OS - Grid Templates (9 Total)
// WPW (5) + RestylePro (4)

export interface GridTemplate {
  id: string;
  name: string;
  brand: "wpw" | "restylepro" | "both";
  gridSize: "3x3" | "4x4";
  searchBarText: string;
  searchBarVariants: string[];
  description: string;
  useCase: string;
  imageSlots: number;
  overlayText: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  cellConfig: {
    cropRule: "center" | "tight" | "full";
    aspectRatio: string;
  };
  suggestedAssetTypes: string[];
}

export const GRID_TEMPLATES: Record<string, GridTemplate> = {
  // ═══════════════════════════════════════════════════════════════
  // WPW TEMPLATES (5)
  // ═══════════════════════════════════════════════════════════════
  
  wpw_premium_moodboard: {
    id: "wpw_premium_moodboard",
    name: "WPW Premium Print Moodboard",
    brand: "wpw",
    gridSize: "3x3",
    searchBarText: "PREMIUM WRAP PRINTING",
    searchBarVariants: [
      "WRAP SHOP MOODBOARD",
      "PREMIUM PRINT INSPIRATION",
      "CAR WRAP DESIGN IDEAS",
      "PRO-LEVEL WRAP PRINTING",
    ],
    description: "Clean 3×3 grid showcasing premium print quality, installs, and brand craft",
    useCase: "Brand awareness, portfolio showcase, installer targeting",
    imageSlots: 9,
    overlayText: {
      headline: "Upgrade your wraps. Elevate your print.",
      subheadline: "Premium printing for pro-level wrap shops",
      cta: "WEPRINTWRAPS.COM",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["installs", "close-ups", "renders", "ppf", "textures", "commercial", "fades", "patterns"],
  },

  wpw_before_after_grid: {
    id: "wpw_before_after_grid",
    name: "Before & After Grid",
    brand: "wpw",
    gridSize: "3x3",
    searchBarText: "BEFORE & AFTER: THE PRINT DIFFERENCE",
    searchBarVariants: [
      "THE PRINT DIFFERENCE",
      "TRANSFORMATION GALLERY",
      "BEFORE → AFTER",
    ],
    description: "Left column shows 'before' prints, right columns show 'after' WPW quality",
    useCase: "Quality comparison, conversion-focused",
    imageSlots: 9,
    overlayText: {
      headline: "When the print is right, the wrap installs clean.",
      subheadline: "See the difference pro printing makes",
      cta: "ORDER AT WEPRINTWRAPS.COM",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["before-shots", "after-shots", "comparison", "detail-shots"],
  },

  wpw_us_vs_them: {
    id: "wpw_us_vs_them",
    name: "US vs THEM Comparison Grid",
    brand: "wpw",
    gridSize: "3x3",
    searchBarText: "PRO PRINT VS CHEAP PRINT",
    searchBarVariants: [
      "QUALITY COMPARISON",
      "WHY WPW WINS",
      "THE REAL DIFFERENCE",
    ],
    description: "Top row shows competitor 'cheap print' issues, bottom rows show WPW quality",
    useCase: "Competitive positioning, pain point targeting",
    imageSlots: 9,
    overlayText: {
      headline: "Good installers deserve good print.",
      subheadline: "Stop fixing bad prints in the field",
      cta: "WEPRINTWRAPS.COM",
    },
    cellConfig: {
      cropRule: "tight",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["bad-print-examples", "wpw-quality", "comparison", "close-ups"],
  },

  wpw_show_car_awards: {
    id: "wpw_show_car_awards",
    name: "Show Car Awards Grid",
    brand: "wpw",
    gridSize: "3x3",
    searchBarText: "AWARD-WINNING WRAPS",
    searchBarVariants: [
      "SHOW CAR GALLERY",
      "TROPHY-WINNING PRINTS",
      "COMPETITION WINNERS",
    ],
    description: "Award-winning vehicles printed by WPW with trophies and detail shots",
    useCase: "Authority building, enthusiast targeting",
    imageSlots: 9,
    overlayText: {
      headline: "Award-winning wraps start with award-winning printing.",
      subheadline: "Trusted by show car champions",
      cta: "WEPRINTWRAPS.COM",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["show-cars", "trophies", "detail-shots", "awards", "competitions"],
  },

  wpw_commercial_fleet: {
    id: "wpw_commercial_fleet",
    name: "Commercial Wrap Grid",
    brand: "wpw",
    gridSize: "3x3",
    searchBarText: "COMMERCIAL WRAPS THAT WIN CLIENTS",
    searchBarVariants: [
      "FLEET WRAP GALLERY",
      "COMMERCIAL PRINTING",
      "BRAND YOUR FLEET",
    ],
    description: "Fleet vans, box trucks, service vehicles, branded wraps",
    useCase: "Commercial B2B targeting, fleet managers",
    imageSlots: 9,
    overlayText: {
      headline: "Premium printing for pro-level wrap shops.",
      subheadline: "Brand consistency across every vehicle",
      cta: "WEPRINTWRAPS.COM",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["fleet-vans", "box-trucks", "service-vehicles", "branded-wraps", "logo-closeups"],
  },

  // ═══════════════════════════════════════════════════════════════
  // RESTYLEPRO TEMPLATES (4)
  // ═══════════════════════════════════════════════════════════════

  rsp_visualizer_gallery: {
    id: "rsp_visualizer_gallery",
    name: "RestylePro Visualizer Gallery",
    brand: "restylepro",
    gridSize: "3x3",
    searchBarText: "RESTYLEPRO WRAP IDEAS",
    searchBarVariants: [
      "VISUALIZER RENDER GALLERY",
      "INSTANT WRAP PREVIEWS",
      "5-SECOND WRAP DEMOS",
    ],
    description: "9 different RestylePro renders showing instant visualization power",
    useCase: "App demo, installer tool targeting",
    imageSlots: 9,
    overlayText: {
      headline: "5-second wrap previews.",
      subheadline: "Show customers the wrap BEFORE you wrap",
      cta: "RESTYLEPRO.AI",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["renders", "color-swaps", "ppf-demos", "visualizations"],
  },

  rsp_patternpro_grid: {
    id: "rsp_patternpro_grid",
    name: "PatternPro Swatch Grid",
    brand: "restylepro",
    gridSize: "3x3",
    searchBarText: "PATTERNPRO DESIGNS",
    searchBarVariants: [
      "PATTERN GALLERY",
      "CUSTOM WRAP PATTERNS",
      "DESIGN LIBRARY",
    ],
    description: "Patterns displayed like fabric swatches",
    useCase: "Pattern sales, creative inspiration",
    imageSlots: 9,
    overlayText: {
      headline: "Unlimited wrap patterns.",
      subheadline: "Create unique designs in seconds",
      cta: "PATTERNPRO.AI",
    },
    cellConfig: {
      cropRule: "full",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["patterns", "swatches", "designs", "textures"],
  },

  rsp_designpanelpro_grid: {
    id: "rsp_designpanelpro_grid",
    name: "DesignPanelPro Before/After Grid",
    brand: "restylepro",
    gridSize: "3x3",
    searchBarText: "DESIGNPANELPRO GALLERY",
    searchBarVariants: [
      "PANEL-READY DESIGNS",
      "PRINT-READY OUTPUT",
      "DESIGN → PRINT",
    ],
    description: "Before (blank) vs after (panelized design) comparison",
    useCase: "Design tool demo, print-ready workflow",
    imageSlots: 9,
    overlayText: {
      headline: "Design to print-ready in minutes.",
      subheadline: "Panel-perfect output every time",
      cta: "DESIGNPANELPRO.AI",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["blank-panels", "designed-panels", "before-after", "output-samples"],
  },

  rsp_ecosystem_grid: {
    id: "rsp_ecosystem_grid",
    name: "RestylePro Ecosystem Grid",
    brand: "restylepro",
    gridSize: "3x3",
    searchBarText: "THE WRAP SHOP TOOLKIT",
    searchBarVariants: [
      "RESTYLEPRO SUITE",
      "ALL-IN-ONE WRAP TOOLS",
      "THE COMPLETE SYSTEM",
    ],
    description: "Mixed grid showing RestylePro + PatternPro + DesignPanelPro + PPF",
    useCase: "Full suite promotion, ecosystem awareness",
    imageSlots: 9,
    overlayText: {
      headline: "The Wrap Shop Operating System.",
      subheadline: "Visualize. Design. Print. Repeat.",
      cta: "RESTYLEPRO.AI",
    },
    cellConfig: {
      cropRule: "center",
      aspectRatio: "1:1",
    },
    suggestedAssetTypes: ["restylepro-renders", "patternpro-designs", "designpanelpro-output", "ppf-demos"],
  },
};

export const getGridTemplatesByBrand = (brand: "wpw" | "restylepro" | "both"): GridTemplate[] => {
  return Object.values(GRID_TEMPLATES).filter(
    (t) => t.brand === brand || t.brand === "both" || brand === "both"
  );
};

export const getGridTemplateById = (id: string): GridTemplate | undefined => {
  return GRID_TEMPLATES[id];
};
