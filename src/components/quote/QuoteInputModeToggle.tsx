import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Ruler, Car } from "lucide-react";
import { VehicleSelectorV2 } from "@/components/VehicleSelectorV2";
import { VehicleSQFTOptions } from "@/hooks/useVehicleDimensions";

export type InputMode = "total" | "dimensions" | "vehicle";

interface QuoteInputModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  sqft: number;
  onSqftChange: (sqft: number) => void;
  vehicle: {
    year: string;
    make: string;
    model: string;
  };
  onVehicleChange: (vehicle: { year: string; make: string; model: string }) => void;
  onSQFTOptionsChange: (options: VehicleSQFTOptions | null) => void;
}

export function QuoteInputModeToggle({
  mode,
  onModeChange,
  sqft,
  onSqftChange,
  vehicle,
  onVehicleChange,
  onSQFTOptionsChange,
}: QuoteInputModeToggleProps) {
  // Dimension calculator state
  const [dimHeight, setDimHeight] = useState(0);
  const [dimWidth, setDimWidth] = useState(0);

  // Calculate sqft from dimensions
  const handleDimensionChange = (height: number, width: number) => {
    setDimHeight(height);
    setDimWidth(width);
    if (height > 0 && width > 0) {
      const calculatedSqft = Math.round((height * width) / 144 * 10) / 10;
      onSqftChange(calculatedSqft);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "total" ? "default" : "outline"}
          onClick={() => onModeChange("total")}
          className="flex-1 gap-2"
        >
          <Calculator className="h-4 w-4" />
          Total Sq. Ft.
        </Button>
        <Button
          type="button"
          variant={mode === "dimensions" ? "default" : "outline"}
          onClick={() => onModeChange("dimensions")}
          className="flex-1 gap-2"
        >
          <Ruler className="h-4 w-4" />
          Dimensions
        </Button>
        <Button
          type="button"
          variant={mode === "vehicle" ? "default" : "outline"}
          onClick={() => onModeChange("vehicle")}
          className="flex-1 gap-2"
        >
          <Car className="h-4 w-4" />
          Vehicle
        </Button>
      </div>

      {/* Mode-specific inputs */}
      {mode === "total" && (
        <div className="space-y-2">
          <Label>Enter Total Square Footage</Label>
          <Input
            type="number"
            value={sqft || ""}
            onChange={(e) => onSqftChange(Number(e.target.value))}
            placeholder="Enter sq. ft."
            className="text-lg"
          />
        </div>
      )}

      {mode === "dimensions" && (
        <div className="space-y-4">
          <Label>Enter Dimensions (inches)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={dimHeight || ""}
                onChange={(e) => handleDimensionChange(Number(e.target.value), dimWidth)}
                placeholder="Height (in)"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={dimWidth || ""}
                onChange={(e) => handleDimensionChange(dimHeight, Number(e.target.value))}
                placeholder="Width (in)"
              />
            </div>
          </div>
          {dimHeight > 0 && dimWidth > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Calculated Area:</p>
              <p className="text-2xl font-bold text-primary">
                {Math.round((dimHeight * dimWidth) / 144 * 10) / 10} sq. ft.
              </p>
              <p className="text-xs text-muted-foreground">
                ({dimHeight}" × {dimWidth}") ÷ 144
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "vehicle" && (
        <VehicleSelectorV2
          value={vehicle}
          onChange={onVehicleChange}
          onSQFTOptionsChange={onSQFTOptionsChange}
        />
      )}
    </div>
  );
}
