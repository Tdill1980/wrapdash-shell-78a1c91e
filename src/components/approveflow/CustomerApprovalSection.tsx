import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, MessageSquare, Loader2, Printer, Download } from "lucide-react";
import { format } from "date-fns";

/**
 * ApproveFlow OS Rule:
 * Customer approval section is for approve/revision actions ONLY.
 * - Customer name is entered here (required for approval)
 * - Customers NEVER edit production specs
 * - Customers NEVER generate PDFs
 */

interface CustomerApprovalSectionProps {
  status: string;
  approvedAt?: string | null;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onApprove: () => Promise<void>;
  onRequestRevision: (notes: string) => Promise<void>;
  onPrint: () => void;
  onDownloadPdf: () => void;
  hasPdf: boolean;
}

// OS-owned disclaimer - hardcoded, never AI-generated, never editable
const DISCLAIMER_TEXT = 
  "I have reviewed the design, colors, and coverage shown in this proof and approve this layout for production. " +
  "I understand the final wrap is produced using manufacturer vinyl film and may vary slightly from digital previews. " +
  "Colors may vary from printed output. Please verify all spelling, phone numbers, and business details before approval.";

export function CustomerApprovalSection({
  status,
  approvedAt,
  customerName,
  onCustomerNameChange,
  onApprove,
  onRequestRevision,
  onPrint,
  onDownloadPdf,
  hasPdf,
}: CustomerApprovalSectionProps) {
  const [approveChecked, setApproveChecked] = useState(false);
  const [revisionChecked, setRevisionChecked] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isApproved = status === "approved";
  const canApprove = status === "ready" || status === "sent";

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

  // Approved state - read-only confirmation
  if (isApproved) {
    return (
      <div className="bg-card border border-emerald-500/30 rounded-lg p-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Design Approved</span>
        </div>
        {approvedAt && (
          <p className="text-sm text-muted-foreground">
            Approved on {format(new Date(approvedAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Your design is now in production. Thank you for your approval!
        </p>
        {hasPdf && (
          <Button
            size="sm"
            onClick={onDownloadPdf}
            className="gap-2 mt-4"
          >
            <Download className="w-4 h-4" />
            Download Approved Proof
          </Button>
        )}
      </div>
    );
  }

  // Revision requested state
  if (status === "revision_requested") {
    return (
      <div className="bg-card border border-orange-500/30 rounded-lg p-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full text-orange-400">
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Revision Requested</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Our design team is reviewing your feedback. You'll receive an updated proof soon.
        </p>
      </div>
    );
  }

  // Active approval section - only shown when proof is ready
  if (!canApprove) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This proof is being prepared. Please wait for it to be ready for review.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header with Print/Download Actions */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Customer Approval
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="gap-2 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
          {hasPdf && (
            <Button
              size="sm"
              onClick={onDownloadPdf}
              className="gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Customer Name - Required for approval */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              Customer Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="Enter your name"
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Signature</label>
            <div className="h-10 border-b border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Date</label>
            <div className="h-10 border-b border-border flex items-end pb-1">
              <span className="text-sm text-muted-foreground">{format(new Date(), "MM/dd/yyyy")}</span>
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
              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <span className="text-sm text-foreground">I approve this design for production</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={revisionChecked}
              onCheckedChange={(checked) => {
                setRevisionChecked(checked === true);
                if (checked) setApproveChecked(false);
              }}
              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <span className="text-sm text-foreground">Revisions requested</span>
          </label>
        </div>

        {/* Revision Notes - Only shown when requesting revisions */}
        {revisionChecked && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">What changes would you like?</label>
            <Textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Please describe the changes you'd like to see..."
              className="bg-background min-h-[80px]"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {approveChecked && (
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !customerName.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
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
              className="flex-1 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
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

      {/* Mandatory Disclaimer - OS-owned, hardcoded, never editable */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border">
        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
