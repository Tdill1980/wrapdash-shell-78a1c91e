import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Type, Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Caption,
  CaptionStyle,
  CaptionSettings,
  CAPTION_STYLE_CONFIGS,
} from "@/hooks/useReelCaptions";

interface CaptionsPanelProps {
  captions: Caption[];
  settings: CaptionSettings;
  loading: boolean;
  onGenerateCaptions: (style: CaptionStyle) => void;
  onUpdateSettings: (updates: Partial<CaptionSettings>) => void;
  onRemoveCaption: (id: string) => void;
}

export function CaptionsPanel({
  captions,
  settings,
  loading,
  onGenerateCaptions,
  onUpdateSettings,
  onRemoveCaption,
}: CaptionsPanelProps) {
  const styles: CaptionStyle[] = ["sabri", "dara", "clean"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Type className="w-4 h-4" />
          Auto Captions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Style selector */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Caption Style</label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => onUpdateSettings({ style })}
                className={cn(
                  "p-2 rounded-lg border text-xs text-center transition-all",
                  settings.style === style
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="font-medium block">{CAPTION_STYLE_CONFIGS[style].name}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {CAPTION_STYLE_CONFIGS[settings.style].description}
          </p>
        </div>

        {/* Generate button */}
        <Button
          className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
          onClick={() => onGenerateCaptions(settings.style)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Captions
            </>
          )}
        </Button>

        {/* Caption preview */}
        {captions.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {captions.map((caption) => (
              <div
                key={caption.id}
                className="p-2 rounded-lg bg-muted/50 border border-border group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm",
                        caption.style === "sabri" && "font-bold uppercase",
                        caption.style === "dara" && "italic"
                      )}
                    >
                      {caption.text}
                      {caption.emoji && <span className="ml-1">{caption.emoji}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {caption.start.toFixed(1)}s - {caption.end.toFixed(1)}s
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveCaption(caption.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Position selector */}
        {captions.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Position</label>
            <div className="grid grid-cols-3 gap-1">
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onUpdateSettings({ position: pos })}
                  className={cn(
                    "py-1.5 px-2 rounded text-[10px] capitalize transition-all",
                    settings.position === pos
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
