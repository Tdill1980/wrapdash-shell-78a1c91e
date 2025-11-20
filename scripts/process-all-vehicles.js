const fs = require('fs');
const path = require('path');

// Read the parsed Excel data
const parsedFilePath = path.join(__dirname, '../src/data/parsed-excel.txt');
const content = fs.readFileSync(parsedFilePath, 'utf-8');

const parseValue = (val) => {
  if (!val || val === '' || val === '-' || val === '|') return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-') return null;
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
};

const parseTableRow = (line) => {
  // Skip if not a table row
  if (!line.includes('|') || line.includes('Make|Model|Year') || line.includes('|-|')) {
    return null;
  }
  
  // Split by pipe and clean
  const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
  
  // Must have at least 16 cells (all the data fields)
  if (cells.length < 16) return null;
  
  // Skip header rows
  if (cells[0] === 'Make' || !cells[0] || cells[0].match(/^\d+:/)) return null;
  
  const make = cells[0];
  const model = cells[1];
  const year = cells[2];
  
  // Skip if make is empty or invalid
  if (!make || make === '' || make === 'Make') return null;
  
  return {
    "Make": make,
    "Model": model,
    "Year": year,
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
    "Corrected Sq Foot": parseValue(cells[15]) // Use Total Sq Foot as Corrected
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

const output = {
  vehicles: vehicles
};

// Write to vehicle-dimensions.json
const outputPath = path.join(__dirname, '../src/data/vehicle-dimensions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully converted ${vehicles.length} vehicles to vehicle-dimensions.json`);
console.log(`First vehicle: ${vehicles[0].Make} ${vehicles[0].Model}`);
console.log(`Last vehicle: ${vehicles[vehicles.length - 1].Make} ${vehicles[vehicles.length - 1].Model}`);
