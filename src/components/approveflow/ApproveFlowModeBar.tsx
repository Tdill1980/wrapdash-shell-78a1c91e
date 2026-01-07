// ============================================
// ApproveFlow OS — Mode Bar (Zone 1)
// ============================================
// OS RULES:
// 1. Always visible at top of Designer page
// 2. Shows "DESIGNER MODE" badge - never hidden
// 3. Hardwired layout - not dynamic
// 4. Route identity, not role-based
// ============================================

import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";

interface ApproveFlowModeBarProps {
  orderNumber: string;
  productType: string;
  customerName: string;
  customerEmail?: string;
  status: string;
}

export function ApproveFlowModeBar({
  orderNumber,
  productType,
  customerName,
  customerEmail,
  status,
}: ApproveFlowModeBarProps) {
  // Format status for display
  const formatStatus = (s: string) => {
    return s
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {/* Left: Mode Badge + Context */}
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500 font-bold text-xs px-3 py-1">
            <Wrench className="w-3 h-3 mr-1.5" />
            DESIGNER MODE
          </Badge>
          <div className="hidden sm:block h-4 w-px bg-amber-500/30" />
          <span className="text-xs text-amber-200/80">
            Order #{orderNumber}
          </span>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Status:</span>
          <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
            ● {formatStatus(status)}
          </Badge>
        </div>
      </div>

      {/* Second row: Customer + Product details */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{productType}</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-foreground font-medium">{customerName}</span>
        {customerEmail && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="text-muted-foreground">{customerEmail}</span>
          </>
        )}
      </div>
    </div>
  );
}
