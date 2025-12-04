// Vehicle type detection based on make/model
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'van';

const SUV_KEYWORDS = [
  'enclave', 'tahoe', 'suburban', 'yukon', 'escalade', 'traverse', 'equinox', 'blazer',
  'explorer', 'expedition', 'bronco', 'escape', 'edge', 'aviator', 'navigator',
  '4runner', 'highlander', 'sequoia', 'land cruiser', 'rav4', 'venza',
  'pilot', 'passport', 'hr-v', 'cr-v',
  'pathfinder', 'armada', 'murano', 'rogue', 'kicks',
  'grand cherokee', 'cherokee', 'wrangler', 'compass', 'renegade',
  'outback', 'forester', 'ascent', 'crosstrek',
  'x3', 'x5', 'x7', 'x1', 'x4', 'x6',
  'q5', 'q7', 'q3', 'q8', 'e-tron',
  'gle', 'glc', 'gls', 'glb', 'g-class',
  'rx', 'nx', 'gx', 'lx', 'ux',
  'xc90', 'xc60', 'xc40',
  'cayenne', 'macan',
  'range rover', 'discovery', 'defender', 'evoque',
  'telluride', 'sorento', 'sportage', 'seltos',
  'palisade', 'santa fe', 'tucson', 'kona', 'venue',
  'mdx', 'rdx', 'zdx',
  'xt5', 'xt6', 'xt4', 'lyriq',
  'envision', 'encore',
  'corsair', 'nautilus',
  'cx-5', 'cx-9', 'cx-30', 'cx-50', 'cx-90',
  'tiguan', 'atlas', 'id.4', 'taos',
  'model x', 'model y',
  'ioniq 5', 'ev6', 'id.4', 'mach-e', 'mustang mach-e',
  'qx50', 'qx55', 'qx60', 'qx80',
  'stelvio',
  'cullinan', 'bentayga', 'urus', 'dbx',
  'crossover', 'suv'
];

const TRUCK_KEYWORDS = [
  'f-150', 'f-250', 'f-350', 'f-450', 'f150', 'f250', 'f350', 'f450',
  'silverado', 'colorado', 'canyon', 'sierra',
  'ram 1500', 'ram 2500', 'ram 3500', 'ram1500', 'ram2500', 'ram3500',
  'tundra', 'tacoma',
  'titan', 'frontier',
  'ridgeline',
  'ranger', 'maverick',
  'gladiator',
  'santa cruz',
  'cybertruck', 'rivian r1t', 'lightning', 'hummer ev',
  'pickup', 'truck', 'crew cab', 'regular cab', 'extended cab',
  'avalanche', 's-10', 's10'
];

const VAN_KEYWORDS = [
  'sprinter', 'transit', 'promaster', 'metris',
  'express', 'savana',
  'nv200', 'nv1500', 'nv2500', 'nv3500', 'nv cargo', 'nv passenger',
  'sienna', 'odyssey', 'pacifica', 'carnival', 'sedona',
  'grand caravan', 'caravan', 'voyager',
  'e-series', 'e-150', 'e-250', 'e-350', 'e150', 'e250', 'e350',
  'econoline',
  'van', 'minivan', 'cargo van', 'passenger van',
  'transit connect', 'city express'
];

export function getVehicleType(make: string, model: string): VehicleType {
  const searchText = `${make} ${model}`.toLowerCase();
  
  // Check for van first (more specific matches)
  for (const keyword of VAN_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'van';
    }
  }
  
  // Check for truck
  for (const keyword of TRUCK_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'truck';
    }
  }
  
  // Check for SUV
  for (const keyword of SUV_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return 'suv';
    }
  }
  
  // Default to sedan
  return 'sedan';
}

// Estimate panel dimensions from square footage (approximate based on typical ratios)
export function estimatePanelDimensions(sqft: number, panelType: 'hood' | 'roof' | 'sides' | 'back') {
  // Approximate width/height ratios for each panel type
  const ratios: Record<string, { widthRatio: number; heightRatio: number }> = {
    hood: { widthRatio: 1.8, heightRatio: 1 },    // Hood is wider than deep
    roof: { widthRatio: 0.5, heightRatio: 1 },    // Roof is longer than wide
    sides: { widthRatio: 0.25, heightRatio: 1 },  // Sides are very long
    back: { widthRatio: 1.5, heightRatio: 1 }     // Back is slightly wider
  };
  
  const { widthRatio, heightRatio } = ratios[panelType];
  const area = sqft * 144; // Convert to square inches
  
  // Calculate dimensions based on ratio
  const height = Math.sqrt(area / (widthRatio / heightRatio));
  const width = area / height;
  
  return {
    width: Math.round(width),
    height: Math.round(height),
    sqft: sqft
  };
}
