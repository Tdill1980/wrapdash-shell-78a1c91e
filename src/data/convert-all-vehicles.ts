import * as fs from 'fs';
import * as path from 'path';

// Read the parsed Excel data
const parsedFilePath = 'tool-results/document--parse_document/20251120-065709-812157';
const content = fs.readFileSync(parsedFilePath, 'utf-8');

const parseValue = (val: string): number | null => {
  if (!val || val === '' || val === '-') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const parseTableRow = (line: string): any | null => {
  // Skip header lines and separators
  if (line.includes('Make|Model|Year') || line.includes('|-|') || line.trim() === '') {
    return null;
  }
  
  // Extract table data - format: |Make|Model|Year|...|Total Sq Foot|
  const match = line.match(/\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/);
  
  if (!match) return null;
  
  const [_, make, model, year, sideWidth, sideHeight, sideSqFt, backWidth, backHeight, backSqFt, 
    hoodWidth, hoodLength, hoodSqFt, roofWidth, roofLength, roofSqFt, totalSqFt] = match;
  
  // Skip if make is empty or is a header
  if (!make || make.trim() === '' || make.trim() === 'Make') {
    return null;
  }
  
  return {
    "Make": make.trim(),
    "Model": model.trim(),
    "Year": year.trim(),
    "Side Width": parseValue(sideWidth),
    "Side Height": parseValue(sideHeight),
    "Side Sq Ft": parseValue(sideSqFt),
    "Back Width": parseValue(backWidth),
    "Back Height": parseValue(backHeight),
    "Back Sq Ft": parseValue(backSqFt),
    "Hood Width": parseValue(hoodWidth),
    "Hood Length": parseValue(hoodLength),
    "Hood Sq Ft": parseValue(hoodSqFt),
    "Roof Width": parseValue(roofWidth),
    "Roof Length": parseValue(roofLength),
    "Roof Squ Ft": parseValue(roofSqFt),
    "Total Sq Foot": parseValue(totalSqFt),
    "Corrected Sq Foot": parseValue(totalSqFt) // Using Total Sq Foot as Corrected for now
  };
};

const lines = content.split('\n');
const vehicles: any[] = [];

for (const line of lines) {
  const vehicle = parseTableRow(line);
  if (vehicle && vehicle.Make) {
    vehicles.push(vehicle);
  }
}

const output = {
  vehicles: vehicles
};

// Write to vehicle-dimensions.json
const outputPath = path.join(process.cwd(), 'src/data/vehicle-dimensions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully converted ${vehicles.length} vehicles to vehicle-dimensions.json`);
