import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

interface EscalationActionButtonsProps {
  conversationId: string;
  isLoading?: boolean;
  onResolve: () => void;
}

/**
 * EscalationActionButtons - Simplified to ONLY resolve
 * 
 * OS Rule: "Escalations are flags, not workspaces."
 * All other actions (reply, quote, call) happen in the canonical chat.
 */
export function EscalationActionButtons({
  isLoading,
  onResolve,
}: EscalationActionButtonsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">Actions</p>
      
      {/* Resolve Button - Only action allowed in Escalations view */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full gap-2 h-9 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-500"
        onClick={onResolve}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Resolve Escalation
      </Button>
      
      <p className="text-[10px] text-muted-foreground text-center">
        Open chat to reply, quote, or request call
      </p>
    </div>
  );
}
