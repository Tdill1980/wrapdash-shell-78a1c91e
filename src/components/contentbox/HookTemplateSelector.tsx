import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { WPW_TEMPLATES, APP_TEMPLATES, getTemplateById } from "@/lib/content-editing/hookTemplates";

interface HookTemplateSelectorProps {
  onSelect: (template: string) => void;
  selectedId?: string;
}

export function HookTemplateSelector({ onSelect, selectedId }: HookTemplateSelectorProps) {
  const handleSelect = (id: string) => {
    const template = getTemplateById(id);
    if (template) {
      onSelect(template.template);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground font-medium">Hook Template</label>
      <Select value={selectedId} onValueChange={handleSelect}>
        <SelectTrigger className="h-9 bg-background">
          <SelectValue placeholder="Choose a hook template..." />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">WPW Templates</div>
          {WPW_TEMPLATES.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-400">WPW</Badge>
                <span>{t.name}</span>
              </div>
            </SelectItem>
          ))}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">App Templates</div>
          {APP_TEMPLATES.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-400">APP</Badge>
                <span>{t.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
