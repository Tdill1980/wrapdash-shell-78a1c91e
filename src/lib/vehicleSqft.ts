import { vehicleDimensionsData } from '@/data/parseVehicleData';

export interface VehicleDimensions {
  Make: string;
  Model: string;
  Year: string;
  "Total Sq Foot": number;
  "Corrected Sq Foot": number;
  "Roof Squ Ft": number;
}

export interface VehicleSQFTOptions {
  withRoof: number;      // Corrected Sq Foot
  withoutRoof: number;   // Total Sq Foot
  roofOnly: number;      // Roof Squ Ft
  panels: {
    sides: number;       // Side Sq Ft
    back: number;        // Back Sq Ft
    hood: number;        // Hood Sq Ft
    roof: number;        // Roof Squ Ft
  };
}

/**
 * Get vehicle SQFT options from lookup table
 * Returns all three SQFT values: with roof, without roof, and roof only
 * Uses flexible matching - if exact year not in range, finds closest match for same make/model
 */
export function getVehicleSQFTOptions(year: string, make: string, model: string): VehicleSQFTOptions | null {
  if (!vehicleDimensionsData?.vehicles || vehicleDimensionsData.vehicles.length === 0) {
    console.log("Vehicle dimensions data not available");
    return null;
  }

  // Normalize inputs
  const normalizedYear = year.trim();
  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();
  const inputYear = parseInt(normalizedYear);

  console.log(`Searching for vehicle: ${normalizedYear} ${normalizedMake} ${normalizedModel}`);

  // First pass: find exact matches
  let vehicle = vehicleDimensionsData.vehicles.find((v: any) => {
    const vehicleYear = v.Year.toString();
    const vehicleMake = v.Make.toLowerCase();
    const vehicleModel = v.Model.toLowerCase();
    
    // Case-insensitive make matching
    const makeMatch = vehicleMake === normalizedMake;
    
    // Flexible model matching - partial match both ways
    const modelMatch = 
      vehicleModel.includes(normalizedModel) || 
      normalizedModel.includes(vehicleModel);

    if (!makeMatch || !modelMatch) return false;
    
    // Year matching - handle ranges like "2008-2017" and single years
    let yearMatch = false;
    if (vehicleYear.includes('-')) {
      const [startYear, endYear] = vehicleYear.split('-').map(y => parseInt(y.trim()));
      yearMatch = inputYear >= startYear && inputYear <= endYear;
    } else {
      yearMatch = vehicleYear === normalizedYear;
    }
    
    if (yearMatch) {
      console.log(`✓ Exact match found: ${v.Year} ${v.Make} ${v.Model}`);
    }
    
    return yearMatch;
  });

  // Second pass: if no exact match, find closest match for same make/model
  if (!vehicle) {
    const makeModelMatches = vehicleDimensionsData.vehicles.filter((v: any) => {
      const vehicleMake = v.Make.toLowerCase();
      const vehicleModel = v.Model.toLowerCase();
      const makeMatch = vehicleMake === normalizedMake;
      const modelMatch = vehicleModel.includes(normalizedModel) || normalizedModel.includes(vehicleModel);
      return makeMatch && modelMatch;
    });

    if (makeModelMatches.length > 0) {
      // Find the closest year range
      let closestVehicle = null;
      let closestDistance = Infinity;

      for (const v of makeModelMatches) {
        const vehicleYear = v.Year.toString();
        let endYear: number;
        
        if (vehicleYear.includes('-')) {
          endYear = parseInt(vehicleYear.split('-')[1].trim());
        } else {
          endYear = parseInt(vehicleYear);
        }

        const distance = Math.abs(inputYear - endYear);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestVehicle = v;
        }
      }

      if (closestVehicle && closestDistance <= 15) {
        // Allow up to 15 years difference for flexible matching
        console.log(`✓ Closest match found: ${closestVehicle.Year} ${closestVehicle.Make} ${closestVehicle.Model} (${closestDistance} years off)`);
        vehicle = closestVehicle;
      } else if (closestVehicle) {
        // Final fallback: use ANY match for same make/model regardless of year
        console.log(`✓ Fallback match (year mismatch): ${closestVehicle.Year} ${closestVehicle.Make} ${closestVehicle.Model}`);
        vehicle = closestVehicle;
      }
    }
  }

  if (!vehicle) {
    console.log(`✗ No match found for: ${normalizedYear} ${normalizedMake} ${normalizedModel}`);
    return null;
  }

  return {
    withRoof: vehicle["Corrected Sq Foot"] || 0,
    withoutRoof: vehicle["Total Sq Foot"] || 0,
    roofOnly: vehicle["Roof Squ Ft"] || 0,
    panels: {
      sides: vehicle["Side Sq Ft"] || 0,
      back: vehicle["Back Sq Ft"] || 0,
      hood: vehicle["Hood Sq Ft"] || 0,
      roof: vehicle["Roof Squ Ft"] || 0,
    },
  };
}

/**
 * Get vehicle SQFT from lookup table
 * Returns Corrected Sq Foot if available, otherwise Total Sq Foot
 * @deprecated Use getVehicleSQFTOptions instead
 */
export function getVehicleSQFT(year: string, make: string, model: string): number | null {
  if (!vehicleDimensionsData?.vehicles || vehicleDimensionsData.vehicles.length === 0) {
    return null;
  }

  const vehicle = vehicleDimensionsData.vehicles.find((v: any) => {
    const vehicleYear = v.Year.toString();
    const yearMatch = vehicleYear.includes(year) || year === vehicleYear.split('-')[0] || year === vehicleYear.split('-')[1];
    
    return (
      yearMatch &&
      v.Make.toLowerCase() === make.toLowerCase() &&
      v.Model.toLowerCase().includes(model.toLowerCase())
    );
  });

  if (!vehicle) return null;

  // Return Corrected Sq Foot if available, otherwise Total Sq Foot
  return vehicle["Corrected Sq Foot"] || vehicle["Total Sq Foot"] || null;
}

/**
 * Get all unique makes from vehicle database
 */
export function getVehicleMakes(): string[] {
  if (!vehicleDimensionsData?.vehicles) return [];
  
  const makes = new Set(
    vehicleDimensionsData.vehicles.map((v: any) => v.Make)
  );
  
  return Array.from(makes).sort();
}

/**
 * Get models for a specific make
 */
export function getVehicleModels(make: string): string[] {
  if (!vehicleDimensionsData?.vehicles) return [];
  
  const models = vehicleDimensionsData.vehicles
    .filter((v: any) => v.Make.toLowerCase() === make.toLowerCase())
    .map((v: any) => v.Model);
  
  return Array.from(new Set(models)).sort();
}

/**
 * Get available years for a specific make/model combination
 * Parses year ranges like "2008-2017" into individual years
 */
export function getVehicleYears(make: string, model: string): number[] {
  if (!vehicleDimensionsData?.vehicles) return [];
  
  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();
  
  const matchingVehicles = vehicleDimensionsData.vehicles.filter((v: any) => {
    const vehicleMake = v.Make.toLowerCase();
    const vehicleModel = v.Model.toLowerCase();
    const makeMatch = vehicleMake === normalizedMake;
    const modelMatch = vehicleModel.includes(normalizedModel) || normalizedModel.includes(vehicleModel);
    return makeMatch && modelMatch;
  });
  
  const years: number[] = [];
  
  for (const v of matchingVehicles) {
    const yearStr = v.Year.toString();
    if (yearStr.includes('-')) {
      // Parse year range like "2008-2017"
      const [startYear, endYear] = yearStr.split('-').map((y: string) => parseInt(y.trim()));
      for (let y = startYear; y <= endYear; y++) {
        years.push(y);
      }
    } else {
      const singleYear = parseInt(yearStr);
      if (!isNaN(singleYear)) {
        years.push(singleYear);
      }
    }
  }
  
  // Deduplicate and sort descending (newest first)
  return [...new Set(years)].sort((a, b) => b - a);
}
