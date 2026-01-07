import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface ProofPageHeaderProps {
  toolName?: string;
  vehicleYear?: string | number;
  vehicleMake?: string;
  vehicleModel?: string;
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  includeFullTerms?: boolean;
  onIncludeFullTermsChange?: (include: boolean) => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  showActions?: boolean;
}

export function ProofPageHeader({
  toolName = "ApproveFlow™",
  vehicleYear,
  vehicleMake,
  vehicleModel,
  customerName,
  onCustomerNameChange,
  includeFullTerms = true,
  onIncludeFullTermsChange,
  onPrint,
  onDownloadPdf,
  showActions = true,
}: ProofPageHeaderProps) {
  const vehicleString = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(" ");

  return (
    <div className="space-y-0">
      {/* Top Bar - Customer Name & Actions */}
      <div className="bg-[#0a0a0f] border-b border-white/10 px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">Customer Name:</span>
            {onCustomerNameChange ? (
              <Input
                value={customerName || ""}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Enter customer name"
                className="w-48 h-8 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
              />
            ) : (
              <span className="text-sm text-white font-medium">{customerName || "—"}</span>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {onPrint && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrint}
                  className="gap-2 text-xs border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Proof
                </Button>
              )}
              {onDownloadPdf && (
                <Button
                  size="sm"
                  onClick={onDownloadPdf}
                  className="gap-2 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Terms Toggle Bar */}
      {onIncludeFullTermsChange && (
        <div className="bg-[#1a1510] border-b border-amber-900/30 px-6 py-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={includeFullTerms}
              onCheckedChange={(checked) => onIncludeFullTermsChange(checked === true)}
              className="border-white/30"
            />
            <span className="text-sm text-white font-medium">Include Full Terms & Conditions</span>
            <span className="text-xs text-white/50">
              (Covers color accuracy, film variations, pre-existing paint conditions)
            </span>
          </label>
        </div>
      )}

      {/* Brand Header Row */}
      <div className="bg-[#0f0f14] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Tool Name */}
          <div>
            <h1 className="text-xl font-bold text-white">{toolName}</h1>
          </div>

          {/* Right: Vehicle & Subtitle */}
          <div className="text-right">
            <h2 className="text-xl font-semibold text-white">{vehicleString || "Vehicle"}</h2>
            <p className="text-sm text-primary/80">Design Approval Proof</p>
          </div>
        </div>
      </div>
    </div>
  );
}
