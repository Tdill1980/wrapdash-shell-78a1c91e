// Template OS - Brand Design System
// Locked rules for WPW + RestylePro

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  overlay: string;
  success: string;
  warning: string;
  error: string;
}

export interface BrandTypography {
  headline: {
    family: string;
    weight: number;
    fallback: string;
  };
  subheadline: {
    family: string;
    weight: number;
    fallback: string;
  };
  body: {
    family: string;
    weight: number;
    fallback: string;
  };
  cta: {
    family: string;
    weight: number;
    fallback: string;
  };
}

export interface BrandSpacing {
  safeMarginPercent: number;
  textMaxWidthPercent: number;
  gridGap: number;
  borderRadius: number;
  searchBarHeight: number;
}

export interface BrandCropRules {
  cars: "center" | "tight" | "full";
  details: "center" | "tight" | "full";
  patterns: "center" | "tight" | "full";
  renders: "center" | "tight" | "full";
  noWarping: boolean;
  noStretching: boolean;
}

export interface BrandContrastRules {
  minTextContrast: number;
  useOverlayForLightImages: boolean;
  overlayOpacity: number;
  shadowForText: boolean;
}

export interface BrandAnimationRules {
  fadeInDuration: number;
  slideUpDuration: number;
  gridPopDelay: number;
  revealSwipeDuration: number;
}

export interface BrandSystem {
  id: string;
  name: string;
  domain: string;
  colors: BrandColors;
  typography: BrandTypography;
  spacing: BrandSpacing;
  cropRules: BrandCropRules;
  contrastRules: BrandContrastRules;
  animationRules: BrandAnimationRules;
  logoUrl: string;
  watermarkPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export const WPW_BRAND: BrandSystem = {
  id: "wpw",
  name: "WePrintWraps",
  domain: "weprintwraps.com",
  colors: {
    primary: "hsl(225, 100%, 50%)",      // #0033FF - WPW Blue
    secondary: "hsl(354, 80%, 51%)",     // #E81C2E - WPW Red
    accent: "hsl(45, 100%, 50%)",        // Gold accent
    background: "hsl(0, 0%, 100%)",      // White
    backgroundAlt: "hsl(0, 0%, 97%)",    // Off-white
    text: "hsl(0, 0%, 0%)",              // Black
    textMuted: "hsl(0, 0%, 40%)",        // Dark gray
    overlay: "hsl(0, 0%, 13%)",          // #222
    success: "hsl(142, 76%, 36%)",       // Green
    warning: "hsl(45, 100%, 50%)",       // Yellow
    error: "hsl(354, 80%, 51%)",         // Red
  },
  typography: {
    headline: {
      family: "Bebas Neue",
      weight: 700,
      fallback: "Anton, League Gothic, sans-serif",
    },
    subheadline: {
      family: "Poppins",
      weight: 600,
      fallback: "Inter, sans-serif",
    },
    body: {
      family: "Inter",
      weight: 400,
      fallback: "system-ui, sans-serif",
    },
    cta: {
      family: "Poppins",
      weight: 700,
      fallback: "Inter, sans-serif",
    },
  },
  spacing: {
    safeMarginPercent: 10,
    textMaxWidthPercent: 60,
    gridGap: 8,
    borderRadius: 12,
    searchBarHeight: 48,
  },
  cropRules: {
    cars: "center",
    details: "tight",
    patterns: "full",
    renders: "center",
    noWarping: true,
    noStretching: true,
  },
  contrastRules: {
    minTextContrast: 4.5,
    useOverlayForLightImages: true,
    overlayOpacity: 0.6,
    shadowForText: true,
  },
  animationRules: {
    fadeInDuration: 0.3,
    slideUpDuration: 0.4,
    gridPopDelay: 0.1,
    revealSwipeDuration: 0.5,
  },
  logoUrl: "/assets/wpw-logo.png",
  watermarkPosition: "bottom-right",
};

export const RESTYLEPRO_BRAND: BrandSystem = {
  id: "restylepro",
  name: "RestylePro",
  domain: "restylepro.ai",
  colors: {
    primary: "hsl(239, 84%, 67%)",       // #6366F1 - Purple
    secondary: "hsl(187, 78%, 49%)",     // #22D3EE - Cyan
    accent: "hsl(280, 87%, 65%)",        // Magenta accent
    background: "hsl(222, 47%, 11%)",    // #0F172A - Dark slate
    backgroundAlt: "hsl(217, 33%, 17%)", // Slightly lighter slate
    text: "hsl(0, 0%, 100%)",            // White
    textMuted: "hsl(215, 20%, 65%)",     // Light slate
    overlay: "hsl(222, 47%, 8%)",        // Darker slate
    success: "hsl(142, 76%, 36%)",       // Green
    warning: "hsl(45, 100%, 50%)",       // Yellow
    error: "hsl(0, 84%, 60%)",           // Red
  },
  typography: {
    headline: {
      family: "Inter",
      weight: 800,
      fallback: "system-ui, sans-serif",
    },
    subheadline: {
      family: "Inter",
      weight: 500,
      fallback: "system-ui, sans-serif",
    },
    body: {
      family: "Inter",
      weight: 400,
      fallback: "system-ui, sans-serif",
    },
    cta: {
      family: "Inter",
      weight: 700,
      fallback: "system-ui, sans-serif",
    },
  },
  spacing: {
    safeMarginPercent: 10,
    textMaxWidthPercent: 65,
    gridGap: 6,
    borderRadius: 16,
    searchBarHeight: 44,
  },
  cropRules: {
    cars: "center",
    details: "center",
    patterns: "full",
    renders: "center",
    noWarping: true,
    noStretching: true,
  },
  contrastRules: {
    minTextContrast: 4.5,
    useOverlayForLightImages: false,
    overlayOpacity: 0.7,
    shadowForText: false,
  },
  animationRules: {
    fadeInDuration: 0.25,
    slideUpDuration: 0.35,
    gridPopDelay: 0.08,
    revealSwipeDuration: 0.4,
  },
  logoUrl: "/assets/restylepro-logo.png",
  watermarkPosition: "bottom-right",
};

export const BRAND_SYSTEMS: Record<string, BrandSystem> = {
  wpw: WPW_BRAND,
  restylepro: RESTYLEPRO_BRAND,
};

export const getBrandSystem = (brandId: string): BrandSystem => {
  return BRAND_SYSTEMS[brandId] || WPW_BRAND;
};

// Global design rules that apply to ALL brands
export const GLOBAL_DESIGN_RULES = {
  // Text placement rules
  textPlacement: {
    headline: ["top-left", "top-center", "bottom-center"],
    subheadline: ["below-headline", "bottom-center"],
    cta: ["bottom-right", "bottom-center"],
    neverCover: ["headlights", "key-wrap-areas", "logos"],
  },
  
  // Search bar rules (for grid templates)
  searchBar: {
    shape: "rounded-rectangle",
    iconPosition: "left",
    iconType: "magnifying-glass",
    shadow: "light-drop",
    textAlign: "center",
  },
  
  // Grid rules
  grid: {
    allowedSizes: ["3x3", "4x4"],
    equalPadding: true,
    thumbnailCrop: {
      cars: "center-crop",
      details: "tight-crop",
    },
  },
  
  // CTA rules
  cta: {
    maxLength: 25,
    buttonStyles: ["solid", "outline", "text"],
    defaultPosition: "bottom-right",
  },
  
  // Export sizes
  exportSizes: {
    instagram_feed: { width: 1080, height: 1080 },
    instagram_story: { width: 1080, height: 1920 },
    instagram_ad: { width: 1080, height: 1350 },
    facebook_link_ad: { width: 1200, height: 628 },
    facebook_feed: { width: 1080, height: 1080 },
    youtube_thumbnail: { width: 1280, height: 720 },
    tiktok_video: { width: 1080, height: 1920 },
  },
};
