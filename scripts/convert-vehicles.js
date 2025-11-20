#!/usr/bin/env node

/**
 * Convert parsed Excel vehicle data to JSON format
 * 
 * Usage: node scripts/convert-vehicles.js
 * 
 * This script reads the parsed vehicle data from the document parser
 * and converts it to the vehicle-dimensions.json format needed by the app.
 */

const fs = require('fs');
const path = require('path');

console.log('🚗 Converting vehicle data to JSON...\n');

// Read the parsed Excel content from tool-results
const parsedFilePath = path.join(__dirname, '../tool-results/document--parse_document/20251120-062907-830673');

if (!fs.existsSync(parsedFilePath)) {
  console.error('❌ Error: Parsed Excel file not found at:', parsedFilePath);
  console.error('   Please ensure the Excel file has been parsed using the document parser.');
  process.exit(1);
}

const content = fs.readFileSync(parsedFilePath, 'utf8');

/**
 * Parse a numeric value, handling nulls and empty strings
 */
function parseValue(val) {
  if (!val || val === '' || val === '-' || val === '||') {
    return null;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

/**
 * Parse a single table row from the markdown format
 */
function parseTableRow(line) {
  // Skip non-table lines
  if (!line.trim().startsWith('|')) {
    return null;
  }
  
  // Skip header and separator rows
  if (line.includes('Make|Model|Year') || line.includes('|-|-|-|')) {
    return null;
  }
  
  // Split by pipe and clean up
  const cells = line.split('|')
    .map(c => c.trim())
    .filter(c => c !== '');
  
  // Need at least 17 columns for a valid vehicle row
  if (cells.length < 17 || cells[0] === 'Make') {
    return null;
  }
  
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
}

// Process all lines
const lines = content.split('\n');
const vehicles = [];
let skippedCount = 0;

for (const line of lines) {
  const vehicle = parseTableRow(line);
  if (vehicle && vehicle.Make) {
    vehicles.push(vehicle);
  } else if (line.trim().startsWith('|') && !line.includes('|-|-|-|')) {
    skippedCount++;
  }
}

// Create output object
const output = { vehicles };

// Write to vehicle-dimensions.json
const outputPath = path.join(__dirname, '../src/data/vehicle-dimensions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully converted ${vehicles.length} vehicles to JSON`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`⏭️  Skipped ${skippedCount} invalid/header rows`);
console.log('\n📊 Vehicle breakdown by make:');

// Show breakdown by make
const makeCount = vehicles.reduce((acc, v) => {
  acc[v.Make] = (acc[v.Make] || 0) + 1;
  return acc;
}, {});

Object.entries(makeCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([make, count]) => {
    console.log(`   ${make}: ${count} models`);
  });

console.log(`   ...and ${Object.keys(makeCount).length - 10} more makes`);
console.log('\n✨ Vehicle database is ready!\n');
