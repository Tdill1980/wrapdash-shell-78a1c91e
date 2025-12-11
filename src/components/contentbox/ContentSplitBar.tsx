import React from "react";
import { Button } from "@/components/ui/button";
import { Type, AlignLeft, FileText } from "lucide-react";
import { splitContent } from "@/lib/content-editing/splitContent";

interface ContentSplitBarProps {
  text: string;
  onSelect: (content: string) => void;
  activeType?: 'headline' | 'caption' | 'script';
}

export function ContentSplitBar({ text, onSelect, activeType }: ContentSplitBarProps) {
  const split = splitContent(text);

  const buttons = [
    { id: 'headline' as const, label: 'Headline', icon: <Type className="w-3 h-3" />, content: split.headline },
    { id: 'caption' as const, label: 'Caption', icon: <AlignLeft className="w-3 h-3" />, content: split.caption },
    { id: 'script' as const, label: 'Full Script', icon: <FileText className="w-3 h-3" />, content: split.script },
  ];

  return (
    <div className="flex gap-1">
      {buttons.map((btn) => (
        <Button
          key={btn.id}
          variant={activeType === btn.id ? "default" : "outline"}
          size="sm"
          className={`h-7 px-2 text-xs gap-1 ${
            activeType === btn.id ? "bg-primary" : "hover:bg-primary/10"
          }`}
          onClick={() => onSelect(btn.content)}
          disabled={!btn.content}
        >
          {btn.icon}
          {btn.label}
        </Button>
      ))}
    </div>
  );
}
