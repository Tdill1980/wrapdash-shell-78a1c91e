import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Receipt,
  User,
  Edit3,
} from "lucide-react";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AttachedQuote {
  id: string;
  quote_number: string;
  total: number;
}

interface AlexApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  recipient: { email: string; name?: string };
  subject: string;
  body: string;
  quote?: AttachedQuote | null;
  actionType: "email_reply" | "schedule_call" | "quote_send";
  assignedTo?: string;
  onSuccess: () => void;
  onRegenerate?: () => void;
}

export function AlexApprovalModal({
  open,
  onOpenChange,
  conversationId,
  recipient,
  subject: initialSubject,
  body: initialBody,
  quote,
  actionType,
  assignedTo,
  onSuccess,
  onRegenerate,
}: AlexApprovalModalProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // FIX #1: Proper useEffect to sync with props
  useEffect(() => {
    setSubject(initialSubject);
    setBody(initialBody);
  }, [initialSubject, initialBody]);

  const handleApproveAndSend = async () => {
    if (!recipient.email || !body.trim()) {
      setSendError("Missing recipient email or message body");
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const approvedAt = new Date().toISOString();

      // GOTCHA #1: Get REAL user ID - NEVER allow "unknown"
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        throw new Error("You must be logged in to approve & send.");
      }
      const approvedBy = user.id;

      // FIX #3: Do NOT update quote status here - ONLY the edge function should do this
      // This ensures atomic truth: if email fails, quote status stays unchanged

      // Call the send-admin-reply edge function - the SINGLE source of truth
      const { data, error } = await lovableFunctions.functions.invoke("send-admin-reply", {
        body: {
          conversation_id: conversationId,
          to_email: recipient.email,
          to_name: recipient.name || undefined,
          subject: subject,
          body: body,
          quote_id: quote?.id,
          quote_number: quote?.quote_number,
          approved_by: approvedBy, // Real user ID
          approved_at: approvedAt,
          action_type: actionType,
          assigned_to: assignedTo,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to send email");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Email send failed");
      }

      // FIX #4: Do NOT update quote status here - edge function already did it
      // This prevents double-writes and ensures single source of truth

      toast.success("Email sent successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("[AlexApprovalModal] Send error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send email";
      setSendError(errorMessage);
      toast.error(errorMessage);
      // DO NOT close modal - keep it open so user can retry or cancel
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
      // Don't close modal - wait for new content to be passed in
    }
  };

  const getActionTypeLabel = () => {
    switch (actionType) {
      case "schedule_call":
        return "Scheduling Email";
      case "quote_send":
        return "Quote Email";
      default:
        return "Email Reply";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Preview & Send {getActionTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Review the email below before sending. This is exactly what the customer will receive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Banner */}
          {sendError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Send Failed</p>
                <p className="text-xs text-destructive/80">{sendError}</p>
              </div>
            </div>
          )}

          {/* Recipient Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">To:</span>
              <span>{recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}</span>
            </div>
          </div>

          {/* Quote Attached Badge */}
          {quote && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                <Receipt className="h-3 w-3" />
                Quote #{quote.quote_number} attached (${quote.total?.toLocaleString()})
              </Badge>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            {isEditing ? (
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-sm"
              />
            ) : (
              <div className="p-2 bg-muted/30 rounded border text-sm">{subject}</div>
            )}
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-sm font-medium">
              Message Body
            </Label>
            {isEditing ? (
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[200px] text-sm resize-none"
              />
            ) : (
              <div className="p-3 bg-muted/30 rounded border text-sm whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                {body}
              </div>
            )}
          </div>

          {/* Edit Toggle */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-1 text-xs"
            >
              <Edit3 className="h-3 w-3" />
              {isEditing ? "Done Editing" : "Edit"}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isSending}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApproveAndSend}
            disabled={isSending || !body.trim()}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Approve & Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
