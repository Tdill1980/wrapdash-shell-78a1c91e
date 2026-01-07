// ============================================
// MyApproveFlow Actions - Approve / Request Revisions
// ============================================
// All approval goes through edge functions ONLY
// Customers never write directly to tables

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Download, 
  Printer, 
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface MyApproveFlowActionsProps {
  isApproved: boolean;
  approvedAt: string | null;
  pdfUrl: string | null;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onApprove: () => Promise<void>;
  onRequestRevisions: (notes: string) => Promise<void>;
  approving: boolean;
  status: string;
}

export function MyApproveFlowActions({
  isApproved,
  approvedAt,
  pdfUrl,
  customerName,
  onCustomerNameChange,
  onApprove,
  onRequestRevisions,
  approving,
  status
}: MyApproveFlowActionsProps) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const handleApprove = async () => {
    await onApprove();
    setConfirmApprove(false);
  };

  const handleSubmitRevision = async () => {
    if (!revisionNotes.trim()) return;
    setSubmittingRevision(true);
    await onRequestRevisions(revisionNotes);
    setSubmittingRevision(false);
    setShowRevisionForm(false);
    setRevisionNotes("");
  };

  const canApprove = status === "ready" || status === "sent";
  const isRevisionRequested = status === "revision_requested";

  // Approved State
  if (isApproved) {
    return (
      <Card className="bg-card border-border border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Design Approved</h3>
                <p className="text-sm text-muted-foreground">
                  {approvedAt ? `Approved on ${format(new Date(approvedAt), "MMMM d, yyyy 'at' h:mm a")}` : "Approval confirmed"}
                </p>
              </div>
            </div>
            
            {pdfUrl && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={pdfUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Revision Requested State
  if (isRevisionRequested) {
    return (
      <Card className="bg-card border-border border-yellow-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Revisions Requested</h3>
              <p className="text-sm text-muted-foreground">
                Our design team is working on your requested changes. You'll receive a notification when a new proof is ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ready for Approval State
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Review & Approve
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PDF Download */}
        {pdfUrl && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Approval Document</p>
              <p className="text-sm text-muted-foreground">Download or print for your records</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Approval Form */}
        {!showRevisionForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-foreground">Your Name (Required)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder="Enter your full name"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="confirmApprove"
                checked={confirmApprove}
                onCheckedChange={(checked) => setConfirmApprove(checked as boolean)}
              />
              <Label htmlFor="confirmApprove" className="text-sm text-muted-foreground leading-snug">
                I have reviewed this design proof and approve it for production. I understand that changes 
                after approval may result in additional charges and delays.
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleApprove}
                disabled={!confirmApprove || !customerName.trim() || approving}
                className="flex-1"
              >
                {approving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve Design
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRevisionForm(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Request Revisions
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <p className="text-sm text-foreground">
                Please describe the changes you'd like. Our design team will review and provide an updated proof.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revisionNotes" className="text-foreground">Revision Notes</Label>
              <Textarea
                id="revisionNotes"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Describe the changes you need..."
                rows={4}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitRevision}
                disabled={!revisionNotes.trim() || submittingRevision}
                className="flex-1"
              >
                {submittingRevision ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Submit Revision Request
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRevisionForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
