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
}

/**
 * Get vehicle SQFT options from lookup table
 * Returns all three SQFT values: with roof, without roof, and roof only
 */
export function getVehicleSQFTOptions(year: string, make: string, model: string): VehicleSQFTOptions | null {
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

  return {
    withRoof: vehicle["Corrected Sq Foot"] || 0,
    withoutRoof: vehicle["Total Sq Foot"] || 0,
    roofOnly: vehicle["Roof Squ Ft"] || 0,
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
