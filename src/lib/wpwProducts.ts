// WPW Allowed Product IDs - WooCommerce IDs that can be added to cart
export const WPW_ALLOWED_PRODUCT_IDS = [
  // Printed Wrap Films
  79,    // Avery MPI 1105 with DOL 1460Z - $5.27/sqft
  72,    // 3M IJ180Cv3 with 8518 - $5.27/sqft (MATCHES AVERY)
  
  // Contour Cut (Install-Ready)
  108,   // Avery Contour-Cut - $6.32/sqft
  19420, // 3M Contour-Cut - $6.92/sqft
  
  // Specialty Products
  80,    // Perforated Window Vinyl 50/50 - $5.95/sqft
  58391, // FadeWraps Pre-Designed - $600-$990 based on size
  69439, // InkFusion Premium - $2,075/roll
  70093, // Wall Wrap Printed Vinyl - $3.25/sqft
  
  // Wrap By The Yard
  1726,  // Camo & Carbon - $95.50/yard
  39698, // Metal & Marble - $95.50/yard
  4181,  // Wicked & Wild - $95.50/yard
  42809, // Bape Camo - $95.50/yard
  52489, // Modern & Trippy - $95.50/yard
  
  // Design Services
  234,   // Custom Vehicle Wrap Design - $750
  58160, // Custom Design (Copy/Draft) - $500
  
  // Sample/Reference Products
  15192, // Pantone Color Chart - $42
  475,   // Camo & Carbon Sample Book - $26.50
  39628, // Marble & Metals Swatch Book - $26.50
  4179,  // Wicked & Wild Swatch Book - $26.50
  
  // DesignPanelPro (Print Production Packs)
  69664, // Small Print Production Pack
  69671, // Medium Print Production Pack
  69680, // Large Print Production Pack
  69686, // XLarge Print Production Pack
];

export function isWPW(wooProductId: number | null | undefined): boolean {
  if (!wooProductId) return false;
  return WPW_ALLOWED_PRODUCT_IDS.includes(wooProductId);
}

// ============================================================================
// SPECIALTY PRODUCT PRICING (LOCKED VALUES)
// ============================================================================

// InkFusion™ - SUITE-BASED PRODUCT (ordered via PrintPro Suite, NOT chat-quoted)
export const INKFUSION_PRICING = {
  productId: 69439,
  pricePerRoll: 2075,
  coverage: 375, // sqft per roll (~24 yards)
  width: 60, // inches
  film: "Avery SW900",
  laminate: "DOL1360 Max Gloss",
  finishes: ["Gloss", "Luster"],
  orderPath: "RestylePro → PrintPro Suite → Add to Cart"
};

// Wrap By The Yard - Pre-designed patterns sold by the yard
export const WBTY_PRICING = {
  pricePerYard: 95.50,
  yardOptions: [1, 5, 10, 25, 50] as const,
  collections: {
    camoCabon: { id: 1726, name: "Camo & Carbon" },
    metalMarble: { id: 39698, name: "Metal & Marble" },
    wickedWild: { id: 4181, name: "Wicked & Wild" },
    bapeCamo: { id: 42809, name: "Bape Camo" },
    modernTrippy: { id: 52489, name: "Modern & Trippy" }
  }
};

// FadeWraps - Pre-designed fade graphics (size-based pricing)
export const FADEWRAPS_PRICING = {
  productId: 58391,
  sizes: {
    small: { dimensions: "144x59.5", price: 600 },
    medium: { dimensions: "172x59.5", price: 710 },
    large: { dimensions: "200x59.5", price: 825 },
    xl: { dimensions: "240x59.5", price: 990 }
  },
  addOns: {
    hood: { dimensions: "72x59.5", price: 160 },
    frontBumper: { dimensions: "38x120.5", price: 200 },
    rearWithBumper: { dimensions: "59x72.5 + 38x120", price: 395 },
    roofSmall: { dimensions: "72x59.5", price: 160 },
    roofMedium: { dimensions: "110x59.5", price: 225 },
    roofLarge: { dimensions: "160x59.5", price: 330 }
  },
  colors: ["Beige", "Blue", "Green", "LightBlue", "Lime", "Orange", "Pink", "Purple", "Red", "Yellow", "Custom"],
  finishes: ["Gloss", "Luster", "Matte"],
  material: "Avery MPI 1105 with UV laminate"
};

// Wall Wrap - Custom printed wall graphics
export const WALL_WRAP_PRICING = {
  productId: 70093,
  pricePerSqft: 3.25,
  material: "Avery HP MPI 2610",
  finishes: ["Matte", "Luster"]
};

// Standalone Products - NO vehicle context required
export const STANDALONE_PRODUCTS = {
  windowPerf: { id: 80, pricePerSqft: 5.95, name: "Window Perf 50/50" },
  averyContour: { id: 108, pricePerSqft: 6.32, name: "Avery Cut Contour" },
  threeMContour: { id: 19420, pricePerSqft: 6.92, name: "3M Cut Contour" },
  wallWrap: { id: 70093, pricePerSqft: 3.25, name: "Wall Wrap Printed Vinyl" }
};

// Product type detection helpers
export const WBTY_PRODUCT_IDS = [1726, 39698, 4181, 42809, 52489];
export const isWBTY = (productId: number): boolean => WBTY_PRODUCT_IDS.includes(productId);
export const isFadeWrap = (productId: number): boolean => productId === 58391;
