/**
 * Script to convert the 1600-vehicle Excel data to JSON format
 * Uses the parsed markdown table from document parser
 */

import fs from 'fs/promises';
import path from 'path';

const parseValue = (val: string): number | null => {
  if (!val || val === '' || val === '-') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

const parseTableRow = (line: string): any | null => {
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

async function convertVehicleData() {
  try {
    // Read the parsed document from tool-results
    const parsedPath = path.join(process.cwd(), '../../../tool-results/document--parse_document/20251120-062040-025704');
    const content = await fs.readFile(parsedPath, 'utf8');
    
    const lines = content.split('\n');
    const vehicles: any[] = [];
    
    for (const line of lines) {
      const vehicle = parseTableRow(line);
      if (vehicle && vehicle.Make) {
        vehicles.push(vehicle);
      }
    }
    
    const output = { vehicles };
    
    // Write to vehicle-dimensions.json
    const outputPath = path.join(__dirname, 'vehicle-dimensions.json');
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`✅ Successfully converted ${vehicles.length} vehicles to JSON`);
    console.log(`📁 Saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error processing file:', error);
    throw error;
  }
}

convertVehicleData();
