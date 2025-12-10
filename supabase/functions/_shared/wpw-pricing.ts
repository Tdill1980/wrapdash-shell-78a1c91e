// WPW Official Product Pricing - Updated from official pricing sheet
// These are the EXACT prices as shown on WePrintWraps.com

export const WPW_PRICING = {
  // Per Square Foot Products
  perSqft: {
    averyPrintedWrap: {
      name: "Printed Wrap Film (Avery Brand, UV Lamination)",
      pricePerSqft: 5.27,
      description: "Standard full-color wrap on Avery",
      wooProductId: 79
    },
    threeMWrap: {
      name: "3M IJ180CV3 + 8518 Lamination",
      pricePerSqft: 5.90,
      description: "Max print width 53.5\"",
      wooProductId: 72
    },
    averyContourCut: {
      name: "Avery Cut Contour Vinyl Graphics",
      pricePerSqft: 6.32,
      description: "Includes cutting, max artwork 50\"",
      wooProductId: 108
    },
    threeMContourCut: {
      name: "3M Cut Contour Vinyl Graphics",
      pricePerSqft: 6.92,
      description: "Includes cutting, max artwork 50\"",
      wooProductId: 19420
    },
    perforatedWindow: {
      name: "Perforated Window Vinyl 50/50",
      pricePerSqft: 5.95,
      description: "54\" roll, unlaminated",
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
      price: 349,
      description: "Professional custom design",
      wooProductId: 234
    }
  }
};

// Build pricing string for AI context
export function getPricingContext(): string {
  return `OFFICIAL WPW PRICING (use these EXACT numbers):
• Printed Wrap Film (Avery): $5.27/sqft
• 3M IJ180CV3 Wrap Film: $5.90/sqft
• Avery Contour-Cut Graphics: $6.32/sqft
• 3M Contour-Cut Graphics: $6.92/sqft
• Perforated Window Vinyl: $5.95/sqft
• Pre-Designed Fade Wraps: Starting at $600 (both sides)
• Wrap By The Yard: $600 per side
• Custom Design: $349

QUOTE CALCULATION FORMULA:
1. Get vehicle SQFT from database (or ask for measurements)
2. Multiply SQFT × price per sqft for material cost
3. Add $600 for fade wraps if that's what they want
4. Typical full wrap: 200-350 sqft depending on vehicle size`;
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
