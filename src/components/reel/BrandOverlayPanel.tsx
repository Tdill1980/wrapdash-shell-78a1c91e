import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BrandPackId,
  BRAND_PACKS,
  OverlayElement,
} from "@/hooks/useReelOverlays";

interface BrandOverlayPanelProps {
  overlays: OverlayElement[];
  activePack: BrandPackId | null;
  totalDuration: number;
  onApplyPack: (packId: BrandPackId) => void;
  onAddOverlay: () => void;
  onRemoveOverlay: (id: string) => void;
  onClearOverlays: () => void;
}

export function BrandOverlayPanel({
  overlays,
  activePack,
  totalDuration,
  onApplyPack,
  onAddOverlay,
  onRemoveOverlay,
  onClearOverlays,
}: BrandOverlayPanelProps) {
  const packs: BrandPackId[] = ["wpw", "pid", "restyle"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Brand Overlay Packs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Pack selector */}
        <div className="space-y-2">
          {packs.map((packId) => {
            const pack = BRAND_PACKS[packId];
            const isActive = activePack === packId;
            return (
              <button
                key={packId}
                onClick={() => onApplyPack(packId)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: pack.gradient
                        ? `linear-gradient(135deg, ${pack.gradient[0]}, ${pack.gradient[1]})`
                        : pack.color,
                    }}
                  >
                    {isActive && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pack.label}</p>
                    <p className="text-[10px] text-muted-foreground">{pack.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active overlays */}
        {overlays.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Active Overlays</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClearOverlays}>
                Clear All
              </Button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {overlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50 group"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      background: overlay.gradient
                        ? `linear-gradient(135deg, ${overlay.gradient[0]}, ${overlay.gradient[1]})`
                        : overlay.color || "#888",
                    }}
                  />
                  <span className="text-xs flex-1 truncate">{overlay.text}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {overlay.start.toFixed(1)}s
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-5 h-5 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveOverlay(overlay.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add custom overlay */}
        <Button variant="outline" size="sm" className="w-full" onClick={onAddOverlay}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Custom Overlay
        </Button>
      </CardContent>
    </Card>
  );
}
