// WPW Official Product Pricing
// Last Updated: January 2025 - InkFusion, WBTY, FadeWraps pricing locked
// THESE ARE THE ONLY PRICES TO USE

export const WPW_PRICING = {
  // Per Square Foot Products
  perSqft: {
    averyPrintedWrap: {
      name: "Avery MPI 1105 EGRS with DOL 1460Z Lamination",
      pricePerSqft: 5.27,
      description: "Excellent quality, great value, 5-7 year durability",
      wooProductId: 79
    },
    threeMWrap: {
      name: "3M IJ180Cv3 with 8518 Lamination",
      pricePerSqft: 5.27, // PRICE DROP! Was $6.32, now matches Avery at $5.27
      description: "Premium option, easiest install, 7-10 year durability - NOW SAME PRICE AS AVERY!",
      wooProductId: 72
    },
    averyContourCut: {
      name: "Avery Cut Contour Vinyl",
      pricePerSqft: 6.32,
      description: "Weeded and masked, ready to install",
      wooProductId: 108
    },
    threeMContourCut: {
      name: "3M Cut Contour Vinyl",
      pricePerSqft: 6.92,
      description: "Weeded and masked, ready to install",
      wooProductId: 19420
    },
    perforatedWindow: {
      name: "Window Perf 50/50 Unlaminated",
      pricePerSqft: 5.95,
      description: "See-through window vinyl - STANDALONE PRODUCT, no vehicle required",
      wooProductId: 80
    }
  },

  // Flat Price Products
  flatPrice: {
    customDesign: {
      name: "Custom Vehicle Wrap Design",
      price: 750,
      description: "Full custom professional design",
      wooProductId: 234
    },
    designSetup: {
      name: "Design Setup / File Output",
      price: 50,
      description: "File preparation and output"
    },
    hourlyDesign: {
      name: "Hourly Design Work",
      pricePerHour: 150,
      description: "Per hour design services"
    }
  },

  // ============================================================================
  // SPECIALTY PRODUCTS (LOCKED PRICING - January 2025)
  // ============================================================================
  specialty: {
    // InkFusion™ - SUITE-BASED PRODUCT (NOT chat-quoted)
    inkFusion: {
      name: "InkFusion™ Premium Vinyl",
      pricePerRoll: 2075,
      coverage: 375, // sqft (~24 yards)
      width: 60, // inches
      film: "Avery SW900",
      laminate: "DOL1360 Max Gloss",
      finishes: ["Gloss", "Luster"],
      description: "Automotive paint-quality finish on Avery SW900 with Max Gloss laminate",
      notes: "FULL ROLL ONLY - ordered via PrintPro Suite, NOT chat-quoted!",
      wooProductId: 69439,
      orderPath: "RestylePro → PrintPro Suite → Add to Cart → WPW WooCommerce"
    },

    // Wrap By The Yard - Pre-designed patterns
    wrapByTheYard: {
      name: "Wrap By The Yard",
      pricePerYard: 95.50,
      yardOptions: [1, 5, 10, 25, 50],
      description: "Pre-designed printed films sold by the yard",
      collections: {
        camoCabon: { id: 1726, name: "Camo & Carbon" },
        metalMarble: { id: 39698, name: "Metal & Marble" },
        wickedWild: { id: 4181, name: "Wicked & Wild" }, // Nebula, Galaxy, Starry Night, Matrix
        bapeCamo: { id: 42809, name: "Bape Camo" },
        modernTrippy: { id: 52489, name: "Modern & Trippy" }
      }
    },

    // FadeWraps - Pre-designed fade graphics
    fadeWraps: {
      name: "FadeWraps Pre-Designed",
      wooProductId: 58391,
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
      description: "Driver + Passenger side panels. Avery MPI 1105 with UV laminate."
    }
  }
};

// Build pricing string for AI context
export function getPricingContext(): string {
  return `WEPRINTWRAPS WHOLESALE PRICING (Updated January 2025)

🔥 PRICE DROP: Both Avery AND 3M printed wraps are now $5.27/sqft!

WRAP MATERIALS:
• Avery MPI 1105 with DOL 1460Z Lamination: $5.27/sqft
• 3M IJ180Cv3 with 8518 Lamination: $5.27/sqft ← PRICE DROP! (was $6.32)
• Avery Cut Contour Vinyl: $6.32/sqft
• 3M Cut Contour Vinyl: $6.92/sqft
• Window Perf 50/50: $5.95/sqft ← STANDALONE PRODUCT (no vehicle required)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 INKFUSION™ (SUITE-BASED PRODUCT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $2,075 per roll (375 sqft / ~24 yards)
• Automotive paint-quality finish
• Avery SW900 + DOL1360 Max Gloss
• FULL ROLL ONLY - no partials
• Finishes: Gloss or Luster
• Product ID: 69439

⚠️ InkFusion is ordered via PrintPro Suite, NOT chat-quoted!
Order Path: RestylePro → PrintPro Suite → Add to Cart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 WRAP BY THE YARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price: $95.50 per yard
Options: 1, 5, 10, 25, or 50 yards

Quick Math:
• 1 yard = $95.50
• 5 yards = $477.50
• 10 yards = $955
• 25 yards = $2,387.50
• 50 yards = $4,775

Collections:
• Camo & Carbon (ID: 1726)
• Metal & Marble (ID: 39698)
• Wicked & Wild (ID: 4181) - Nebula Galaxy, Starry Night, Matrix
• Bape Camo (ID: 42809)
• Modern & Trippy (ID: 52489)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌈 FADEWRAPS (ID: 58391)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIZES (Driver + Passenger sides):
• Small (144x59.5"): $600
• Medium (172x59.5"): $710
• Large (200x59.5"): $825
• XL (240x59.5"): $990

ADD-ONS:
• Hood: $160
• Front Bumper: $200
• Rear + Bumper: $395
• Roof: $160-$330

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️ STANDALONE PRODUCTS (NO VEHICLE REQUIRED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Window Perf (ID: 80): $5.95/sqft
✅ Avery Cut Contour (ID: 108): $6.32/sqft
✅ 3M Cut Contour (ID: 19420): $6.92/sqft

ALWAYS quote these directly. DO NOT ask for vehicle info!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OTHER PRODUCTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Custom Design: Starting at $750
• Design Setup/File Output: $50
• Hourly Design Work: $150/hour

PRICING CALCULATION:
• Material Cost = Vehicle SQFT × $5.27 (for Avery or 3M printed wrap)
• Example: A Toyota Prius (175 sqft) = 175 × $5.27 = $922 for material

POLICIES:
• FREE shipping on all orders over $750
• Production time: 1-2 business days
• Shipping time: 1-3 days anywhere in continental US
• All wraps include lamination (gloss, matte, or satin)
• All wraps come pre-paneled and ready to install

IMPORTANT URLS:
• Main catalog: https://weprintwraps.com/our-products/
• Fade wraps: https://weprintwraps.com/our-products/pre-designed-fade-wraps/
• Design services: https://weprintwraps.com/our-products/custom-wrap-design/
• InkFusion: https://weprintwraps.com/product/inkfusion/`;
}

// Calculate quick quote based on vehicle sqft
export function calculateQuickQuote(sqft: number, productType: string = 'avery'): {
  materialCost: number;
  pricePerSqft: number;
  productName: string;
} {
  const pricing = WPW_PRICING.perSqft;
  
  let pricePerSqft = pricing.averyPrintedWrap.pricePerSqft;
  let productName = pricing.averyPrintedWrap.name;
  
  if (productType.toLowerCase().includes('3m')) {
    pricePerSqft = pricing.threeMWrap.pricePerSqft;
    productName = pricing.threeMWrap.name;
  } else if (productType.toLowerCase().includes('contour') && productType.toLowerCase().includes('3m')) {
    pricePerSqft = pricing.threeMContourCut.pricePerSqft;
    productName = pricing.threeMContourCut.name;
  } else if (productType.toLowerCase().includes('contour')) {
    pricePerSqft = pricing.averyContourCut.pricePerSqft;
    productName = pricing.averyContourCut.name;
  } else if (productType.toLowerCase().includes('window') || productType.toLowerCase().includes('perf')) {
    pricePerSqft = pricing.perforatedWindow.pricePerSqft;
    productName = pricing.perforatedWindow.name;
  }
  
  return {
    materialCost: Math.round(sqft * pricePerSqft * 100) / 100,
    pricePerSqft,
    productName
  };
}
