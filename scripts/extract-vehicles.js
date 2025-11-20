const fs = require('fs');
const path = require('path');

// Read the parsed data
const content = fs.readFileSync(path.join(__dirname, '../src/data/parsed-vehicles-full.txt'), 'utf-8');

const parseValue = (val) => {
  if (!val || val.trim() === '' || val.trim() === '-') return null;
  const num = parseFloat(val.trim());
  return isNaN(num) ? null : num;
};

const vehicles = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Skip non-table rows
  if (!line.includes('|') || line.includes('Make|Model|Year') || line.includes('|-|')) {
    continue;
  }
  
  // Extract table data
  const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
  
  // Skip if not enough columns or if it starts with a line number
  if (parts.length < 16 || parts[0].match(/^\d+:$/)) {
    continue;
  }
  
  const make = parts[0];
  
  // Skip if make is empty or is a header
  if (!make || make === 'Make' || make === '') {
    continue;
  }
  
  vehicles.push({
    "Make": make,
    "Model": parts[1],
    "Year": parts[2],
    "Side Width": parseValue(parts[3]),
    "Side Height": parseValue(parts[4]),
    "Side Sq Ft": parseValue(parts[5]),
    "Back Width": parseValue(parts[6]),
    "Back Height": parseValue(parts[7]),
    "Back Sq Ft": parseValue(parts[8]),
    "Hood Width": parseValue(parts[9]),
    "Hood Length": parseValue(parts[10]),
    "Hood Sq Ft": parseValue(parts[11]),
    "Roof Width": parseValue(parts[12]),
    "Roof Length": parseValue(parts[13]),
    "Roof Squ Ft": parseValue(parts[14]),
    "Total Sq Foot": parseValue(parts[15]),
    "Corrected Sq Foot": parseValue(parts[15])
  });
}

const output = { vehicles };

// Write to JSON
const outputPath = path.join(__dirname, '../src/data/vehicle-dimensions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Extracted ${vehicles.length} vehicles`);
console.log(`First: ${vehicles[0].Make} ${vehicles[0].Model} (${vehicles[0].Year})`);
if (vehicles.length > 0) {
  console.log(`Last: ${vehicles[vehicles.length - 1].Make} ${vehicles[vehicles.length - 1].Model} (${vehicles[vehicles.length - 1].Year})`);
}
