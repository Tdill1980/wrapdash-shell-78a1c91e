const fs = require('fs');
const path = require('path');

// Read the parsed vehicles file
const filePath = path.join(__dirname, 'src/data/parsed-vehicles-full.txt');
const content = fs.readFileSync(filePath, 'utf8');

// Parse lines that start with | and a capital letter (actual data rows)
// Exclude header rows that contain "Make|Model" or start with "|-"
const lines = content.split('\n').filter(line => {
  if (!line.match(/^\|[A-Z]/)) return false;
  if (line.includes('Make|Model')) return false;
  if (line.startsWith('|-')) return false;
  return true;
});

const vehicles = [];

for (const line of lines) {
  const parts = line.split('|').filter(p => p !== '');

  if (parts.length >= 16) {
    const make = parts[0].trim();
    const model = parts[1].trim();
    const yearStr = parts[2].trim();

    // Parse year range
    const yearParts = yearStr.split('-');
    let yearStart = parseInt(yearParts[0]) || 1990;
    let yearEnd = yearParts.length > 1 ? (parseInt(yearParts[1]) || yearStart) : yearStart;

    // Handle invalid years
    if (yearStart < 1900 || yearStart > 2030) yearStart = 1990;
    if (yearEnd < 1900 || yearEnd > 2030) yearEnd = 2030;

    // Parse sqft values (columns 5, 8, 11, 14, 15)
    const sideSqft = parseFloat(parts[5]) || 0;
    const backSqft = parseFloat(parts[8]) || 0;
    const hoodSqft = parseFloat(parts[11]) || 0;
    const roofSqft = parseFloat(parts[14]) || 0;
    let totalSqft = parseFloat(parts[15]) || 0;

    // Calculate total if not provided
    if (totalSqft === 0) {
      totalSqft = sideSqft + backSqft + hoodSqft + roofSqft;
    }

    vehicles.push({
      make,
      model,
      year_start: yearStart,
      year_end: yearEnd,
      side_sqft: sideSqft,
      back_sqft: backSqft,
      hood_sqft: hoodSqft,
      roof_sqft: roofSqft,
      total_sqft: totalSqft,
      corrected_sqft: totalSqft
    });
  }
}

console.log(`Parsed ${vehicles.length} vehicles`);

// Write to JSON file
const outputPath = path.join(__dirname, 'supabase/functions/seed-vehicle-dimensions/vehicles.json');
fs.writeFileSync(outputPath, JSON.stringify(vehicles, null, 2));
console.log(`Written to ${outputPath}`);

// Also output some stats
const makes = [...new Set(vehicles.map(v => v.make))];
console.log(`Unique makes: ${makes.length}`);
console.log(`Makes: ${makes.slice(0, 10).join(', ')}...`);
