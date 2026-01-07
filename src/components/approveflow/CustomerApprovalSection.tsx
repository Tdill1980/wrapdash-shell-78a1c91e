import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, MessageSquare, Loader2, Printer, Download } from "lucide-react";
import { format } from "date-fns";

interface CustomerApprovalSectionProps {
  status: string;
  approvedAt?: string | null;
  customerName?: string;
  onApprove: () => Promise<void>;
  onRequestRevision: (notes: string) => Promise<void>;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  showPrintActions?: boolean;
}

// OS-owned disclaimer - hardcoded, never AI-generated
const DISCLAIMER_TEXT = 
  "I have reviewed the design, colors, and coverage shown in this proof and approve this layout for production. " +
  "I understand the final wrap is produced using manufacturer vinyl film and may vary slightly from digital previews.";

export function CustomerApprovalSection({
  status,
  approvedAt,
  customerName: initialCustomerName,
  onApprove,
  onRequestRevision,
  onPrint,
  onDownloadPdf,
  showPrintActions = true,
}: CustomerApprovalSectionProps) {
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [approveChecked, setApproveChecked] = useState(false);
  const [revisionChecked, setRevisionChecked] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isApproved = status === "approved";

  const handleApprove = async () => {
    if (!approveChecked || !customerName.trim()) return;
    setIsSubmitting(true);
    try {
      await onApprove();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionChecked || !revisionNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await onRequestRevision(revisionNotes);
      setRevisionNotes("");
      setRevisionChecked(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isApproved) {
    return (
      <div className="bg-[#1a1a24] border border-emerald-500/30 rounded-lg p-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Design Approved</span>
        </div>
        {approvedAt && (
          <p className="text-sm text-white/60">
            Approved on {format(new Date(approvedAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        )}
        <p className="text-sm text-white/60">
          Your design is now in production. Thank you for your approval!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a24] border border-white/10 rounded-lg overflow-hidden">
      {/* Header with Print Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Customer Approval
        </h3>
        {showPrintActions && (
          <div className="flex items-center gap-2">
            {onPrint && (
              <Button
                size="sm"
                variant="outline"
                onClick={onPrint}
                className="gap-2 text-xs border-primary/50 hover:bg-primary/10"
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

      <div className="p-6 space-y-6">
        {/* Customer Name & Signature Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Customer Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Customer Signature</label>
            <div className="h-10 border-b border-white/20" />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Date</label>
            <div className="h-10 border-b border-white/20 flex items-end pb-1">
              <span className="text-sm text-white/40">{format(new Date(), "MM/dd/yyyy")}</span>
            </div>
          </div>
        </div>

        {/* Approval Options */}
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={approveChecked}
              onCheckedChange={(checked) => {
                setApproveChecked(checked === true);
                if (checked) setRevisionChecked(false);
              }}
              className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <span className="text-sm text-white">I approve this design for production</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={revisionChecked}
              onCheckedChange={(checked) => {
                setRevisionChecked(checked === true);
                if (checked) setApproveChecked(false);
              }}
              className="border-white/30 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <span className="text-sm text-white">Revisions requested</span>
          </label>
        </div>

        {/* Revision Notes */}
        {revisionChecked && (
          <div className="space-y-2">
            <label className="text-xs text-white/50">What changes would you like?</label>
            <Textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Please describe the changes you'd like to see..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
            />
          </div>
        )}

        {/* Shop Representative Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Shop Representative</label>
            <div className="h-10 border-b border-white/20" />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1.5">Date</label>
            <div className="h-10 border-b border-white/20" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {approveChecked && (
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !customerName.trim()}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Confirm Approval
            </Button>
          )}
          {revisionChecked && (
            <Button
              onClick={handleRevision}
              disabled={isSubmitting || !revisionNotes.trim()}
              variant="outline"
              className="flex-1 border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Submit Revision Request
            </Button>
          )}
        </div>
      </div>

      {/* Mandatory Disclaimer - OS-owned, never editable */}
      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10">
        <p className="text-[11px] text-white/50 italic leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
