// TOP 25 MOST QUOTED VEHICLES - QUICK REFERENCE
// Last Updated: December 2024
// Note: Always check the full vehicle_dimensions table for exact numbers!

export const VEHICLE_QUICK_REF: Record<string, { sqft: number; category: string }> = {
  // CARS
  'honda_civic': { sqft: 200, category: 'car' },
  'toyota_camry': { sqft: 220, category: 'car' },
  'chevy_impala': { sqft: 260, category: 'car' },
  'ford_mustang': { sqft: 210, category: 'car' },
  'dodge_charger': { sqft: 240, category: 'car' },
  'chevy_camaro': { sqft: 200, category: 'car' },
  'tesla_model_3': { sqft: 200, category: 'car' },
  'tesla_model_y': { sqft: 220, category: 'suv' },
  
  // TRUCKS
  'ford_f150': { sqft: 250, category: 'truck' },
  'chevy_silverado': { sqft: 260, category: 'truck' },
  'ram_1500': { sqft: 255, category: 'truck' },
  'toyota_tacoma': { sqft: 220, category: 'truck' },
  'toyota_tundra': { sqft: 260, category: 'truck' },
  'ford_f250': { sqft: 280, category: 'truck' },
  'ford_f350': { sqft: 300, category: 'truck' },
  
  // VANS
  'ford_transit_low': { sqft: 220, category: 'van' },
  'ford_transit_high': { sqft: 280, category: 'van' },
  'mercedes_sprinter': { sqft: 240, category: 'van' },
  'mercedes_sprinter_high': { sqft: 260, category: 'van' },
  'nissan_nv200': { sqft: 180, category: 'van' },
  'ram_promaster': { sqft: 260, category: 'van' },
  
  // SUVs
  'chevy_tahoe': { sqft: 240, category: 'suv' },
  'ford_explorer': { sqft: 220, category: 'suv' },
  'jeep_grand_cherokee': { sqft: 200, category: 'suv' },
  'jeep_wrangler': { sqft: 180, category: 'suv' },
  'ford_bronco': { sqft: 200, category: 'suv' },
  'chevy_suburban': { sqft: 280, category: 'suv' },
  'gmc_yukon': { sqft: 250, category: 'suv' },
};

// Helper function to find quick sqft estimate
export function getQuickSqft(make: string, model: string): number | null {
  const normalizedMake = make.toLowerCase().replace(/\s+/g, '_');
  const normalizedModel = model.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '');
  
  // Try exact match
  const key = `${normalizedMake}_${normalizedModel}`;
  if (VEHICLE_QUICK_REF[key]) {
    return VEHICLE_QUICK_REF[key].sqft;
  }
  
  // Try model only (for common vehicles)
  for (const [refKey, data] of Object.entries(VEHICLE_QUICK_REF)) {
    if (refKey.includes(normalizedModel)) {
      return data.sqft;
    }
  }
  
  return null;
}

// Get category-based estimate if exact match not found
export function getCategoryEstimate(category: string): number {
  const estimates: Record<string, number> = {
    'car': 210,
    'sedan': 220,
    'coupe': 190,
    'truck': 250,
    'suv': 220,
    'van': 240,
    'commercial': 280,
  };
  
  return estimates[category.toLowerCase()] || 220;
}

// Format vehicle key for lookup
export function formatVehicleKey(make: string, model: string): string {
  return `${make.toLowerCase().replace(/\s+/g, '_')}_${model.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '')}`;
}
