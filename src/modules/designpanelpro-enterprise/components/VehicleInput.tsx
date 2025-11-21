import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectVehicleSize } from "../generator-api";

interface VehicleInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function VehicleInput({ value, onChange }: VehicleInputProps) {
  const detectedSize = value ? detectVehicleSize(value) : null;

  const sizeLabels = {
    small: 'Small (144")',
    medium: 'Medium (172")',
    large: 'Large (200")',
    xl: 'XL (240")'
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="vehicle">Step 2: Enter Any Vehicle</Label>
          <Input
            id="vehicle"
            placeholder="e.g. 2020 Toyota Supra, Ford F-150, Mercedes Sprinter"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2"
          />
        </div>
        
        {detectedSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-detected size:</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {sizeLabels[detectedSize]}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
