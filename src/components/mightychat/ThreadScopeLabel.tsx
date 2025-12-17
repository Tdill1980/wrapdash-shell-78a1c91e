import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadScopeLabelProps {
  isExternal: boolean;
  canReply: boolean;
  reason?: string;
}

export function ThreadScopeLabel({ isExternal, canReply, reason }: ThreadScopeLabelProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
      isExternal 
        ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" 
        : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
    )}>
      {isExternal ? (
        <>
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="font-medium text-red-700 dark:text-red-400">
            EXTERNAL — Customer-Facing
          </span>
          {!canReply && (
            <Badge variant="outline" className="ml-2 text-[10px] border-red-300">
              <Lock className="w-3 h-3 mr-1" />
              Read Only
            </Badge>
          )}
        </>
      ) : (
        <>
          <Shield className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-700 dark:text-green-400">
            INTERNAL — Team Only
          </span>
        </>
      )}
      {reason && !canReply && (
        <span className="text-xs text-muted-foreground ml-2">
          {reason}
        </span>
      )}
    </div>
  );
}

// Banner component for conversation view
export function ThreadScopeBanner({ isExternal }: { isExternal: boolean }) {
  if (!isExternal) return null;
  
  return (
    <div className="bg-red-100 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800 px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">Customer-facing — responses are logged.</span>
      </div>
    </div>
  );
}

// Disabled reply box component
interface DisabledReplyBoxProps {
  reason: string;
  handler: string;
}

export function DisabledReplyBox({ reason, handler }: DisabledReplyBoxProps) {
  return (
    <div className="p-4 border-t bg-muted/30">
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-3 border-2 border-dashed rounded-lg">
        <Lock className="w-4 h-4" />
        <span className="text-sm">{reason}</span>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        External replies are handled by {handler}.
      </p>
    </div>
  );
}
