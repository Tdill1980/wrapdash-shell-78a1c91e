#!/usr/bin/env node

/**
 * Parse parsed-vehicles-full.txt and generate complete vehicle-dimensions.json
 * with all 1,664+ vehicles
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting vehicle database regeneration...\n');

const inputPath = path.join(__dirname, '..', 'src', 'data', 'parsed-vehicles-full.txt');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'vehicle-dimensions.json');

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

const parseFloat2 = (val) => {
  if (!val || val === '' || val === '-' || val.trim() === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const vehicles = [];

for (const line of lines) {
  // Skip empty lines, headers, separators
  if (!line.trim() || !line.startsWith('|')) continue;
  if (line.includes('Make|Model|Year')) continue;
  if (line.match(/^\|[\-\|]+\|?$/)) continue;
  if (line.includes('# Document') || line.includes('## Page')) continue;
  
  // Split by pipe and clean whitespace
  const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => {
    // Filter out empty first/last cells from pipe splits
    return !(i === 0 && c === '') && !(i === arr.length - 1 && c === '');
  });
  
  // Need at least Make, Model, Year and some measurements
  if (cells.length < 6) continue;
  
  // Skip header rows that slipped through
  if (cells[0] === 'Make') continue;
  
  const make = cells[0];
  const model = cells[1];
  const year = cells[2];
  
  // Column indices based on the header:
  // Make(0)|Model(1)|Year(2)|Side Width(3)|Side Height(4)|Side Sq Ft(5)|
  // Back Width(6)|Back Height(7)|Back Sq Ft(8)|Hood Width(9)|Hood Length(10)|Hood Sq Ft(11)|
  // Roof Width(12)|Roof Length(13)|Roof Squ Ft(14)|Total Sq Foot(15)
  
  const sideSqFt = parseFloat2(cells[5]);
  const backSqFt = parseFloat2(cells[8]);
  const hoodSqFt = parseFloat2(cells[11]);
  const roofSqFt = parseFloat2(cells[14]);
  const totalSqFoot = parseFloat2(cells[15]);
  
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

const output = { vehicles };

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully generated vehicle-dimensions.json`);
console.log(`📊 Total vehicles: ${vehicles.length}`);
console.log(`📁 Output: src/data/vehicle-dimensions.json\n`);

// Show samples
if (vehicles.length > 0) {
  console.log('Sample entries:');
  console.log(`  First: ${vehicles[0].Year} ${vehicles[0].Make} ${vehicles[0].Model} (${vehicles[0]["Total Sq Foot"]} sq ft)`);
  console.log(`  Last:  ${vehicles[vehicles.length - 1].Year} ${vehicles[vehicles.length - 1].Make} ${vehicles[vehicles.length - 1].Model} (${vehicles[vehicles.length - 1]["Total Sq Foot"]} sq ft)`);
  
  // Count by make
  const makes = [...new Set(vehicles.map(v => v.Make))];
  console.log(`\n📋 ${makes.length} unique makes found`);
}

console.log('\n🎉 Vehicle database regeneration complete!');
