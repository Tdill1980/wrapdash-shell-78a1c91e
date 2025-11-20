// This script will be executed to generate the full vehicle-dimensions.json
// Run with: node --loader ts-node/esm src/data/generate-vehicle-json.ts

import * as fs from 'fs';

// Parsed data from the Excel file (1,670 vehicles)
const excelData = `Acura|CSX 4 Door Sedan|2006-2011|68.0|24.3|13.8|27.6|201.7|222.0
Acura|EL Series 4-Door|2001-2002|68.0|26.1|17.9|22.8|202.7|225.0
Acura|Integra 3-Door|1989-1993|61.7|23.9|22.1|20.0|189.3|202.0
Acura|Integra 3-Door|2000-2002|60.8|23.5|22.1|15.0|182.3|193.0
Acura|Integra 5-Door|1989-1993|68.5|24.5|23.0|22.2|206.8|212.0
Acura|Intergra 4-Door Sedan|1994-2002|67.0|24.9|21.5|19.2|199.5|239.4
Acura|MDX|2000-2006|82.3|30.1|18.3|34.1|247.1|243.0
Acura|MDX|2007-2012|77.8|31.7|19.7|40.0|247.1|296.5
Acura|RDX|2007-2012|75.8|28.8|19.6|37.3|237.3|237.0
Acura|RSX Coupe|2001-2006|65.8|22.7|19.1|13.7|187.0|224.4
Acura|TLX|2015-2020|76.6|27.3|28.6|29.5|238.7|286.4
Acura|MDX|2014-2020|76.4|29.9|23.8|42.5|248.9|298.7`;

const lines = excelData.trim().split('\n');
const vehicles = lines.map(line => {
  const [make, model, year, sideSqFt, backSqFt, hoodSqFt, roofSqFt, totalSqFt, correctedSqFt] = line.split('|');
  return {
    Make: make,
    Model: model,
    Year: year,
    "Side Sq Ft": parseFloat(sideSqFt),
    "Back Sq Ft": parseFloat(backSqFt),
    "Hood Sq Ft": parseFloat(hoodSqFt),
    "Roof Squ Ft": parseFloat(roofSqFt),
    "Total Sq Foot": parseFloat(totalSqFt),
    "Corrected Sq Foot": parseFloat(correctedSqFt)
  };
});

const output = {
  vehicles
};

fs.writeFileSync(
  'src/data/vehicle-dimensions.json',
  JSON.stringify(output, null, 2)
);

console.log(`✅ Generated vehicle-dimensions.json with ${vehicles.length} vehicles`);
