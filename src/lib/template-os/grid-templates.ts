// Template OS - Grid Templates (18 Total: 9 base × 2 sizes)
// WPW (5) + RestylePro (4) × (3x3 + 4x4)

export type GridSize = "3x3" | "4x4";

export interface GridTemplate {
  id: string;
  name: string;
  brand: "wpw" | "restylepro" | "both";
  gridSize: GridSize;
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
    gap: number;
  };
  suggestedAssetTypes: string[];
  searchBarStyle: {
    enabled: boolean;
    position: "top" | "bottom";
    font: string;
    iconPosition: "left" | "right";
  };
}

// Helper to create both 3x3 and 4x4 variants
const createGridVariants = (
  baseId: string,
  baseTemplate: Omit<GridTemplate, "id" | "gridSize" | "imageSlots">
): Record<string, GridTemplate> => ({
  [`${baseId}_3x3`]: {
    ...baseTemplate,
    id: `${baseId}_3x3`,
    gridSize: "3x3",
    imageSlots: 9,
  },
  [`${baseId}_4x4`]: {
    ...baseTemplate,
    id: `${baseId}_4x4`,
    gridSize: "4x4",
    imageSlots: 16,
  },
});

// ═══════════════════════════════════════════════════════════════
// WPW BASE TEMPLATES (5 × 2 = 10 variants)
// ═══════════════════════════════════════════════════════════════

const wpwPremiumMoodboard = createGridVariants("wpw_premium_moodboard", {
  name: "WPW Premium Print Moodboard",
  brand: "wpw",
  searchBarText: "PREMIUM WRAP PRINTING",
  searchBarVariants: [
    "WRAP SHOP MOODBOARD",
    "PREMIUM PRINT INSPIRATION",
    "CAR WRAP DESIGN IDEAS",
    "PRO-LEVEL WRAP PRINTING",
  ],
  description: "Clean grid showcasing premium print quality, installs, and brand craft",
  useCase: "Brand awareness, portfolio showcase, installer targeting",
  overlayText: {
    headline: "Upgrade your wraps. Elevate your print.",
    subheadline: "Premium printing for pro-level wrap shops",
    cta: "WEPRINTWRAPS.COM",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["installs", "close-ups", "renders", "ppf", "textures", "commercial", "fades", "patterns"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const wpwBeforeAfterGrid = createGridVariants("wpw_before_after_grid", {
  name: "Before & After Grid",
  brand: "wpw",
  searchBarText: "BEFORE & AFTER: THE PRINT DIFFERENCE",
  searchBarVariants: [
    "THE PRINT DIFFERENCE",
    "TRANSFORMATION GALLERY",
    "BEFORE → AFTER",
  ],
  description: "Left column shows 'before' prints, right columns show 'after' WPW quality",
  useCase: "Quality comparison, conversion-focused",
  overlayText: {
    headline: "When the print is right, the wrap installs clean.",
    subheadline: "See the difference pro printing makes",
    cta: "ORDER AT WEPRINTWRAPS.COM",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["before-shots", "after-shots", "comparison", "detail-shots"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const wpwUsVsThem = createGridVariants("wpw_us_vs_them", {
  name: "US vs THEM Comparison Grid",
  brand: "wpw",
  searchBarText: "PRO PRINT VS CHEAP PRINT",
  searchBarVariants: [
    "QUALITY COMPARISON",
    "WHY WPW WINS",
    "THE REAL DIFFERENCE",
  ],
  description: "Top row shows competitor 'cheap print' issues, bottom rows show WPW quality",
  useCase: "Competitive positioning, pain point targeting",
  overlayText: {
    headline: "Good installers deserve good print.",
    subheadline: "Stop fixing bad prints in the field",
    cta: "WEPRINTWRAPS.COM",
  },
  cellConfig: {
    cropRule: "tight",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["bad-print-examples", "wpw-quality", "comparison", "close-ups"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const wpwShowCarAwards = createGridVariants("wpw_show_car_awards", {
  name: "Show Car Awards Grid",
  brand: "wpw",
  searchBarText: "AWARD-WINNING WRAPS",
  searchBarVariants: [
    "SHOW CAR GALLERY",
    "TROPHY-WINNING PRINTS",
    "COMPETITION WINNERS",
  ],
  description: "Award-winning vehicles printed by WPW with trophies and detail shots",
  useCase: "Authority building, enthusiast targeting",
  overlayText: {
    headline: "Award-winning wraps start with award-winning printing.",
    subheadline: "Trusted by show car champions",
    cta: "WEPRINTWRAPS.COM",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["show-cars", "trophies", "detail-shots", "awards", "competitions"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const wpwCommercialFleet = createGridVariants("wpw_commercial_fleet", {
  name: "Commercial Wrap Grid",
  brand: "wpw",
  searchBarText: "COMMERCIAL WRAPS THAT WIN CLIENTS",
  searchBarVariants: [
    "FLEET WRAP GALLERY",
    "COMMERCIAL PRINTING",
    "BRAND YOUR FLEET",
  ],
  description: "Fleet vans, box trucks, service vehicles, branded wraps",
  useCase: "Commercial B2B targeting, fleet managers",
  overlayText: {
    headline: "Premium printing for pro-level wrap shops.",
    subheadline: "Brand consistency across every vehicle",
    cta: "WEPRINTWRAPS.COM",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["fleet-vans", "box-trucks", "service-vehicles", "branded-wraps", "logo-closeups"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

// ═══════════════════════════════════════════════════════════════
// RESTYLEPRO BASE TEMPLATES (4 × 2 = 8 variants)
// ═══════════════════════════════════════════════════════════════

const rspVisualizerGallery = createGridVariants("rsp_visualizer_gallery", {
  name: "RestylePro Visualizer Gallery",
  brand: "restylepro",
  searchBarText: "RESTYLEPRO WRAP IDEAS",
  searchBarVariants: [
    "VISUALIZER RENDER GALLERY",
    "INSTANT WRAP PREVIEWS",
    "5-SECOND WRAP DEMOS",
  ],
  description: "RestylePro renders showing instant visualization power",
  useCase: "App demo, installer tool targeting",
  overlayText: {
    headline: "5-second wrap previews.",
    subheadline: "Show customers the wrap BEFORE you wrap",
    cta: "RESTYLEPRO.AI",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["renders", "color-swaps", "ppf-demos", "visualizations"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const rspPatternProGrid = createGridVariants("rsp_patternpro_grid", {
  name: "PatternPro Swatch Grid",
  brand: "restylepro",
  searchBarText: "PATTERNPRO DESIGNS",
  searchBarVariants: [
    "PATTERN GALLERY",
    "CUSTOM WRAP PATTERNS",
    "DESIGN LIBRARY",
  ],
  description: "Patterns displayed like fabric swatches",
  useCase: "Pattern sales, creative inspiration",
  overlayText: {
    headline: "Unlimited wrap patterns.",
    subheadline: "Create unique designs in seconds",
    cta: "PATTERNPRO.AI",
  },
  cellConfig: {
    cropRule: "full",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["patterns", "swatches", "designs", "textures"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const rspDesignPanelProGrid = createGridVariants("rsp_designpanelpro_grid", {
  name: "DesignPanelPro Before/After Grid",
  brand: "restylepro",
  searchBarText: "DESIGNPANELPRO GALLERY",
  searchBarVariants: [
    "PANEL-READY DESIGNS",
    "PRINT-READY OUTPUT",
    "DESIGN → PRINT",
  ],
  description: "Before (blank) vs after (panelized design) comparison",
  useCase: "Design tool demo, print-ready workflow",
  overlayText: {
    headline: "Design to print-ready in minutes.",
    subheadline: "Panel-perfect output every time",
    cta: "DESIGNPANELPRO.AI",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["blank-panels", "designed-panels", "before-after", "output-samples"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

const rspEcosystemGrid = createGridVariants("rsp_ecosystem_grid", {
  name: "RestylePro Ecosystem Grid",
  brand: "restylepro",
  searchBarText: "THE WRAP SHOP TOOLKIT",
  searchBarVariants: [
    "RESTYLEPRO SUITE",
    "ALL-IN-ONE WRAP TOOLS",
    "THE COMPLETE SYSTEM",
  ],
  description: "Mixed grid showing RestylePro + PatternPro + DesignPanelPro + PPF",
  useCase: "Full suite promotion, ecosystem awareness",
  overlayText: {
    headline: "The Wrap Shop Operating System.",
    subheadline: "Visualize. Design. Print. Repeat.",
    cta: "RESTYLEPRO.AI",
  },
  cellConfig: {
    cropRule: "center",
    aspectRatio: "1:1",
    gap: 8,
  },
  suggestedAssetTypes: ["restylepro-renders", "patternpro-designs", "designpanelpro-output", "ppf-demos"],
  searchBarStyle: {
    enabled: true,
    position: "top",
    font: "Bebas Neue",
    iconPosition: "left",
  },
});

// ═══════════════════════════════════════════════════════════════
// COMBINED TEMPLATES EXPORT (18 Total)
// ═══════════════════════════════════════════════════════════════

export const GRID_TEMPLATES: Record<string, GridTemplate> = {
  // WPW Templates (10)
  ...wpwPremiumMoodboard,
  ...wpwBeforeAfterGrid,
  ...wpwUsVsThem,
  ...wpwShowCarAwards,
  ...wpwCommercialFleet,
  // RestylePro Templates (8)
  ...rspVisualizerGallery,
  ...rspPatternProGrid,
  ...rspDesignPanelProGrid,
  ...rspEcosystemGrid,
};

// ═══════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export const getGridTemplatesByBrand = (
  brand: "wpw" | "restylepro" | "both",
  gridSize?: GridSize
): GridTemplate[] => {
  return Object.values(GRID_TEMPLATES).filter((t) => {
    const brandMatch = t.brand === brand || t.brand === "both" || brand === "both";
    const sizeMatch = !gridSize || t.gridSize === gridSize;
    return brandMatch && sizeMatch;
  });
};

export const getGridTemplateById = (id: string): GridTemplate | undefined => {
  return GRID_TEMPLATES[id];
};

export const getGridTemplatesBySize = (gridSize: GridSize): GridTemplate[] => {
  return Object.values(GRID_TEMPLATES).filter((t) => t.gridSize === gridSize);
};

export const getBaseTemplateIds = (): string[] => {
  // Return unique base template IDs (without _3x3 or _4x4 suffix)
  const baseIds = new Set<string>();
  Object.keys(GRID_TEMPLATES).forEach((id) => {
    const baseId = id.replace(/_3x3$|_4x4$/, "");
    baseIds.add(baseId);
  });
  return Array.from(baseIds);
};

export const GRID_TEMPLATE_STATS = {
  total: Object.keys(GRID_TEMPLATES).length,
  wpw: Object.values(GRID_TEMPLATES).filter((t) => t.brand === "wpw").length,
  restylepro: Object.values(GRID_TEMPLATES).filter((t) => t.brand === "restylepro").length,
  size3x3: Object.values(GRID_TEMPLATES).filter((t) => t.gridSize === "3x3").length,
  size4x4: Object.values(GRID_TEMPLATES).filter((t) => t.gridSize === "4x4").length,
};
