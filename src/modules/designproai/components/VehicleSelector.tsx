import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getVehicleMakes } from "@/lib/vehicleSqft";

interface VehicleSelectorProps {
  vehicleMake: string;
  setVehicleMake: (make: string) => void;
  vehicleModel: string;
  setVehicleModel: (model: string) => void;
  vehicleYear: number;
  setVehicleYear: (year: number) => void;
  vehicleType: string;
  setVehicleType: (type: string) => void;
}

// Only show makes that have SQFT data in the database
const VEHICLE_MAKES = getVehicleMakes();

const VEHICLE_TYPES = [
  "Sedan", "SUV", "Coupe", "Convertible", "Truck", "Van", "Hatchback", "Wagon"
];

export const VehicleSelector = ({
  vehicleMake,
  setVehicleMake,
  vehicleModel,
  setVehicleModel,
  vehicleYear,
  setVehicleYear,
  vehicleType,
  setVehicleType,
}: VehicleSelectorProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={vehicleYear.toString()} onValueChange={(val) => setVehicleYear(parseInt(val))}>
            <SelectTrigger className="bg-surface border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Make</Label>
          <Select value={vehicleMake} onValueChange={setVehicleMake}>
            <SelectTrigger className="bg-surface border-border">
              <SelectValue placeholder="Select make" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border">
              {VEHICLE_MAKES.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <Input
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
          placeholder="Enter model name"
          className="bg-surface border-border"
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={vehicleType} onValueChange={setVehicleType}>
          <SelectTrigger className="bg-surface border-border">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border">
            {VEHICLE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
