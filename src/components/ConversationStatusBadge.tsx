import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Pause, FileText, Circle } from "lucide-react";

interface AIAction {
  status: string | null;
}

interface Receipt {
  status: string;
  error: string | null;
}

interface ConversationStatusBadgeProps {
  aiPaused: boolean;
  pendingActions: AIAction[];
  receipts: Receipt[];
  className?: string;
}

export function ConversationStatusBadge({
  aiPaused,
  pendingActions,
  receipts,
  className,
}: ConversationStatusBadgeProps) {
  // 1️⃣ Failed send - highest priority
  const failedReceipt = receipts.find((r) => r.status === "failed");
  if (failedReceipt) {
    return (
      <Badge variant="destructive" className={className} title={failedReceipt.error || "Send failed"}>
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  }

  // 2️⃣ Pending approval
  const pendingApproval = pendingActions.find((a) => a.status === "pending");
  if (pendingApproval) {
    return (
      <Badge variant="outline" className={className}>
        <Clock className="h-3 w-3 mr-1" />
        Pending Approval
      </Badge>
    );
  }

  // 3️⃣ AI paused
  if (aiPaused) {
    return (
      <Badge variant="secondary" className={className}>
        <Pause className="h-3 w-3 mr-1" />
        AI Paused
      </Badge>
    );
  }

  // 4️⃣ Sent successfully
  const sentReceipt = receipts.find((r) => r.status === "sent");
  if (sentReceipt) {
    return (
      <Badge className={`bg-green-600 text-white hover:bg-green-700 ${className || ""}`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Sent
      </Badge>
    );
  }

  // 5️⃣ Drafted but not sent
  if (pendingActions.length > 0) {
    return (
      <Badge variant="outline" className={className}>
        <FileText className="h-3 w-3 mr-1" />
        Drafted
      </Badge>
    );
  }

  // 6️⃣ Idle
  return (
    <Badge variant="outline" className={`text-muted-foreground ${className || ""}`}>
      <Circle className="h-3 w-3 mr-1" />
      Idle
    </Badge>
  );
}
