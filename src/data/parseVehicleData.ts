// Vehicle dimensions data - Runtime parser with embedded data
// This ensures reliable loading without depending on ?raw imports

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

// Import the pre-generated JSON data instead of parsing at runtime
import vehicleJson from './vehicle-dimensions.json';

// Re-export with proper typing
export const vehicleDimensionsData = vehicleJson as { vehicles: VehicleDimensions[] };

// Log vehicle count at module load time for verification
console.log(`🚗 Vehicle database loaded: ${vehicleDimensionsData.vehicles.length} vehicles`);
