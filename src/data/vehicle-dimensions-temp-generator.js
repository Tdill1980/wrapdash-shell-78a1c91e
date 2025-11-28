// Temporary script to generate complete vehicle-dimensions.json
const fs = require('fs');
const path = require('path');

// Read the full parsed data
const parsedData = fs.readFileSync(path.join(__dirname, 'parsed-vehicles-full.txt'), 'utf8');
const lines = parsedData.split('\n');

const vehicles = [];

for (const line of lines) {
  // Skip empty lines, header lines, and separator lines
  if (!line.trim() || !line.startsWith('|') || line.includes('Make|Model|Year') || line.match(/^\|-+/)) {
    continue;
  }

  // Split by pipe and clean
  const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
  
  // Need at least 16 columns
  if (cells.length < 16) continue;
  
  // Skip if it's clearly a header
  if (cells[0] === 'Make') continue;

  const parseFloat = (val) => {
    if (!val || val === '' || val === '-') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const make = cells[0];
  const model = cells[1];
  const year = cells[2];
  const sideSqFt = parseFloat(cells[5]);
  const backSqFt = parseFloat(cells[8]);
  const hoodSqFt = parseFloat(cells[11]);
  const roofSqFt = parseFloat(cells[14]);
  const totalSqFoot = parseFloat(cells[15]);
  
  // Calculate corrected square footage (10% markup for overlap/waste)
  const correctedSqFoot = totalSqFoot ? Math.round(totalSqFoot * 1.10 * 10) / 10 : null;

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

const output = { vehicles };

// Write to vehicle-dimensions.json
const outputPath = path.join(__dirname, 'vehicle-dimensions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully converted ${vehicles.length} vehicles to JSON`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`\nFirst vehicle:`, vehicles[0]);
console.log(`\nLast vehicle:`, vehicles[vehicles.length - 1]);
