/**
 * Generate complete vehicle SQFT JSON from parsed-vehicles-full.txt
 * This creates vehicleSqft.full.json with all 1,670 vehicles
 */
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../src/data/parsed-vehicles-full.txt');
const outputPathFull = path.join(__dirname, '../src/lib/vehicleSqft.full.json');
const outputPathData = path.join(__dirname, '../src/data/vehicle-dimensions.json');

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

const parseValue = (val) => {
  if (!val || val.trim() === '' || val === '-' || val === '||') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const parseYear = (yearStr) => {
  if (!yearStr || yearStr === '-') return { start: null, end: null };
  
  // Handle ranges like "2006-2011"
  if (yearStr.includes('-')) {
    const [start, end] = yearStr.split('-').map(y => parseInt(y.trim()));
    return { 
      start: isNaN(start) ? null : start, 
      end: isNaN(end) ? null : end 
    };
  }
  
  // Single year
  const year = parseInt(yearStr);
  return { 
    start: isNaN(year) ? null : year, 
    end: isNaN(year) ? null : year 
  };
};

const vehicles = [];
const vehiclesForDB = [];

for (const line of lines) {
  // Skip header, separator, and non-data lines
  if (!line.trim().startsWith('|')) continue;
  if (line.includes('Make|Model|Year') || line.includes('|-|-|-|')) continue;
  
  const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
  
  // Need at least Make, Model, Year, and some dimensions
  if (cells.length < 15 || cells[0] === 'Make') continue;
  
  const make = cells[0];
  const model = cells[1];
  const yearStr = cells[2];
  const { start: yearStart, end: yearEnd } = parseYear(yearStr);
  
  // Parse panel dimensions - columns are:
  // 3: Side Width, 4: Side Height, 5: Side Sq Ft
  // 6: Back Width, 7: Back Height, 8: Back Sq Ft
  // 9: Hood Width, 10: Hood Length, 11: Hood Sq Ft
  // 12: Roof Width, 13: Roof Length, 14: Roof Squ Ft
  // 15: Total Sq Foot
  
  const sideSqft = parseValue(cells[5]);
  const backSqft = parseValue(cells[8]);
  const hoodSqft = parseValue(cells[11]);
  const roofSqft = parseValue(cells[14]);
  const totalSqft = parseValue(cells[15]);
  
  // Skip if no meaningful data
  if (!make || !model || totalSqft === null) continue;
  
  // Format for vehicleSqft.full.json (used by portable module)
  vehicles.push({
    make,
    model,
    yearStart,
    yearEnd,
    totalSqft,
    panels: {
      sides: sideSqft || 0,
      back: backSqft || 0,
      hood: hoodSqft || 0,
      roof: roofSqft || 0
    }
  });
  
  // Format for vehicle-dimensions.json (legacy format with more detail)
  vehiclesForDB.push({
    Make: make,
    Model: model,
    Year: yearStr,
    "Side Sq Ft": sideSqft,
    "Back Sq Ft": backSqft,
    "Hood Sq Ft": hoodSqft,
    "Roof Squ Ft": roofSqft,
    "Total Sq Foot": totalSqft
  });
}

// Write vehicleSqft.full.json
const fullOutput = { vehicles };
fs.writeFileSync(outputPathFull, JSON.stringify(fullOutput, null, 2));

// Write vehicle-dimensions.json
const dbOutput = { vehicles: vehiclesForDB };
fs.writeFileSync(outputPathData, JSON.stringify(dbOutput, null, 2));

console.log(`✅ Generated ${vehicles.length} vehicles`);
console.log(`📁 vehicleSqft.full.json: ${outputPathFull}`);
console.log(`📁 vehicle-dimensions.json: ${outputPathData}`);

// Show sample
console.log('\n📊 First vehicle:', JSON.stringify(vehicles[0], null, 2));
console.log('\n📊 Last vehicle:', JSON.stringify(vehicles[vehicles.length - 1], null, 2));

// Show make distribution
const makes = {};
vehicles.forEach(v => {
  makes[v.make] = (makes[v.make] || 0) + 1;
});
console.log('\n📈 Vehicles by Make:');
Object.entries(makes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([make, count]) => console.log(`  ${make}: ${count}`));
