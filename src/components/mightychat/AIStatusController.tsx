import { useAIStatus, AIStatusMode } from "@/hooks/useAIStatus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Zap, Hand, Power, Loader2 } from "lucide-react";

export function AIStatusController() {
  const { mode, loading, updating, updateStatus } = useAIStatus();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading AI status...</span>
      </div>
    );
  }

  const modes: { value: AIStatusMode; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    { 
      value: "live", 
      label: "LIVE", 
      icon: <Zap className="h-4 w-4" />,
      color: "text-green-500",
      bgColor: "bg-green-500/20 border-green-500/50 hover:bg-green-500/30"
    },
    { 
      value: "manual", 
      label: "MANUAL", 
      icon: <Hand className="h-4 w-4" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30"
    },
    { 
      value: "off", 
      label: "OFF", 
      icon: <Power className="h-4 w-4" />,
      color: "text-red-500",
      bgColor: "bg-red-500/20 border-red-500/50 hover:bg-red-500/30"
    },
  ];

  const currentMode = modes.find(m => m.value === mode);

  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 border-b",
      mode === "live" && "bg-green-500/10 border-green-500/30",
      mode === "manual" && "bg-yellow-500/10 border-yellow-500/30",
      mode === "off" && "bg-red-500/10 border-red-500/30"
    )}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">AI Status:</span>
        <span className={cn("font-bold text-sm flex items-center gap-1", currentMode?.color)}>
          {currentMode?.icon}
          {currentMode?.label}
        </span>
        {mode === "off" && (
          <span className="text-xs text-muted-foreground ml-2">
            (No automated responses)
          </span>
        )}
        {mode === "manual" && (
          <span className="text-xs text-muted-foreground ml-2">
            (AI drafts require approval)
          </span>
        )}
        {mode === "live" && (
          <span className="text-xs text-muted-foreground ml-2">
            (Auto-responding to messages)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        {modes.map((m) => (
          <Button
            key={m.value}
            variant="outline"
            size="sm"
            disabled={updating}
            onClick={() => updateStatus(m.value)}
            className={cn(
              "gap-1 text-xs border transition-all",
              mode === m.value 
                ? cn(m.bgColor, m.color, "font-bold") 
                : "opacity-50 hover:opacity-100"
            )}
          >
            {updating && mode !== m.value ? null : m.icon}
            {m.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
