import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchVehicles } from "../api";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  body_type: string;
  category: string;
}

interface VehicleSelectorProps {
  onSelect: (vehicleId: string | null) => void;
}

export function VehicleSelector({ onSelect }: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);

  const [filteredModels, setFilteredModels] = useState<Vehicle[]>([]);
  const [filteredYears, setFilteredYears] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetchVehicles()
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (make) {
      const models = vehicles.filter(v => v.make === make);
      setFilteredModels(models);
      setModel("");
      setYear("");
      onSelect(null);
    } else {
      setFilteredModels([]);
      setModel("");
      setYear("");
      onSelect(null);
    }
  }, [make, vehicles, onSelect]);

  useEffect(() => {
    if (model) {
      const years = filteredModels.filter(v => v.model === model);
      setFilteredYears(years);
      setYear("");
      onSelect(null);
    } else {
      setFilteredYears([]);
      setYear("");
      onSelect(null);
    }
  }, [model, filteredModels, onSelect]);

  useEffect(() => {
    if (year) {
      const selected = filteredYears.find(v => v.year === year);
      onSelect(selected?.id || null);
    } else {
      onSelect(null);
    }
  }, [year, filteredYears, onSelect]);

  const uniqueMakes = [...new Set(vehicles.map(v => v.make))].sort();
  const uniqueModels = [...new Set(filteredModels.map(v => v.model))].sort();
  const uniqueYears = [...new Set(filteredYears.map(v => v.year))].sort();

  const selectedVehicle = filteredYears.find(v => v.year === year);

  if (loading) {
    return (
      <div className="bg-[#101011] p-4 rounded-xl">
        <p className="text-sm text-gray-400">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#101011] p-4 rounded-xl space-y-3">
      <h2 className="text-lg font-semibold">Vehicle Selection</h2>

      {/* Make */}
      <div>
        <Label htmlFor="make" className="text-sm text-gray-400">Make</Label>
        <Select value={make} onValueChange={setMake}>
          <SelectTrigger id="make" className="mt-1 bg-black border-gray-700">
            <SelectValue placeholder="Select Make" />
          </SelectTrigger>
          <SelectContent>
            {uniqueMakes.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      {make && (
        <div>
          <Label htmlFor="model" className="text-sm text-gray-400">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model" className="mt-1 bg-black border-gray-700">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {uniqueModels.map(md => (
                <SelectItem key={md} value={md}>{md}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year */}
      {model && (
        <div>
          <Label htmlFor="year" className="text-sm text-gray-400">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="year" className="mt-1 bg-black border-gray-700">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {uniqueYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Selected Vehicle Info */}
      {selectedVehicle && (
        <div className="mt-3 p-3 bg-black/40 rounded-lg border border-[#22d3ee]/20">
          <p className="text-xs text-[#22d3ee] font-medium">
            Selected Vehicle
          </p>
          <p className="text-sm text-white mt-1">
            {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
          </p>
          {selectedVehicle.body_type && (
            <p className="text-xs text-gray-400 mt-1">
              {selectedVehicle.body_type}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
