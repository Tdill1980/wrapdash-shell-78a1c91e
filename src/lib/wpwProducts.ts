// WPW Allowed Product IDs - WooCommerce IDs that can be added to cart
export const WPW_ALLOWED_PRODUCT_IDS = [
  58391, // FadeWraps Pre-Designed (starting at $600)
  19420, // 3M IJ180 Contour-Cut Wrap Film (Install-Ready)
  72,    // 3M IJ180 Printed Wrap Film
  108,   // Avery Contour-Cut Wrap Film (Install-Ready)
  79,    // Printed Wrap Film w/ UV Lamination (Avery)
  234,   // Custom Vehicle Wrap Design
  58160, // Custom Vehicle Wrap Design (Copy/Draft)
  15192, // Pantone Color Chart 30×52
  80,    // Perforated Window Vinyl 50/50
  475,   // Camo & Carbon Sample Book
  39628, // Marble & Metals Swatch Book
  4181,  // Wicked & Wild Wrap Prints 60" (FIX: was 4179 swatch book)
  42809, // Wrap By The Yard — Bape Camo
  1726,  // Wrap By The Yard — Camo & Carbon
  39698, // Wrap By The Yard — Metal & Marble
  52489, // Wrap By The Yard — Modern & Trippy
  69439, // InkFusion™ Premium Vinyl ($2,075/roll)
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
    wickedWild: { id: 4181, name: "Wicked & Wild" }, // Nebula Galaxy, Starry Night, Matrix, etc.
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
  finishes: ["Gloss", "Luster", "Matte"],
  material: "Avery MPI 1105 with UV laminate"
};

// Standalone Products - NO vehicle context required
export const STANDALONE_PRODUCTS = {
  windowPerf: { id: 80, pricePerSqft: 5.95, name: "Window Perf 50/50" },
  averyContour: { id: 108, pricePerSqft: 6.32, name: "Avery Cut Contour" },
  threeMContour: { id: 19420, pricePerSqft: 6.92, name: "3M Cut Contour" }
};
