import { Badge } from "@/components/ui/badge";
import { Bot, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceCommandAIBadgeProps {
  variant?: "default" | "compact" | "full";
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
}

/**
 * VoiceCommandAI System Badge
 *
 * Unified AI system powering:
 * - Website Chat (Jordan Lee)
 * - Phone Calls (VAPI)
 * - Instagram DMs (Casey Ramirez)
 * - Email (Alex Morgan)
 * - Auto-Quote Generation
 */
export function VoiceCommandAIBadge({
  variant = "default",
  className,
  showIcon = true,
  animated = false
}: VoiceCommandAIBadgeProps) {
  if (variant === "compact") {
    return (
      <Badge
        className={cn(
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] px-1.5 py-0.5",
          animated && "animate-pulse",
          className
        )}
      >
        {showIcon && <Zap className="w-2.5 h-2.5 mr-0.5" />}
        VCAI
      </Badge>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/30", className)}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
            VoiceCommandAI
            <Zap className="w-3 h-3 text-violet-400" />
          </p>
          <p className="text-[10px] text-muted-foreground">
            Unified AI Parsing System
          </p>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Badge
      className={cn(
        "bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
        animated && "animate-pulse",
        className
      )}
    >
      {showIcon && <Bot className="w-3 h-3 mr-1" />}
      VoiceCommandAI
    </Badge>
  );
}

/**
 * VoiceCommandAI Agent indicator
 */
export function VoiceCommandAIAgent({
  channel,
  className
}: {
  channel: "website_chat" | "phone" | "instagram" | "email";
  className?: string;
}) {
  const agents: Record<string, { name: string; color: string }> = {
    website_chat: { name: "Jordan Lee", color: "text-blue-400" },
    phone: { name: "Taylor (VAPI)", color: "text-amber-400" },
    instagram: { name: "Casey Ramirez", color: "text-pink-400" },
    email: { name: "Alex Morgan", color: "text-green-400" },
  };

  const agent = agents[channel] || { name: "VoiceCommandAI", color: "text-violet-400" };

  return (
    <span className={cn("flex items-center gap-1 text-xs", className)}>
      <Bot className={cn("w-3 h-3", agent.color)} />
      <span className={agent.color}>{agent.name}</span>
      <VoiceCommandAIBadge variant="compact" showIcon={false} />
    </span>
  );
}
