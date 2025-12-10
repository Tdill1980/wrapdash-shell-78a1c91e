// src/components/ads/MetaAdFormatPicker.tsx

import React from "react";
import { META_PLACEMENTS, MetaPlacement, MetaPlacementFormat } from "@/lib/meta-ads";
import { cn } from "@/lib/utils";

interface MetaAdFormatPickerProps {
  selected: MetaPlacement | null;
  onSelect: (placement: MetaPlacement) => void;
}

export function MetaAdFormatPicker({ selected, onSelect }: MetaAdFormatPickerProps) {
  const placements: MetaPlacementFormat[] = Object.values(META_PLACEMENTS);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl font-semibold">Choose Ad Placement</h2>
        <p className="text-muted-foreground text-sm">
          Select the platform and placement to generate your ad.
        </p>
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {placements.map((p) => {
          const isSelected = selected === p.id;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "rounded-xl border p-4 flex flex-col items-center gap-3 transition-all group",
                isSelected
                  ? "border-primary shadow-md bg-primary/10"
                  : "border-muted hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              {/* Ratio Preview */}
              <div className="flex items-center justify-center w-full">
                <div
                  className={cn(
                    "rounded-md bg-black/70 shadow-inner relative overflow-hidden",
                    "transition-all duration-300",
                  )}
                  style={{
                    width: "80px",
                    height: `${80 * (p.height / p.width)}px`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs">
                    {p.aspectRatio}
                  </div>
                </div>
              </div>

              <div className="flex flex-col text-center">
                <span className="font-semibold">{p.label}</span>
                <span className="text-muted-foreground text-xs">
                  {p.width}×{p.height}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Scrolling Pills */}
      <div className="sm:hidden flex gap-2 overflow-x-auto pb-2">
        {placements.map((p) => {
          const isSelected = selected === p.id;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "px-4 py-2 text-sm rounded-full whitespace-nowrap border transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-muted hover:bg-muted/70"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Selected Format Summary */}
      {selected && (
        <div className="p-4 border rounded-xl bg-muted/40">
          <h3 className="font-medium mb-1">
            Selected Placement: {META_PLACEMENTS[selected].label}
          </h3>
          <p className="text-muted-foreground text-sm">
            {META_PLACEMENTS[selected].description}
          </p>

          <p className="mt-2 text-xs">
            Size: {META_PLACEMENTS[selected].width}×{META_PLACEMENTS[selected].height} • Ratio:{" "}
            {META_PLACEMENTS[selected].aspectRatio}
          </p>
        </div>
      )}
    </div>
  );
}
