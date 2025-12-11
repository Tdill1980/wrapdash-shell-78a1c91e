import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { hookTiming, formatTimingBadge } from "@/lib/content-editing/hookTiming";

interface HookTimingBadgeProps {
  text: string;
  showDetails?: boolean;
}

const COLOR_CLASSES = {
  green: "bg-green-500/10 border-green-500/30 text-green-400",
  yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  red: "bg-red-500/10 border-red-500/30 text-red-400",
};

export function HookTimingBadge({ text, showDetails = false }: HookTimingBadgeProps) {
  const timing = hookTiming(text);
  
  if (!text.trim()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`text-xs gap-1 ${COLOR_CLASSES[timing.color]}`}
      >
        <Clock className="w-3 h-3" />
        {formatTimingBadge(timing)}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {timing.words} words • {timing.recommendation}
        </span>
      )}
    </div>
  );
}
