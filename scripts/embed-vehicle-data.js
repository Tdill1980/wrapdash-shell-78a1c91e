// Script to embed parsed vehicle data directly into parseVehicleData.ts
const fs = require('fs');
const path = require('path');

// Read the raw parsed vehicles file
const rawData = fs.readFileSync(
  path.join(__dirname, '../src/data/parsed-vehicles-full.txt'),
  'utf-8'
);

const parseValue = (val) => {
  if (!val || val === '' || val === '-' || val === '||') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const lines = rawData.split('\n');
const vehicles = [];

for (const line of lines) {
  // Skip empty lines, headers, and separators
  if (!line.trim() || !line.startsWith('|') || line.includes('Make|Model|Year') || line.match(/^\|[\-\|]+$/)) {
    continue;
  }

  // Split by pipe and clean whitespace
  const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
  
  // Need at least 16 columns for complete data
  if (cells.length < 16) continue;
  
  // Skip header rows
  if (cells[0] === 'Make') continue;

  const make = cells[0];
  const model = cells[1];
  const year = cells[2];
  
  // Column indices: Side Sq Ft = 5, Back Sq Ft = 8, Hood Sq Ft = 11, Roof = 14, Total = 15
  const sideSqFt = parseValue(cells[5]);
  const backSqFt = parseValue(cells[8]);
  const hoodSqFt = parseValue(cells[11]);
  const roofSqFt = parseValue(cells[14]);
  const totalSqFoot = parseValue(cells[15]);
  
  // Calculate corrected sq footage (10% markup for overlap/waste)
  const correctedSqFoot = totalSqFoot ? Math.round(totalSqFoot * 1.10 * 10) / 10 : null;

  // Only add if we have the essential data
  if (make && model && year) {
    vehicles.push({
      "Make": make,
      "Model": model,
      "Year": year,
      "Side Sq Ft": sideSqFt,
      "Back Sq Ft": backSqFt,
      "Hood Sq Ft": hoodSqFt,
      "Roof Squ Ft": roofSqFt,
      "Total Sq Foot": totalSqFoot,
      "Corrected Sq Foot": correctedSqFoot
    });
  }
}

console.log(`✅ Parsed ${vehicles.length} vehicles from text file`);

// Generate the TypeScript file content
const tsContent = `// Vehicle dimensions data - Embedded for reliable loading
// Generated from parsed-vehicles-full.txt
// Total: ${vehicles.length} vehicles

interface VehicleDimensions {
  Make: string;
  Model: string;
  Year: string;
  "Side Sq Ft": number | null;
  "Back Sq Ft": number | null;
  "Hood Sq Ft": number | null;
  "Roof Squ Ft": number | null;
  "Total Sq Foot": number | null;
  "Corrected Sq Foot": number | null;
}

export const vehicleDimensionsData = {
  vehicles: ${JSON.stringify(vehicles, null, 2)} as VehicleDimensions[]
};

// Log vehicle count at module load time for verification
console.log(\`🚗 Vehicle database loaded: \${vehicleDimensionsData.vehicles.length} vehicles\`);
`;

// Write the new parseVehicleData.ts file
fs.writeFileSync(
  path.join(__dirname, '../src/data/parseVehicleData.ts'),
  tsContent
);

console.log(`✅ Generated parseVehicleData.ts with ${vehicles.length} embedded vehicles`);
console.log(`📊 Sample vehicles:`);
console.log(vehicles.slice(0, 3).map(v => `  - ${v.Year} ${v.Make} ${v.Model}: ${v["Corrected Sq Foot"]} sq ft`).join('\n'));
