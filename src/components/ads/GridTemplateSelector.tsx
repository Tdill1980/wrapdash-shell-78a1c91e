import React from "react";
import { cn } from "@/lib/utils";
import { 
  GRID_TEMPLATES, 
  getGridTemplatesByBrand, 
  GridTemplate, 
  GridSize 
} from "@/lib/template-os/grid-templates";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Grid2X2, Search, Layers } from "lucide-react";

interface GridTemplateSelectorProps {
  selected: string | null;
  onSelect: (templateId: string) => void;
  brand: "wpw" | "restylepro" | "both";
  onBrandChange: (brand: "wpw" | "restylepro" | "both") => void;
  gridSize: GridSize;
  onGridSizeChange: (size: GridSize) => void;
}

export function GridTemplateSelector({
  selected,
  onSelect,
  brand,
  onBrandChange,
  gridSize,
  onGridSizeChange,
}: GridTemplateSelectorProps) {
  const templates = getGridTemplatesByBrand(brand, gridSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Brand Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Brand:</span>
          <div className="flex gap-1">
            {(["both", "wpw", "restylepro"] as const).map((b) => (
              <button
                key={b}
                onClick={() => onBrandChange(b)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  brand === b
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {b === "both" ? "All" : b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Size Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Size:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onGridSizeChange("3x3")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all",
                gridSize === "3x3"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Grid3X3 className="w-3 h-3" />
              3×3
            </button>
            <button
              onClick={() => onGridSizeChange("4x4")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all",
                gridSize === "4x4"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Grid2X2 className="w-3 h-3" />
              4×4
            </button>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selected === template.id}
            onSelect={() => onSelect(template.id)}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No templates found for this filter</p>
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: GridTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const gridCols = template.gridSize === "3x3" ? 3 : 4;
  const cellCount = template.imageSlots;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative p-3 rounded-xl border-2 transition-all text-left",
        "hover:border-primary/50 hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-muted bg-card"
      )}
    >
      {/* Mini Grid Preview */}
      <div 
        className={cn(
          "aspect-square rounded-lg overflow-hidden mb-2",
          template.brand === "wpw" ? "bg-black" : "bg-slate-900"
        )}
      >
        {/* Search Bar Preview */}
        <div className="h-[12%] mx-1 mt-1 bg-white/10 rounded-full flex items-center px-2 gap-1">
          <Search className="w-2 h-2 text-white/50" />
          <div className="h-1 bg-white/30 rounded flex-1" />
        </div>
        
        {/* Grid Preview */}
        <div 
          className="p-1 gap-0.5"
          style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          }}
        >
          {Array.from({ length: cellCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-sm",
                template.brand === "wpw" 
                  ? "bg-blue-500/30" 
                  : "bg-purple-500/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Template Info */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm leading-tight truncate">
          {template.name.replace("WPW ", "").replace("RestylePro ", "")}
        </h4>
        <div className="flex items-center gap-1">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0",
              template.brand === "wpw" 
                ? "border-blue-500/50 text-blue-500" 
                : "border-purple-500/50 text-purple-500"
            )}
          >
            {template.brand.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {template.gridSize}
          </Badge>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
