// WPW Official Product Pricing
// Last Updated: December 2024 - 3M PRICE DROP!
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
      description: "See-through window vinyl",
      wooProductId: 80
    }
  },

  // Flat Price Products
  flatPrice: {
    fadeWraps: {
      name: "Pre-Designed Fade Wraps",
      basePrice: 600,
      description: "Driver + Passenger side panels. Avery MPI 1105 with UV laminate.",
      notes: "Hood, roof, bumpers available separately",
      wooProductId: 58391
    },
    wrapByTheYard: {
      name: "Wrap By The Yard (Wicked & Wild, Bape Camo, Trippy, Marble)",
      pricePerSide: 600,
      description: "Pre-designed printed films",
      notes: "See size chart for exact pricing",
      wooProductIds: [42809, 1726, 39698, 52489]
    },
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
  }
};

// Build pricing string for AI context
export function getPricingContext(): string {
  return `WEPRINTWRAPS WHOLESALE PRICING (Updated December 2024)

🔥 PRICE DROP: Both Avery AND 3M printed wraps are now $5.27/sqft!

WRAP MATERIALS:
• Avery MPI 1105 with DOL 1460Z Lamination: $5.27/sqft
• 3M IJ180Cv3 with 8518 Lamination: $5.27/sqft ← PRICE DROP! (was $6.32)
• Avery Cut Contour Vinyl: $6.32/sqft
• 3M Cut Contour Vinyl: $6.92/sqft
• Window Perf 50/50: $5.95/sqft

SPECIALTY PRODUCTS:
• Fade Wraps (Sides): Starting at $600
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
• Design services: https://weprintwraps.com/our-products/custom-wrap-design/`;
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
