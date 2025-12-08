import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicleDimensions, VehicleSQFTOptions } from "@/hooks/useVehicleDimensions";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface VehicleSelectorV2Props {
  value: {
    make: string;
    model: string;
    year: string;
  };
  onChange: (v: { make: string; model: string; year: string }) => void;
  onSQFTOptionsChange?: (options: VehicleSQFTOptions | null) => void;
}

export function VehicleSelectorV2({ value, onChange, onSQFTOptionsChange }: VehicleSelectorV2Props) {
  const { makes, models, years, loading, fetchModels, fetchYears, getSQFTOptions } = useVehicleDimensions();
  const [customYear, setCustomYear] = useState(false);
  const [vehicleFound, setVehicleFound] = useState<boolean | null>(null);

  // Fetch models when make changes
  useEffect(() => {
    if (value.make) {
      fetchModels(value.make);
    }
  }, [value.make, fetchModels]);

  // Fetch years when model changes
  useEffect(() => {
    if (value.make && value.model) {
      fetchYears(value.make, value.model);
    }
  }, [value.make, value.model, fetchYears]);

  // Lookup SQFT when year is selected
  useEffect(() => {
    async function lookupSQFT() {
      if (value.make && value.model && value.year) {
        const options = await getSQFTOptions(value.make, value.model, parseInt(value.year));
        setVehicleFound(options !== null);
        onSQFTOptionsChange?.(options);
      } else {
        setVehicleFound(null);
        onSQFTOptionsChange?.(null);
      }
    }
    lookupSQFT();
  }, [value.make, value.model, value.year, getSQFTOptions, onSQFTOptionsChange]);

  const handleMakeChange = (make: string) => {
    onChange({ make, model: "", year: "" });
    setCustomYear(false);
    setVehicleFound(null);
  };

  const handleModelChange = (model: string) => {
    onChange({ ...value, model, year: "" });
    setCustomYear(false);
    setVehicleFound(null);
  };

  const handleYearChange = (year: string) => {
    if (year === "custom") {
      setCustomYear(true);
      onChange({ ...value, year: "" });
    } else {
      onChange({ ...value, year });
    }
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      {value.make && value.model && value.year && (
        <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
          vehicleFound 
            ? 'bg-green-500/10 border-green-500/50 text-green-400' 
            : vehicleFound === false
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-muted/50 border-border text-muted-foreground'
        }`}>
          {vehicleFound ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Vehicle found: {value.year} {value.make} {value.model}
            </>
          ) : vehicleFound === false ? (
            <>
              <AlertCircle className="h-4 w-4" />
              Vehicle not found in database - enter SQFT manually
            </>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Make */}
        <div className="space-y-2">
          <Label>Vehicle Make</Label>
          <Select value={value.make} onValueChange={handleMakeChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={loading ? "Loading..." : "Select Make"} />
            </SelectTrigger>
            <SelectContent className="bg-background border-border max-h-60">
              {makes.map((make) => (
                <SelectItem key={make} value={make}>{make}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label>Vehicle Model</Label>
          <Select 
            value={value.model} 
            onValueChange={handleModelChange}
            disabled={!value.make}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder={value.make ? "Select Model" : "Select Make first"} />
            </SelectTrigger>
            <SelectContent className="bg-background border-border max-h-60">
              {models.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label>Vehicle Year</Label>
          {!customYear ? (
            <Select 
              value={value.year} 
              onValueChange={handleYearChange}
              disabled={!value.model}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={value.model ? "Select Year" : "Select Model first"} />
              </SelectTrigger>
              <SelectContent className="bg-background border-border max-h-60">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
                <SelectItem value="custom">Other Year...</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter year (e.g., 2024)"
                value={value.year}
                onChange={(e) => onChange({ ...value, year: e.target.value })}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCustomYear(false)}
                className="shrink-0"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
