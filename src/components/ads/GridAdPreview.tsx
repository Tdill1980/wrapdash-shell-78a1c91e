import React from "react";
import { cn } from "@/lib/utils";
import { GridTemplate, getGridTemplateById } from "@/lib/template-os/grid-templates";
import { Search } from "lucide-react";

interface GridAdPreviewProps {
  templateId: string | null;
  searchBarText: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  images: (string | null)[];
  aspectRatio?: "1:1" | "4:5" | "9:16";
}

export function GridAdPreview({
  templateId,
  searchBarText,
  headline,
  subheadline,
  cta,
  images,
  aspectRatio = "1:1",
}: GridAdPreviewProps) {
  const template = templateId ? getGridTemplateById(templateId) : null;
  const gridCols = template?.gridSize === "4x4" ? 4 : 3;
  const cellCount = template?.imageSlots || 9;
  const brand = template?.brand || "wpw";

  // Brand colors
  const colors = brand === "wpw"
    ? { bg: "#000000", searchBg: "#1A1A1A", primary: "#0033FF", accent: "#E81C2E" }
    : { bg: "#0F0F23", searchBg: "#1E1E3F", primary: "#6366F1", accent: "#22D3EE" };

  // Aspect ratio styles
  const aspectStyles = {
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
  };

  return (
    <div className="space-y-2">
      {/* Preview Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Preview</span>
        <span className="text-xs text-muted-foreground">
          {template?.name || "Select a template"}
        </span>
      </div>

      {/* Preview Frame */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden shadow-lg mx-auto",
          aspectStyles[aspectRatio]
        )}
        style={{ 
          backgroundColor: colors.bg,
          maxWidth: aspectRatio === "9:16" ? "280px" : "400px",
        }}
      >
        {/* Search Bar */}
        <div className="px-3 pt-3">
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ backgroundColor: colors.searchBg }}
          >
            <Search className="w-4 h-4 text-white/50" />
            <span 
              className="text-white/90 text-sm font-medium tracking-wide"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {searchBarText || template?.searchBarText || "SEARCH"}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="p-3">
          <div
            className="gap-1.5"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            }}
          >
            {Array.from({ length: cellCount }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md overflow-hidden"
                style={{ backgroundColor: colors.searchBg }}
              >
                {images[i] ? (
                  <img
                    src={images[i]!}
                    alt={`Cell ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}20)` 
                    }}
                  >
                    <span className="text-white/30 text-xs">{i + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Text Overlay Area */}
        <div className="px-3 pb-3 space-y-2">
          {/* Headline */}
          {(headline || template?.overlayText.headline) && (
            <p 
              className="text-white text-center font-bold text-sm"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {headline || template?.overlayText.headline}
            </p>
          )}

          {/* Subheadline */}
          {(subheadline || template?.overlayText.subheadline) && (
            <p className="text-white/70 text-center text-xs">
              {subheadline || template?.overlayText.subheadline}
            </p>
          )}

          {/* CTA */}
          {(cta || template?.overlayText.cta) && (
            <div 
              className="mx-auto px-4 py-1.5 rounded-full text-center"
              style={{ backgroundColor: colors.primary }}
            >
              <span 
                className="text-white text-xs font-medium"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {cta || template?.overlayText.cta}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Template info */}
      {template && (
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            {template.gridSize} Grid • {template.imageSlots} images
          </p>
          <p className="text-xs text-muted-foreground/70">
            {template.useCase}
          </p>
        </div>
      )}
    </div>
  );
}
