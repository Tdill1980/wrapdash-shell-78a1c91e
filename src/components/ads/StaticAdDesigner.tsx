// src/components/ads/StaticAdDesigner.tsx

import React, { useState } from "react";
import { StaticAdSelector } from "./StaticAdSelector";
import { TemplateAdPicker } from "./TemplateAdPicker";
import { MetaAdFormatPicker } from "./MetaAdFormatPicker";
import { MetaAdPreviewFrame } from "./MetaAdPreviewFrame";
import { useStaticAdBuilder, StaticAdLayout } from "@/hooks/useStaticAdBuilder";
import { useStaticAdRender } from "@/hooks/useStaticAdRender";
import { useAdVault } from "@/hooks/useAdVault";
import { useOrganization } from "@/contexts/OrganizationContext";
import { MetaPlacement, META_PLACEMENTS } from "@/lib/meta-ads";
import { CTA_OPTIONS, MetaCTA } from "@/lib/meta-ads/ctaMap";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, RefreshCw, Save, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StaticAdDesignerProps {
  mediaUrl?: string;
  organizationId?: string;
  initialHeadline?: string;
  initialCta?: MetaCTA;
  onLayoutGenerated?: (layout: StaticAdLayout) => void;
}

export function StaticAdDesigner({
  mediaUrl,
  organizationId: propOrgId,
  initialHeadline = "",
  initialCta = "GET_QUOTE",
  onLayoutGenerated,
}: StaticAdDesignerProps) {
  const { organizationId: contextOrgId } = useOrganization();
  const orgId = propOrgId || contextOrgId;

  const { generateStaticAd, loading, adLayout, reset } = useStaticAdBuilder();
  const { startRender, rendering, progress, result, reset: resetRender } = useStaticAdRender();
  const { addToVault, isAdding } = useAdVault(orgId || undefined);

  const [mode, setMode] = useState<"template" | "ai">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("bold_premium");
  const [selectedPlacement, setSelectedPlacement] = useState<MetaPlacement>("ig_feed");
  const [headline, setHeadline] = useState(initialHeadline);
  const [primaryText, setPrimaryText] = useState("");
  const [cta, setCta] = useState<MetaCTA>(initialCta);

  const placementFormat = META_PLACEMENTS[selectedPlacement];
  const aspectRatio = placementFormat?.aspectRatio || "4:5";

  const handleGenerate = async () => {
    const generatedLayout = await generateStaticAd({
      mode,
      templateId: mode === "template" ? selectedTemplate : undefined,
      placement: selectedPlacement,
      headline,
      primaryText,
      cta,
      mediaUrl,
      organizationId: orgId || undefined,
    });

    if (generatedLayout && onLayoutGenerated) {
      onLayoutGenerated(generatedLayout);
    }
  };

  const handleRenderPng = async () => {
    const ctaLabel = CTA_OPTIONS.find((c) => c.id === cta)?.label || "Get Quote";

    await startRender({
      mode,
      templateId: mode === "template" ? selectedTemplate : undefined,
      aspectRatio,
      headline,
      cta: ctaLabel,
      mediaUrl,
      layoutJson: adLayout?.layout,
    });
  };

  const handleSaveToVault = async () => {
    if (!result?.url || !orgId) {
      toast.error("No rendered image to save");
      return;
    }

    await addToVault({
      organization_id: orgId,
      placement: selectedPlacement,
      type: mode,
      png_url: result.url,
      template_id: mode === "template" ? selectedTemplate : null,
      layout_json: adLayout?.layout || null,
      headline,
      primary_text: primaryText || null,
      cta,
    });
  };

  const handleDownload = async () => {
    if (!result?.url) return;

    try {
      const response = await fetch(result.url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${headline || "ad"}-${selectedPlacement}-${Date.now()}.png`;
      link.click();
      toast.success("Download started");
    } catch {
      toast.error("Failed to download");
    }
  };

  const handleReset = () => {
    reset();
    resetRender();
  };

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

        {/* Action Buttons */}
        <div className="space-y-3">
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
                <>{mode === "template" ? "Apply Template" : "Generate AI Design"}</>
              )}
            </Button>

            {(adLayout || result) && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Render PNG Button */}
          {adLayout && !result?.url && (
            <Button
              onClick={handleRenderPng}
              disabled={rendering}
              variant="secondary"
              className="w-full"
            >
              {rendering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rendering PNG...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Render PNG
                </>
              )}
            </Button>
          )}

          {/* Progress Bar */}
          {rendering && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Rendering... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Save/Download Buttons */}
          {result?.url && (
            <div className="flex gap-3">
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button
                onClick={handleSaveToVault}
                disabled={isAdding || !orgId}
                className="flex-1"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save to Vault
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - PREVIEW */}
      <div className="space-y-4">
        <div className="p-4 border rounded-xl bg-muted/30">
          {result?.url ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">Rendered Ad</p>
              <img
                src={result.url}
                alt="Rendered Ad"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <MetaAdPreviewFrame
              placement={selectedPlacement}
              mediaUrl={mediaUrl}
              caption={headline}
              showSafeZones={true}
            />
          )}
        </div>

        {/* Layout Output (debug/export) */}
        {adLayout && !result?.url && (
          <div className="p-4 border rounded-xl bg-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Layout Preview</h4>
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
