import React from "react";
import { Lightbulb } from "lucide-react";
import { recommendHook, Asset } from "@/lib/content-editing/recommendHook";

interface AssetHookRecommenderProps {
  assets: Asset[];
  onSelectTemplate?: (templateId: string) => void;
}

export function AssetHookRecommender({ assets, onSelectTemplate }: AssetHookRecommenderProps) {
  if (!assets || assets.length === 0) {
    return null;
  }

  const recommendation = recommendHook(assets);

  return (
    <div 
      className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/15 transition-colors"
      onClick={() => onSelectTemplate?.(recommendation.templateId)}
    >
      <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <div className="text-xs">
        <span className="text-emerald-400 font-medium">Suggested: </span>
        <span className="text-foreground">{recommendation.templateName}</span>
        <span className="text-muted-foreground ml-1">— {recommendation.reason}</span>
      </div>
    </div>
  );
}
