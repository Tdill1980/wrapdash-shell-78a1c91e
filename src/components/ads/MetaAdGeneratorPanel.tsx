// src/components/ads/MetaAdGeneratorPanel.tsx

import React from "react";
import { CTA_OPTIONS, MetaCTA } from "@/lib/meta-ads/ctaMap";
import { MetaAdOutput } from "@/hooks/useMetaAdGenerator";
import { cn } from "@/lib/utils";
import { Copy, FileJson, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SelectedCopy {
  primary_text?: string;
  headline?: string;
  description?: string;
  cta?: MetaCTA;
}

interface MetaAdGeneratorPanelProps {
  adOutput: MetaAdOutput | null;
  selectedCopy: SelectedCopy;
  onSelectCopy: (updates: Partial<SelectedCopy>) => void;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
}

export function MetaAdGeneratorPanel({
  adOutput,
  selectedCopy,
  onSelectCopy,
  onExportJSON,
  onExportCSV,
}: MetaAdGeneratorPanelProps) {
  if (!adOutput) {
    return (
      <div className="p-6 border rounded-xl text-muted-foreground text-center">
        Select a placement and generate ad copy to begin.
      </div>
    );
  }

  const { short_texts = [], long_texts = [], headlines = [], descriptions = [], angles = [] } = adOutput;
  const allTexts = [...short_texts, ...long_texts];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 p-4 border rounded-xl bg-card">
      <h2 className="text-xl font-semibold">Ad Copy Variants</h2>

      {/* PRIMARY TEXT */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Primary Text
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {allTexts.map((text, i) => {
            const isSelected = selectedCopy.primary_text === text;
            const isShort = i < short_texts.length;
            return (
              <button
                key={i}
                onClick={() => onSelectCopy({ primary_text: text })}
                className={cn(
                  "p-3 border rounded-lg text-left text-sm transition-all relative group",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <span className="absolute top-2 right-2 text-xs text-muted-foreground">
                  {isShort ? "Short" : "Long"} • {text.length} chars
                </span>
                <p className="pr-16 line-clamp-4">{text}</p>
                {isSelected && (
                  <CheckCircle2 className="absolute bottom-2 right-2 w-4 h-4 text-primary" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(text);
                  }}
                  className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* HEADLINES */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Headlines
        </h3>
        <div className="flex flex-wrap gap-2">
          {headlines.map((h, i) => {
            const isSelected = selectedCopy.headline === h;
            return (
              <button
                key={i}
                onClick={() => onSelectCopy({ headline: h })}
                className={cn(
                  "px-3 py-1.5 border rounded-full text-sm transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESCRIPTIONS */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Descriptions
        </h3>
        <div className="flex flex-wrap gap-2">
          {descriptions.map((d, i) => {
            const isSelected = selectedCopy.description === d;
            return (
              <button
                key={i}
                onClick={() => onSelectCopy({ description: d })}
                className={cn(
                  "px-3 py-1.5 border rounded-full text-sm transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Call To Action
        </h3>
        <div className="flex flex-wrap gap-2">
          {CTA_OPTIONS.map((cta) => {
            const isSelected = selectedCopy.cta === cta.id;
            return (
              <button
                key={cta.id}
                onClick={() => onSelectCopy({ cta: cta.id })}
                className={cn(
                  "px-4 py-2 border rounded-lg text-sm transition-all",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {cta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* AD ANGLES */}
      {angles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Ad Angles
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {angles.map((angle, i) => (
              <button
                key={i}
                onClick={() =>
                  onSelectCopy({
                    primary_text: angle.primary_text,
                    headline: angle.headline,
                  })
                }
                className="p-3 border rounded-lg text-left hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <span className="text-xs font-medium text-primary">{angle.name}</span>
                <p className="text-sm mt-1 line-clamp-2">{angle.headline}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EXPORT */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onExportJSON}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <FileJson className="w-4 h-4" />
          Export JSON
        </button>
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
