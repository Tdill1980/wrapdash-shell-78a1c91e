// Temporary script to convert Excel data to JSON format
// This will parse the markdown table from the Excel file and convert to JSON

import fs from 'fs';
import path from 'path';

const parseTableRow = (row: string): any => {
  const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
  
  if (cells.length < 17) return null;
  
  const parseValue = (val: string): number | null => {
    if (!val || val === '' || val === '-') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };
  
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

// Read the parsed Excel content
const parsedContent = `|Make|Model|Year|Side Width|Side Height|Side Sq Ft|Back Width|Back Height|Back Sq Ft|Hood Width|Hood Length|Hood Sq Ft|Roof Width|Roof Length|Roof Squ Ft|Total Sq Foot|Corrected Sq Foot|
|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|-|
|Acura|CSX 4 Door Sedan|2006-2011|49.0|172.0|68.0|67.0|42.0|24.3|54.0|27.0|13.8|50.0|65.0|27.6|201.7|222.0|`;

// This would be populated with all rows from the Excel file
const lines = parsedContent.split('\n');
const vehicles: any[] = [];

for (let i = 2; i < lines.length; i++) {
  const vehicle = parseTableRow(lines[i]);
  if (vehicle && vehicle.Make) {
    vehicles.push(vehicle);
  }
}

const output = {
  vehicles: vehicles
};

console.log(JSON.stringify(output, null, 2));
