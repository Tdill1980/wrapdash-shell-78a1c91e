import vehicleDimensionsData from "@/data/vehicle-dimensions.json";

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

  console.log(`Searching for vehicle: ${normalizedYear} ${normalizedMake} ${normalizedModel}`);

  const vehicle = vehicleDimensionsData.vehicles.find((v: any) => {
    const vehicleYear = v.Year.toString();
    const vehicleMake = v.Make.toLowerCase();
    const vehicleModel = v.Model.toLowerCase();
    
    // Improved year matching - handle ranges like "2018-2022" and single years
    let yearMatch = false;
    if (vehicleYear.includes('-')) {
      const [startYear, endYear] = vehicleYear.split('-').map(y => parseInt(y.trim()));
      const inputYear = parseInt(normalizedYear);
      yearMatch = inputYear >= startYear && inputYear <= endYear;
    } else {
      yearMatch = vehicleYear === normalizedYear;
    }
    
    // Case-insensitive make matching
    const makeMatch = vehicleMake === normalizedMake;
    
    // Flexible model matching - partial match both ways
    const modelMatch = 
      vehicleModel.includes(normalizedModel) || 
      normalizedModel.includes(vehicleModel);
    
    if (yearMatch && makeMatch && modelMatch) {
      console.log(`✓ Match found: ${v.Year} ${v.Make} ${v.Model}`);
    }
    
    return yearMatch && makeMatch && modelMatch;
  });

  if (!vehicle) {
    console.log(`✗ No match found for: ${normalizedYear} ${normalizedMake} ${normalizedModel}`);
    console.log(`Available makes:`, [...new Set(vehicleDimensionsData.vehicles.map((v: any) => v.Make))]);
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
 * Get available years for a specific make and model
 * Expands year ranges (e.g., "2008-2017") into individual years
 */
export function getVehicleYears(make: string, model: string): string[] {
  if (!vehicleDimensionsData?.vehicles) return [];
  
  const matchingVehicles = vehicleDimensionsData.vehicles.filter((v: any) => 
    v.Make.toLowerCase() === make.toLowerCase() &&
    v.Model.toLowerCase() === model.toLowerCase()
  );
  
  const years: number[] = [];
  
  for (const vehicle of matchingVehicles) {
    const yearStr = vehicle.Year.toString();
    if (yearStr.includes('-')) {
      const [start, end] = yearStr.split('-').map((y: string) => parseInt(y.trim()));
      for (let y = start; y <= end; y++) {
        years.push(y);
      }
    } else {
      const parsed = parseInt(yearStr);
      if (!isNaN(parsed)) {
        years.push(parsed);
      }
    }
  }
  
  // Deduplicate and sort descending (newest first)
  return [...new Set(years)].sort((a, b) => b - a).map(String);
}
