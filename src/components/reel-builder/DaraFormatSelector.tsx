import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DARA_FORMATS, DaraFormat, FORMAT_OPTIONS } from "@/lib/dara-denney-formats";
import { Sparkles } from "lucide-react";

interface DaraFormatSelectorProps {
  value: DaraFormat | null;
  onChange: (format: DaraFormat) => void;
}

export function DaraFormatSelector({ value, onChange }: DaraFormatSelectorProps) {
  const selectedFormat = value ? DARA_FORMATS[value] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <label className="text-sm font-medium">Dara Denney Format</label>
      </div>
      
      <Select value={value || ""} onValueChange={(v) => onChange(v as DaraFormat)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select ad format..." />
        </SelectTrigger>
        <SelectContent>
          {FORMAT_OPTIONS.map((format) => (
            <SelectItem key={format.id} value={format.id}>
              <span className="flex items-center gap-2">
                <span>{format.emoji}</span>
                <span>{format.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedFormat && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedFormat.emoji}</span>
              <span className="font-semibold text-sm">{selectedFormat.name}</span>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedFormat.psychology}
            </p>
            
            <div className="flex flex-wrap gap-1">
              {selectedFormat.best_for.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1">Example hooks:</p>
              <div className="flex flex-wrap gap-1">
                {selectedFormat.hooks.map((hook) => (
                  <Badge key={hook} variant="outline" className="text-[10px] font-normal">
                    "{hook}"
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-muted-foreground">
              <div>
                <span className="font-medium">Clips:</span> {selectedFormat.visual_style.recommended_clips}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {selectedFormat.visual_style.clip_duration}
              </div>
              <div>
                <span className="font-medium">Max text:</span> {selectedFormat.visual_style.max_text_length} chars
              </div>
              <div>
                <span className="font-medium">Position:</span> {selectedFormat.visual_style.text_position}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
