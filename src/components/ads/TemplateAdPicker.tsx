// src/components/ads/TemplateAdPicker.tsx

import React from "react";
import { cn } from "@/lib/utils";
import { STATIC_AD_TEMPLATES, StaticAdTemplate } from "@/hooks/useStaticAdBuilder";
import { CheckCircle2 } from "lucide-react";

interface TemplateAdPickerProps {
  selected: string | null;
  onSelect: (templateId: string) => void;
}

export function TemplateAdPicker({ selected, onSelect }: TemplateAdPickerProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Choose Template
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STATIC_AD_TEMPLATES.map((template) => {
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all group",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="text-3xl mb-2">{template.preview}</div>
              <p className="font-semibold text-sm">{template.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {template.description}
              </p>
              {isSelected && (
                <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
