import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Building2, Upload } from "lucide-react";
import { WALL_WRAP_PRICING } from "@/lib/wpwProducts";

interface WallWrapConfiguratorProps {
  onQuote: (config: {
    sqft: number;
    finish: string;
    quantity: number;
    total: number;
  }) => void;
  onUploadArtwork?: () => void;
  isLoading?: boolean;
}

export function WallWrapConfigurator({
  onQuote,
  onUploadArtwork,
  isLoading = false
}: WallWrapConfiguratorProps) {
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [finish, setFinish] = useState<string>("Matte");

  // Calculate sqft and total
  const sqft = height > 0 && width > 0 ? Math.round((height * width) / 144 * 10) / 10 : 0;
  const total = sqft * WALL_WRAP_PRICING.pricePerSqft * quantity;

  const handleQuote = () => {
    if (sqft <= 0) return;
    
    onQuote({
      sqft,
      finish,
      quantity,
      total
    });
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Wall Wrap Printed Vinyl</h3>
        <Badge variant="secondary" className="ml-auto">
          ${WALL_WRAP_PRICING.pricePerSqft}/sq ft
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Custom printed wall graphics using {WALL_WRAP_PRICING.material}. 
        Perfect for offices, retail spaces, gyms, and more.
      </p>

      {/* Dimension Inputs */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Enter Wall Dimensions (inches)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Height</Label>
            <Input
              type="number"
              value={height || ""}
              onChange={(e) => setHeight(Number(e.target.value))}
              placeholder="Height (in)"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Width</Label>
            <Input
              type="number"
              value={width || ""}
              onChange={(e) => setWidth(Number(e.target.value))}
              placeholder="Width (in)"
            />
          </div>
        </div>

        {sqft > 0 && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Calculated Area:</p>
            <p className="text-2xl font-bold text-primary">
              {sqft} sq. ft.
            </p>
            <p className="text-xs text-muted-foreground">
              ({height}" × {width}") ÷ 144
            </p>
          </div>
        )}
      </div>

      {/* Finish Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Finish</Label>
        <Select value={finish} onValueChange={setFinish}>
          <SelectTrigger>
            <SelectValue placeholder="Select finish" />
          </SelectTrigger>
          <SelectContent>
            {WALL_WRAP_PRICING.finishes.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quantity */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Quantity</Label>
        <Select value={String(quantity)} onValueChange={(v) => setQuantity(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 10].map((q) => (
              <SelectItem key={q} value={String(q)}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Summary */}
      {sqft > 0 && (
        <div className="p-4 bg-primary/5 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Area:</span>
            <span className="font-medium">{sqft} sq. ft.</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Finish:</span>
            <span className="font-medium">{finish}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rate:</span>
            <span className="font-medium">${WALL_WRAP_PRICING.pricePerSqft}/sq ft</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onUploadArtwork && (
          <Button
            variant="outline"
            onClick={onUploadArtwork}
            className="flex-1 gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Artwork
          </Button>
        )}
        <Button
          onClick={handleQuote}
          disabled={sqft <= 0 || isLoading}
          className="flex-1 gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          {isLoading ? "Processing..." : "Add to Quote"}
        </Button>
      </div>
    </div>
  );
}
