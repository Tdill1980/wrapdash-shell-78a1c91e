import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ProofHeaderProps {
  orderNumber: string;
  vehicleYear?: string | number;
  vehicleMake?: string;
  vehicleModel?: string;
  versionNumber: number;
  status: string;
}

export function ProofHeader({
  orderNumber,
  vehicleYear,
  vehicleMake,
  vehicleModel,
  versionNumber,
  status,
}: ProofHeaderProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      awaiting_feedback: {
        label: "Proof Ready",
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      },
      proof_delivered: {
        label: "Proof Ready",
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      },
      revision_requested: {
        label: "Revision Requested",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      },
      approved: {
        label: "Approved",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      design_requested: {
        label: "Design In Progress",
        icon: <Clock className="w-3.5 h-3.5" />,
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
    };
    return configs[status] || configs.design_requested;
  };

  const statusConfig = getStatusConfig(status);
  const vehicleString = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ");

  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/wrapcommand-logo.png"
              alt="WrapCommand AI"
              className="h-8 sm:h-10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              Design Proof
            </span>
          </div>

          {/* Order Details */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm">
            <span className="font-semibold text-foreground">
              Order #{orderNumber}
            </span>
            
            {vehicleString && (
              <>
                <span className="text-muted-foreground hidden sm:inline">│</span>
                <span className="text-muted-foreground">{vehicleString}</span>
              </>
            )}
            
            <span className="text-muted-foreground hidden sm:inline">│</span>
            <span className="text-muted-foreground">v{versionNumber}</span>
            
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1.5 ${statusConfig.className}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
