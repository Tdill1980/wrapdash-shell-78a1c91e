import React from "react";
import { Button } from "@/components/ui/button";
import { User, Wrench, Video, X } from "lucide-react";
import { ToneType, TONE_OPTIONS } from "@/lib/content-editing/applyTone";

interface ToneTabsSelectorProps {
  selectedTone: ToneType;
  onSelect: (tone: ToneType) => void;
}

const TONE_ICONS: Record<ToneType, React.ReactNode> = {
  founder: <User className="w-3.5 h-3.5" />,
  installer: <Wrench className="w-3.5 h-3.5" />,
  proof: <Video className="w-3.5 h-3.5" />,
  none: <X className="w-3.5 h-3.5" />,
};

export function ToneTabsSelector({ selectedTone, onSelect }: ToneTabsSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground font-medium">Voice Tone</label>
      <div className="flex gap-1">
        {TONE_OPTIONS.map((tone) => (
          <Button
            key={tone.id}
            variant={selectedTone === tone.id ? "default" : "outline"}
            size="sm"
            className={`h-8 px-3 text-xs gap-1.5 flex-1 ${
              selectedTone === tone.id 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-primary/10"
            }`}
            onClick={() => onSelect(tone.id)}
            title={tone.description}
          >
            {TONE_ICONS[tone.id]}
            {tone.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
