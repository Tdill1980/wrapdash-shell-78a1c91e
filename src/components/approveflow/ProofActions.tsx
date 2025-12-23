import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ProofActionsProps {
  status: string;
  approvedAt?: string | null;
  onApprove: () => Promise<void>;
  onRequestRevision: (notes: string) => Promise<void>;
}

export function ProofActions({
  status,
  approvedAt,
  onApprove,
  onRequestRevision,
}: ProofActionsProps) {
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isApproved = status === "approved";

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await onRequestRevision(revisionNotes);
      setRevisionNotes("");
      setShowRevisionForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isApproved) {
    return (
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Design Approved</span>
        </div>
        {approvedAt && (
          <p className="text-sm text-muted-foreground">
            Your approval was confirmed on {format(new Date(approvedAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Your design is now in production. Thank you for your approval!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-6">
      {!showRevisionForm ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto min-w-[180px] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Approve Design
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto min-w-[180px]"
            onClick={() => setShowRevisionForm(true)}
            disabled={isSubmitting}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Request Revision
          </Button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              What changes would you like?
            </label>
            <Textarea
              placeholder="Please describe the changes you'd like to see..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowRevisionForm(false);
                setRevisionNotes("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleRevision}
              disabled={isSubmitting || !revisionNotes.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Submit Revision
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Questions? Reply to your proof email to chat with our design team.
      </p>
    </div>
  );
}
