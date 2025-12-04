// Vehicle dimensions data - Runtime parser
// Parses the full vehicle database (1,664 vehicles) from raw text format

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

// Import the raw text data using Vite's ?raw suffix
import rawVehicleData from './parsed-vehicles-full.txt?raw';

const parseFloatSafe = (val: string): number | null => {
  if (!val || val === '' || val === '-' || val.trim() === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const parseVehicleData = (): { vehicles: VehicleDimensions[] } => {
  const lines = rawVehicleData.split('\n');
  const vehicles: VehicleDimensions[] = [];

  for (const line of lines) {
    // Skip empty lines, headers, separators
    if (!line.trim() || !line.startsWith('|')) continue;
    if (line.includes('Make|Model|Year')) continue;
    if (line.match(/^\|[\-\|]+\|?$/)) continue;
    if (line.includes('# Document') || line.includes('## Page')) continue;
    
    // Split by pipe and clean whitespace
    const rawCells = line.split('|');
    // Remove empty first and last elements from pipe split
    const cells = rawCells.slice(1, -1).map(c => c.trim());
    
    // Need at least Make, Model, Year and some measurements (16 columns expected)
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
    
    const sideSqFt = parseFloatSafe(cells[5]);
    const backSqFt = parseFloatSafe(cells[8]);
    const hoodSqFt = parseFloatSafe(cells[11]);
    const roofSqFt = parseFloatSafe(cells[14]);
    const totalSqFoot = parseFloatSafe(cells[15]);
    
    // Calculate corrected sq footage (10% markup for overlap/waste)
    const correctedSqFoot = totalSqFoot ? Math.round(totalSqFoot * 1.10 * 10) / 10 : null;

    // Only add if we have the essential data
    if (make && model && year) {
      vehicles.push({
        Make: make,
        Model: model,
        Year: year,
        "Side Sq Ft": sideSqFt,
        "Back Sq Ft": backSqFt,
        "Hood Sq Ft": hoodSqFt,
        "Roof Squ Ft": roofSqFt,
        "Total Sq Foot": totalSqFoot,
        "Corrected Sq Foot": correctedSqFoot
      });
    }
  }

  return { vehicles };
};

// Parse and export the vehicle data
export const vehicleDimensionsData = parseVehicleData();

// Log vehicle count at module load time for verification
console.log(`🚗 Vehicle database loaded: ${vehicleDimensionsData.vehicles.length} vehicles`);
