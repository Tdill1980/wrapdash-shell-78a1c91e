// Node script to convert the parsed Excel markdown to JSON
// Run with: node src/data/process-vehicle-excel.js

const fs = require('fs');

// Read the parsed Excel content from tool-results
const parsedFilePath = '../../../tool-results/document--parse_document/20251120-062040-025704';

try {
  const content = fs.readFileSync(parsedFilePath, 'utf8');
  
  // Extract all table rows (lines starting with |)
  const lines = content.split('\n');
  const vehicles = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('|') && !line.includes('Make|Model|Year') && !line.includes('|-|-|-|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
      
      if (cells.length >= 17 && cells[0] !== 'Make') {
        const parseNum = (val) => {
          if (!val || val === '' || val === '-') return null;
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        };
        
        vehicles.push({
          "Make": cells[0],
          "Model": cells[1],
          "Year": cells[2],
          "Side Width": parseNum(cells[3]),
          "Side Height": parseNum(cells[4]),
          "Side Sq Ft": parseNum(cells[5]),
          "Back Width": parseNum(cells[6]),
          "Back Height": parseNum(cells[7]),
          "Back Sq Ft": parseNum(cells[8]),
          "Hood Width": parseNum(cells[9]),
          "Hood Length": parseNum(cells[10]),
          "Hood Sq Ft": parseNum(cells[11]),
          "Roof Width": parseNum(cells[12]),
          "Roof Length": parseNum(cells[13]),
          "Roof Squ Ft": parseNum(cells[14]),
          "Total Sq Foot": parseNum(cells[15]),
          "Corrected Sq Foot": parseNum(cells[16])
        });
      }
    }
  }
  
  const output = { vehicles };
  
  // Write to vehicle-dimensions.json
  fs.writeFileSync(
    'src/data/vehicle-dimensions.json',
    JSON.stringify(output, null, 2)
  );
  
  console.log(`Successfully converted ${vehicles.length} vehicles to JSON`);
  
} catch (error) {
  console.error('Error processing file:', error.message);
}
