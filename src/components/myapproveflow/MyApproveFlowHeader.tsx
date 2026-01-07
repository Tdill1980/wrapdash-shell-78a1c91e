// ============================================
// MyApproveFlow Header - Read Only Status Display
// ============================================

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, RefreshCw } from "lucide-react";

interface MyApproveFlowHeaderProps {
  orderNumber: string;
  status: string;
  vehicleTitle: string;
  toolName: string;
  systemName: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  ready: { label: "Ready for Review", variant: "default", icon: <Clock className="h-3 w-3" /> },
  sent: { label: "Proof Sent", variant: "default", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", variant: "secondary", icon: <CheckCircle className="h-3 w-3" /> },
  revision_requested: { label: "Revisions Requested", variant: "outline", icon: <RefreshCw className="h-3 w-3" /> },
};

export function MyApproveFlowHeader({
  orderNumber,
  status,
  vehicleTitle,
  toolName,
  systemName
}: MyApproveFlowHeaderProps) {
  const statusInfo = statusConfig[status] || statusConfig.ready;

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Branding & Order */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {systemName}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {toolName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Design Proof
            </h1>
            <p className="text-muted-foreground mt-1">
              Order #{orderNumber} — {vehicleTitle}
            </p>
          </div>

          {/* Right: Status Badge */}
          <div className="flex items-center gap-3">
            <Badge variant={statusInfo.variant} className="flex items-center gap-1.5 px-3 py-1.5">
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
