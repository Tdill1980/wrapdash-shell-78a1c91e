import { Badge } from "@/components/ui/badge";

interface ProductionSpecsBarProps {
  manufacturer?: string;
  colorName?: string;
  colorCode?: string;
  finishType?: string;
  colorHex?: string;
  totalSqFt?: number;
  wrapScope?: string;
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
    <div className="bg-[#1a1a24] border border-white/10 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Manufacturer */}
        {manufacturer && (
          <div className="min-w-[80px]">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Manufacturer</p>
            <p className="text-sm font-semibold text-white">{manufacturer}</p>
          </div>
        )}

        {/* Color Name */}
        {colorName && (
          <div className="min-w-[120px]">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Color</p>
            <p className="text-sm font-semibold text-white">{colorName}</p>
          </div>
        )}

        {/* Color Code */}
        {colorCode && (
          <div className="min-w-[80px]">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Code</p>
            <p className="text-sm font-semibold text-white">{colorCode}</p>
          </div>
        )}

        {/* Finish Type */}
        {finishType && (
          <div className="min-w-[60px]">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Finish</p>
            <p className="text-sm font-semibold text-white capitalize">{finishType}</p>
          </div>
        )}

        {/* Total Sq Ft */}
        {totalSqFt && (
          <div className="min-w-[80px]">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Coverage</p>
            <p className="text-sm font-semibold text-white">{totalSqFt} sq ft</p>
          </div>
        )}

        {/* Wrap Scope */}
        {wrapScope && (
          <div className="min-w-[100px]">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Scope</p>
            <Badge variant="outline" className="text-xs font-medium bg-primary/10 border-primary/30 text-primary">
              {wrapScope}
            </Badge>
          </div>
        )}

        {/* Color Swatch */}
        {colorHex && (
          <div className="ml-auto flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-lg border border-white/20 shadow-lg"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-xs font-mono text-white/70 uppercase">{colorHex}</span>
          </div>
        )}
      </div>
    </div>
  );
}
