import { Badge } from "@/components/ui/badge";

/**
 * ApproveFlow OS Rule:
 * Production specs are READ-ONLY on customer page.
 * Designers enter these values on the internal ApproveFlow page.
 */

interface ProductionSpecsBarProps {
  manufacturer?: string;
  colorName?: string;
  colorCode?: string;
  finishType?: string;
  colorHex?: string;
  totalSqFt?: number | null;
  wrapScope?: string | null;
}

export function ProductionSpecsBar({
  manufacturer,
  colorName,
  colorCode,
  finishType,
  colorHex,
  totalSqFt,
  wrapScope,
}: ProductionSpecsBarProps) {
  const hasColorInfo = manufacturer || colorName || colorCode || finishType || colorHex;
  const hasProductionInfo = totalSqFt || wrapScope;
  
  if (!hasColorInfo && !hasProductionInfo) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Manufacturer */}
        {manufacturer && (
          <div className="min-w-[80px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Manufacturer</p>
            <p className="text-sm font-semibold text-foreground">{manufacturer}</p>
          </div>
        )}

        {/* Color Name */}
        {colorName && (
          <div className="min-w-[120px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Color</p>
            <p className="text-sm font-semibold text-foreground">{colorName}</p>
          </div>
        )}

        {/* Color Code */}
        {colorCode && (
          <div className="min-w-[80px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Code</p>
            <p className="text-sm font-semibold text-foreground">{colorCode}</p>
          </div>
        )}

        {/* Finish Type */}
        {finishType && (
          <div className="min-w-[60px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Finish</p>
            <p className="text-sm font-semibold text-foreground capitalize">{finishType}</p>
          </div>
        )}

        {/* Total Sq Ft */}
        {totalSqFt && (
          <div className="min-w-[80px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Coverage</p>
            <p className="text-sm font-semibold text-foreground">{totalSqFt} sq ft</p>
          </div>
        )}

        {/* Wrap Scope */}
        {wrapScope && (
          <div className="min-w-[100px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Scope</p>
            <Badge variant="outline" className="text-xs font-medium">
              {wrapScope}
            </Badge>
          </div>
        )}

        {/* Color Swatch */}
        {colorHex && (
          <div className="ml-auto flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-lg border border-border shadow-lg"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-xs font-mono text-muted-foreground uppercase">{colorHex}</span>
          </div>
        )}
      </div>
    </div>
  );
}
