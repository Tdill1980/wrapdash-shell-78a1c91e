// src/components/ads/StaticAdDesigner.tsx

import React, { useState } from "react";
import { StaticAdSelector } from "./StaticAdSelector";
import { TemplateAdPicker } from "./TemplateAdPicker";
import { MetaAdFormatPicker } from "./MetaAdFormatPicker";
import { MetaAdPreviewFrame } from "./MetaAdPreviewFrame";
import { useStaticAdBuilder, StaticAdLayout } from "@/hooks/useStaticAdBuilder";
import { MetaPlacement, META_PLACEMENTS } from "@/lib/meta-ads";
import { CTA_OPTIONS, MetaCTA } from "@/lib/meta-ads/ctaMap";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaticAdDesignerProps {
  mediaUrl?: string;
  organizationId?: string;
  initialHeadline?: string;
  initialCta?: MetaCTA;
  onLayoutGenerated?: (layout: StaticAdLayout) => void;
}

export function StaticAdDesigner({
  mediaUrl,
  organizationId,
  initialHeadline = "",
  initialCta = "GET_QUOTE",
  onLayoutGenerated,
}: StaticAdDesignerProps) {
  const { generateStaticAd, loading, adLayout, reset } = useStaticAdBuilder();

  const [mode, setMode] = useState<"template" | "ai">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("bold_premium");
  const [selectedPlacement, setSelectedPlacement] = useState<MetaPlacement>("ig_feed");
  const [headline, setHeadline] = useState(initialHeadline);
  const [primaryText, setPrimaryText] = useState("");
  const [cta, setCta] = useState<MetaCTA>(initialCta);

  const handleGenerate = async () => {
    const result = await generateStaticAd({
      mode,
      templateId: mode === "template" ? selectedTemplate : undefined,
      placement: selectedPlacement,
      headline,
      primaryText,
      cta,
      mediaUrl,
      organizationId,
    });

    if (result && onLayoutGenerated) {
      onLayoutGenerated(result);
    }
  };

  const placementFormat = META_PLACEMENTS[selectedPlacement];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* LEFT SIDE - CONTROLS */}
      <div className="space-y-6">
        {/* Mode Selector */}
        <StaticAdSelector mode={mode} onModeChange={setMode} />

        {/* Template Picker (only in template mode) */}
        {mode === "template" && (
          <TemplateAdPicker
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        )}

        {/* Placement Picker */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Ad Placement
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(META_PLACEMENTS).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlacement(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-all",
                  selectedPlacement === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:border-primary/50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Copy Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Headline</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Transform Your Ride Today"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {headline.length}/40 characters
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Primary Text (optional)</label>
            <Textarea
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              placeholder="Turn heads everywhere you go..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Call To Action</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CTA_OPTIONS.slice(0, 6).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setCta(option.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-all",
                    cta === option.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={loading || !headline}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {mode === "template" ? "Apply Template" : "Generate AI Design"}
              </>
            )}
          </Button>

          {adLayout && (
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - PREVIEW */}
      <div className="space-y-4">
        <div className="p-4 border rounded-xl bg-muted/30">
          <MetaAdPreviewFrame
            placement={selectedPlacement}
            mediaUrl={mediaUrl}
            caption={headline}
            showSafeZones={true}
          />
        </div>

        {/* Layout Output (debug/export) */}
        {adLayout && (
          <div className="p-4 border rounded-xl bg-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Generated Layout</h4>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </Button>
            </div>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(adLayout.layout, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
