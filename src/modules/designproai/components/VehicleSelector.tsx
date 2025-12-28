import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicleDimensions } from "@/hooks/useVehicleDimensions";

interface VehicleSelectorProps {
  vehicleMake: string;
  setVehicleMake: (make: string) => void;
  vehicleModel: string;
  setVehicleModel: (model: string) => void;
  vehicleYear: number;
  setVehicleYear: (year: number) => void;
  vehicleType?: string;
  setVehicleType?: (type: string) => void;
}

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
  const { makes, models, years, loading, fetchModels, fetchYears } = useVehicleDimensions();

  // Fetch models when make changes
  useEffect(() => {
    if (vehicleMake) {
      fetchModels(vehicleMake);
      setVehicleModel("");
    }
  }, [vehicleMake, fetchModels, setVehicleModel]);

  // Fetch years when model changes
  useEffect(() => {
    if (vehicleMake && vehicleModel) {
      fetchYears(vehicleMake, vehicleModel);
    }
  }, [vehicleMake, vehicleModel, fetchYears]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Make</Label>
          <Select value={vehicleMake} onValueChange={setVehicleMake} disabled={loading}>
            <SelectTrigger className="bg-surface border-border">
              <SelectValue placeholder="Select make" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border max-h-60">
              {makes.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Select 
            value={vehicleModel} 
            onValueChange={setVehicleModel} 
            disabled={!vehicleMake || loading}
          >
            <SelectTrigger className="bg-surface border-border">
              <SelectValue placeholder={vehicleMake ? "Select model" : "Select make first"} />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border max-h-60">
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Year</Label>
          <Select 
            value={vehicleYear ? vehicleYear.toString() : ""} 
            onValueChange={(val) => setVehicleYear(parseInt(val))}
            disabled={!vehicleModel || loading}
          >
            <SelectTrigger className="bg-surface border-border">
              <SelectValue placeholder={vehicleModel ? "Select year" : "Select model first"} />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border max-h-60">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {setVehicleType && (
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={vehicleType || ""} onValueChange={setVehicleType}>
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
        )}
      </div>
    </div>
  );
};
