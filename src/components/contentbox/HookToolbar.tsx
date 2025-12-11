import React from "react";
import { Button } from "@/components/ui/button";
import { Zap, Scissors, ArrowRight, User, Wrench } from "lucide-react";
import { HOOK_TOOLS } from "@/lib/content-editing/hookTools";

interface HookToolbarProps {
  text: string;
  onTransform: (newText: string) => void;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  stronger: <Zap className="w-3 h-3" />,
  shorten: <Scissors className="w-3 h-3" />,
  direct: <ArrowRight className="w-3 h-3" />,
  founder: <User className="w-3 h-3" />,
  installer: <Wrench className="w-3 h-3" />,
};

export function HookToolbar({ text, onTransform }: HookToolbarProps) {
  const handleToolClick = (toolId: string) => {
    const tool = HOOK_TOOLS.find(t => t.id === toolId);
    if (tool) {
      onTransform(tool.transform(text));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {HOOK_TOOLS.map((tool) => (
        <Button
          key={tool.id}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:border-primary/50"
          onClick={() => handleToolClick(tool.id)}
          title={tool.description}
        >
          {TOOL_ICONS[tool.id]}
          {tool.label}
        </Button>
      ))}
    </div>
  );
}
