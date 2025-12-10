// src/components/ads/StaticAdSelector.tsx

import React from "react";
import { cn } from "@/lib/utils";
import { LayoutTemplate, Sparkles } from "lucide-react";

interface StaticAdSelectorProps {
  mode: "template" | "ai";
  onModeChange: (mode: "template" | "ai") => void;
}

export function StaticAdSelector({ mode, onModeChange }: StaticAdSelectorProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onModeChange("template")}
        className={cn(
          "flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all",
          mode === "template"
            ? "border-primary bg-primary/10 text-primary"
            : "border-muted hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <LayoutTemplate className="w-5 h-5" />
        <div className="text-left">
          <p className="font-semibold">Template Ad</p>
          <p className="text-xs text-muted-foreground">Use pre-designed layouts</p>
        </div>
      </button>

      <button
        onClick={() => onModeChange("ai")}
        className={cn(
          "flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all",
          mode === "ai"
            ? "border-primary bg-primary/10 text-primary"
            : "border-muted hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <Sparkles className="w-5 h-5" />
        <div className="text-left">
          <p className="font-semibold">AI Designed</p>
          <p className="text-xs text-muted-foreground">AI creates unique layout</p>
        </div>
      </button>
    </div>
  );
}
