// src/components/ads/MetaVideoAdFastPanel.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Video,
  Loader2,
  ChevronDown,
  Copy,
  Download,
  Calendar,
  Save,
  Check,
  Sparkles,
  Play,
  FileJson,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { MetaAdFormatPicker } from "./MetaAdFormatPicker";
import { MetaAdPreviewFrame } from "./MetaAdPreviewFrame";
import {
  useMetaVideoAdGenerator,
  VIDEO_AD_BUTTON_LABELS,
  StyleModifier,
  VideoAdOutput,
} from "@/hooks/useMetaVideoAdGenerator";
import { MetaPlacement, META_PLACEMENTS } from "@/lib/meta-ads";

const STYLE_OPTIONS: { value: StyleModifier; label: string; description: string }[] = [
  { value: "none", label: "Standard", description: "Professional wrap shop marketing" },
  { value: "garyvee", label: "Gary Vee", description: "Raw, punchy founder energy" },
  { value: "sabrisuby", label: "Sabri Suby", description: "Direct response, conversion-focused" },
  { value: "daradenney", label: "Dara Denney", description: "UGC storytelling, paid social" },
];

interface MetaVideoAdFastPanelProps {
  videoUrl?: string;
  videoThumbnail?: string;
  organizationId?: string;
  onClose?: () => void;
}

export function MetaVideoAdFastPanel({
  videoUrl,
  videoThumbnail,
  organizationId,
}: MetaVideoAdFastPanelProps) {
  const [placement, setPlacement] = useState<MetaPlacement>("ig_feed");
  const [styleModifier, setStyleModifier] = useState<StyleModifier>("none");
  const [buttonLabel, setButtonLabel] = useState<string>(VIDEO_AD_BUTTON_LABELS[0]);
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    generateVideoAd,
    startRender,
    saveToVault,
    addToScheduler,
    reset,
    isGenerating,
    isRendering,
    renderProgress,
    output,
    renderedUrl,
    error,
  } = useMetaVideoAdGenerator();

  const handleGenerate = async () => {
    if (!videoUrl) {
      toast.error("Please select a video first");
      return;
    }

    await generateVideoAd({
      videoUrl,
      placement,
      organizationId,
      styleModifier,
      autoRender: false,
    });
  };

  const handleStartRender = async () => {
    if (!videoUrl || !output) return;

    await startRender(
      videoUrl,
      output.timeline.hook_text,
      output.timeline.cta_text,
      organizationId
    );
  };

  const handleSaveToVault = async () => {
    if (!renderedUrl || !output || !organizationId) {
      toast.error("No rendered video to save");
      return;
    }

    await saveToVault(
      renderedUrl,
      placement,
      output.ad_copy.headlines[0],
      output.ad_copy.cta,
      organizationId
    );
  };

  const handleAddToScheduler = async () => {
    if (!output || !videoUrl) return;
    await addToScheduler(output, videoUrl, organizationId);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleExportJson = () => {
    if (!output) return;
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-ad-${placement}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  };

  const currentAngle = output?.ad_copy.angles[selectedAngle];

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="w-5 h-5 text-primary" />
            Video Ad Fast Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {videoUrl ? (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                poster={videoThumbnail}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No video selected</p>
            </div>
          )}

          {/* Placement Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Placement</label>
            <MetaAdFormatPicker
              selected={placement as MetaPlacement | null}
              onSelect={(p) => setPlacement(p)}
            />
          </div>

          {/* Style Modifier */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Creative Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setStyleModifier(style.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm transition-all",
                    styleModifier === style.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <span className="font-medium">{style.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {STYLE_OPTIONS.find((s) => s.value === styleModifier)?.description}
            </p>
          </div>

          {/* Generate Button with Variants */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !videoUrl}
              className="flex-1 bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {buttonLabel}
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {VIDEO_AD_BUTTON_LABELS.map((label) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => setButtonLabel(label)}
                    className={cn(buttonLabel === label && "bg-primary/10")}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Analyzing video and generating ad copy...</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={reset} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Output */}
      {output && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview Frame */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <MetaAdPreviewFrame
                  placement={placement}
                  mediaUrl={renderedUrl || videoUrl}
                  caption={currentAngle?.primary_text}
                />
              </CardContent>
            </Card>

            {/* Ad Copy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ad Copy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Angle Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ad Angle</label>
                  <div className="flex flex-wrap gap-2">
                    {output.ad_copy.angles.map((angle, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedAngle(idx)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs transition-all",
                          selectedAngle === idx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {angle.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Primary Text</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(currentAngle?.primary_text || "", "primary")}
                    >
                      {copiedField === "primary" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm bg-muted p-3 rounded-lg">{currentAngle?.primary_text}</p>
                </div>

                {/* Headline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Headline</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(currentAngle?.headline || "", "headline")}
                    >
                      {copiedField === "headline" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm font-medium bg-muted p-3 rounded-lg">
                    {currentAngle?.headline}
                  </p>
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">CTA</label>
                  <Badge variant="secondary" className="text-sm">
                    {output.ad_copy.cta}
                  </Badge>
                </div>

                {/* All Headlines */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">All Headlines</label>
                  <div className="flex flex-wrap gap-2">
                    {output.ad_copy.headlines.slice(0, 6).map((h, i) => (
                      <button
                        key={i}
                        onClick={() => handleCopy(h, `h-${i}`)}
                        className="text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
                      >
                        {copiedField === `h-${i}` ? <Check className="w-3 h-3 inline" /> : h}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Video Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hook Recommendation</p>
                  <p className="text-sm">{output.video_analysis.hook_recommendation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Thumbnail</p>
                  <p className="text-sm">{output.video_analysis.thumbnail_recommendation}</p>
                </div>
              </div>
              {output.video_analysis.key_moments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Key Moments</p>
                  <div className="flex flex-wrap gap-2">
                    {output.video_analysis.key_moments.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {m.timestamp}s: {m.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Render & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Render Progress */}
              {isRendering && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">Rendering video ad...</span>
                  </div>
                  <Progress value={renderProgress} className="h-2" />
                </div>
              )}

              {/* Rendered Result */}
              {renderedUrl && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 font-medium">Video ad rendered!</p>
                  <a
                    href={renderedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    View rendered video
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleStartRender}
                  disabled={isRendering || !output}
                  variant="default"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Render Video
                </Button>

                <Button onClick={handleAddToScheduler} variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Scheduler
                </Button>

                <Button
                  onClick={handleSaveToVault}
                  variant="outline"
                  disabled={!renderedUrl}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save to Vault
                </Button>

                <Button onClick={handleExportJson} variant="outline">
                  <FileJson className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>

                {renderedUrl && (
                  <Button variant="outline" asChild>
                    <a href={renderedUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
