/**
 * Parse the Excel data and convert to vehicle-dimensions.json
 * Run with: node src/data/parse-and-convert.js
 */
const fs = require('fs');
const path = require('path');

// Read the parsed Excel content
const parsedPath = path.join(__dirname, '../../tool-results/document--parse_document/20251120-062907-830673');
const content = fs.readFileSync(parsedPath, 'utf8');

const parseValue = (val) => {
  if (!val || val === '' || val === '-' || val === '||') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const parseTableRow = (line) => {
  if (!line.trim().startsWith('|')) return null;
  if (line.includes('Make|Model|Year') || line.includes('|-|-|-|')) return null;
  
  const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
  
  if (cells.length < 17 || cells[0] === 'Make') return null;
  
  return {
    "Make": cells[0],
    "Model": cells[1],
    "Year": cells[2],
    "Side Width": parseValue(cells[3]),
    "Side Height": parseValue(cells[4]),
    "Side Sq Ft": parseValue(cells[5]),
    "Back Width": parseValue(cells[6]),
    "Back Height": parseValue(cells[7]),
    "Back Sq Ft": parseValue(cells[8]),
    "Hood Width": parseValue(cells[9]),
    "Hood Length": parseValue(cells[10]),
    "Hood Sq Ft": parseValue(cells[11]),
    "Roof Width": parseValue(cells[12]),
    "Roof Length": parseValue(cells[13]),
    "Roof Squ Ft": parseValue(cells[14]),
    "Total Sq Foot": parseValue(cells[15]),
    "Corrected Sq Foot": parseValue(cells[16])
  };
};

const lines = content.split('\n');
const vehicles = [];

for (const line of lines) {
  const vehicle = parseTableRow(line);
  if (vehicle && vehicle.Make) {
    vehicles.push(vehicle);
  }
}

const output = { vehicles };

// Write to vehicle-dimensions.json
const outputPath = path.join(__dirname, 'vehicle-dimensions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully converted ${vehicles.length} vehicles to JSON`);
console.log(`📁 Saved to: ${outputPath}`);
