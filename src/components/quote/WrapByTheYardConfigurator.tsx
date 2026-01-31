import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";
import { WBTY_PRICING } from "@/lib/wpwProducts";

interface WrapByTheYardConfiguratorProps {
  collectionId: number;
  onAddToCart: (config: {
    productId: number;
    variationId?: number;
    yards: number;
    pattern: string;
    total: number;
  }) => void;
  isLoading?: boolean;
}

// Swatch data for each collection
const COLLECTION_SWATCHES: Record<number, string[]> = {
  1726: [ // Camo & Carbon
    "Sand Camo", "Black Camo", "Digital Gray", "Red Camo", "Hex Camo",
    "Desert Camo", "Woodland", "Snow Camo", "Urban Digital", "Tiger Stripe",
    "Black Carbon", "Silver Carbon", "Red Carbon", "Blue Carbon", "Green Carbon",
    "Gold Carbon", "Purple Carbon", "Orange Carbon", "White Carbon", "Forged Carbon",
    "3D Carbon Black", "3D Carbon Gray", "Honeycomb Carbon", "Racing Carbon", "Weave Carbon", "Matte Carbon"
  ],
  39698: [ // Metal & Marble
    "Gray Marble", "White Marble", "Black Marble", "Gold Veined", "Rose Marble",
    "Brushed Aluminum", "Brushed Steel", "Gold Foil", "Rose Gold", "Copper",
    "Diamond Plate", "Titanium", "Bronze", "Chrome", "Gunmetal",
    "Hammered Metal", "Oxidized Copper", "Silver Leaf", "Antique Gold", "Pewter"
  ],
  4181: [ // Wicked & Wild
    "Nebula Galaxy", "Starry Night", "Matrix Green", "Psychedelic", "Aurora",
    "Oil Slick", "Holographic", "Lightning", "Fire Flames", "Ice Crystal",
    "Alien Skin", "Snake Skin", "Dragon Scale", "Tiger Print", "Leopard Print",
    "Zebra Print", "Crocodile", "Elephant Skin", "Peacock", "Butterfly Wings",
    "Coral Reef", "Deep Ocean", "Lava Flow", "Storm Cloud", "Northern Lights",
    "Prism", "Vaporwave", "Glitch", "Cosmic", "Tribal"
  ],
  42809: [ // Bape Camo
    "Classic Green", "Pink Camo", "Blue Camo", "Purple Camo",
    "Orange Camo", "Red Camo", "Black Camo", "White Camo"
  ],
  52489: [ // Modern & Trippy
    "Geometric", "Abstract Wave", "Optical Illusion", "Retro Pattern",
    "Memphis Style", "Art Deco", "Minimalist", "Surreal", "Kaleidoscope"
  ]
};

const COLLECTION_NAMES: Record<number, string> = {
  1726: "Camo & Carbon",
  39698: "Metal & Marble",
  4181: "Wicked & Wild",
  42809: "Bape Camo",
  52489: "Modern & Trippy"
};

export function WrapByTheYardConfigurator({
  collectionId,
  onAddToCart,
  isLoading = false
}: WrapByTheYardConfiguratorProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedYards, setSelectedYards] = useState<number>(1);

  const swatches = COLLECTION_SWATCHES[collectionId] || [];
  const collectionName = COLLECTION_NAMES[collectionId] || "Wrap By The Yard";
  const total = selectedYards * WBTY_PRICING.pricePerYard;

  const handleAddToCart = () => {
    if (!selectedPattern) return;
    
    onAddToCart({
      productId: collectionId,
      yards: selectedYards,
      pattern: selectedPattern,
      total
    });
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{collectionName}</h3>
        <Badge variant="secondary" className="ml-auto">
          ${WBTY_PRICING.pricePerYard}/yard
        </Badge>
      </div>

      {/* Pattern Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Pattern</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
          {swatches.map((pattern) => (
            <button
              key={pattern}
              type="button"
              onClick={() => setSelectedPattern(pattern)}
              className={`p-2 text-xs rounded-lg border-2 transition-all text-center ${
                selectedPattern === pattern
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {pattern}
            </button>
          ))}
        </div>
      </div>

      {/* Yard Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Quantity (yards)</Label>
        <div className="flex gap-2 flex-wrap">
          {WBTY_PRICING.yardOptions.map((yards) => (
            <button
              key={yards}
              type="button"
              onClick={() => setSelectedYards(yards)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedYards === yards
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="font-semibold">{yards}</span>
              <span className="text-xs text-muted-foreground ml-1">
                {yards === 1 ? "yard" : "yards"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="p-4 bg-primary/5 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Pattern:</span>
          <span className="font-medium">{selectedPattern || "—"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Quantity:</span>
          <span className="font-medium">{selectedYards} yards</span>
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
        disabled={!selectedPattern || isLoading}
        className="w-full gap-2"
        size="lg"
      >
        <ShoppingCart className="h-4 w-4" />
        {isLoading ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}
