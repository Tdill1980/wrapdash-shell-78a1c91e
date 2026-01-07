// ============================================
// MyApproveFlow Specs - Read Only Display
// ============================================
// Customers can view but NEVER edit production specs

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, Layers } from "lucide-react";

interface ProductionSpec {
  id: string;
  body_length: string | null;
  body_length_is_na: boolean;
  wheelbase: string | null;
  wheelbase_is_na: boolean;
  roof_height: string | null;
  roof_height_is_na: boolean;
  panel_count: number | null;
  panel_count_is_na: boolean;
  scale_reference: string | null;
  scale_reference_is_na: boolean;
}

interface MyApproveFlowSpecsProps {
  wrapScope: string | null;
  totalSqFt: number | null;
  specs: ProductionSpec | null;
}

export function MyApproveFlowSpecs({ wrapScope, totalSqFt, specs }: MyApproveFlowSpecsProps) {
  const formatScope = (scope: string | null) => {
    if (!scope) return "Not specified";
    return scope.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const specItems = specs ? [
    { label: "Body Length", value: specs.body_length, isNa: specs.body_length_is_na },
    { label: "Wheelbase", value: specs.wheelbase, isNa: specs.wheelbase_is_na },
    { label: "Roof Height", value: specs.roof_height, isNa: specs.roof_height_is_na },
    { label: "Panel Count", value: specs.panel_count?.toString(), isNa: specs.panel_count_is_na },
    { label: "Scale Reference", value: specs.scale_reference, isNa: specs.scale_reference_is_na },
  ].filter(item => !item.isNa && item.value) : [];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Production Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Wrap Scope */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Wrap Scope
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatScope(wrapScope)}
            </p>
          </div>

          {/* Total Square Footage */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              Total Coverage
            </p>
            <p className="text-lg font-semibold text-foreground">
              {totalSqFt ? `${totalSqFt} sq ft` : "—"}
            </p>
          </div>

          {/* Additional Specs */}
          {specItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {item.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
