import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Palette } from "lucide-react";
import { FADEWRAPS_PRICING } from "@/lib/wpwProducts";

interface FadeWrapConfiguratorProps {
  onAddToCart: (config: {
    productId: number;
    size: string;
    color: string;
    addOns: string[];
    total: number;
  }) => void;
  isLoading?: boolean;
}

type SizeKey = keyof typeof FADEWRAPS_PRICING.sizes;
type AddOnKey = keyof typeof FADEWRAPS_PRICING.addOns;

export function FadeWrapConfigurator({
  onAddToCart,
  isLoading = false
}: FadeWrapConfiguratorProps) {
  const [selectedSize, setSelectedSize] = useState<SizeKey>("medium");
  const [selectedColor, setSelectedColor] = useState<string>("Blue");
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnKey[]>([]);

  // Calculate total
  const basePrice = FADEWRAPS_PRICING.sizes[selectedSize].price;
  const addOnsTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + FADEWRAPS_PRICING.addOns[addOn].price,
    0
  );
  const total = basePrice + addOnsTotal;

  const toggleAddOn = (addOn: AddOnKey) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOn)
        ? prev.filter((a) => a !== addOn)
        : [...prev, addOn]
    );
  };

  const handleAddToCart = () => {
    onAddToCart({
      productId: FADEWRAPS_PRICING.productId,
      size: selectedSize,
      color: selectedColor,
      addOns: selectedAddOns,
      total
    });
  };

  const sizeLabels: Record<SizeKey, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    xl: "XL"
  };

  const addOnLabels: Record<AddOnKey, string> = {
    hood: "Hood",
    frontBumper: "Front Bumper",
    rearWithBumper: "Rear + Bumper",
    roofSmall: "Roof (Small)",
    roofMedium: "Roof (Medium)",
    roofLarge: "Roof (Large)"
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Custom Fade Wrap</h3>
        <Badge variant="secondary" className="ml-auto">
          Starting at $600
        </Badge>
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Color</Label>
        <div className="flex flex-wrap gap-2">
          {FADEWRAPS_PRICING.colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`px-3 py-1.5 text-sm rounded-full border-2 transition-all ${
                selectedColor === color
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Size</Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(FADEWRAPS_PRICING.sizes) as SizeKey[]).map((size) => {
            const sizeData = FADEWRAPS_PRICING.sizes[size];
            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedSize === size
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-semibold">{sizeLabels[size]}</div>
                <div className="text-xs text-muted-foreground">
                  {sizeData.dimensions}"
                </div>
                <div className="text-lg font-bold text-primary mt-1">
                  ${sizeData.price}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add-Ons */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Add-Ons (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(FADEWRAPS_PRICING.addOns) as AddOnKey[]).map((addOn) => {
            const addOnData = FADEWRAPS_PRICING.addOns[addOn];
            const isSelected = selectedAddOns.includes(addOn);
            return (
              <button
                key={addOn}
                type="button"
                onClick={() => toggleAddOn(addOn)}
                className={`p-3 rounded-lg border-2 transition-all text-left flex items-start gap-2 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox checked={isSelected} className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{addOnLabels[addOn]}</div>
                  <div className="text-xs text-muted-foreground">
                    {addOnData.dimensions}"
                  </div>
                  <div className="text-sm font-bold text-primary">
                    +${addOnData.price}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Summary */}
      <div className="p-4 bg-primary/5 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Base ({sizeLabels[selectedSize]}):</span>
          <span className="font-medium">${basePrice}</span>
        </div>
        {selectedAddOns.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Add-Ons:</span>
            <span className="font-medium">+${addOnsTotal}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Color:</span>
          <span className="font-medium">{selectedColor}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-semibold">Total:</span>
          <span className="text-2xl font-bold text-primary">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={isLoading}
        className="w-full gap-2"
        size="lg"
      >
        <ShoppingCart className="h-4 w-4" />
        {isLoading ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}
