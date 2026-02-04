import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Link2,
  Sparkles,
  Zap,
  Clock,
  Type,
  Palette,
  Play,
  Copy,
  Check,
  Download,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { copyToClipboard, downloadAsJson, generateFilename } from "@/lib/downloadUtils";

interface StyleAnalysis {
  styleName?: string;
  pacing?: {
    cutsPerSecond?: number;
    averageClipLength?: number;
    rhythm?: string;
  };
  color?: {
    palette?: string[];
    mood?: string;
    saturation?: string;
    contrast?: string;
  };
  structure?: {
    hook?: { duration: number; style: string };
    body?: { duration: number; style: string };
    cta?: { duration: number; style: string };
  };
  overlays?: {
    textStyle?: string;
    fontSize?: string;
    fontWeight?: string;
    position?: string;
    animation?: string;
  };
  typography?: {
    font_headline?: string;
    font_body?: string;
    font_weight?: string;
    text_case?: string;
  };
  hooks?: string[];
  cta?: string;
  music?: {
    genre?: string;
    energy?: string;
    bpm?: number;
  };
  transitions?: string[];
}

export default function InspoScrubber() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [copiedOverlays, setCopiedOverlays] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      // Detect platform from URL
      let platform = "unknown";
      if (url.includes("instagram.com") || url.includes("instagr.am")) {
        platform = "instagram";
      } else if (url.includes("tiktok.com")) {
        platform = "tiktok";
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        platform = "youtube";
      }

      const { data, error } = await lovableFunctions.functions.invoke("analyze-inspo-video", {
        body: { 
          videoUrl: url, 
          platform 
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("Style analysis complete!");
      } else {
        throw new Error("No analysis returned");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      toast.error("Failed to analyze video. Please try a different URL.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToVideo = () => {
    if (!analysis) return;
    navigate("/organic/reel-builder", { 
      state: { 
        styleAnalysis: analysis,
        sourceUrl: url 
      } 
    });
  };

  const handleCopyOverlays = async () => {
    if (!analysis?.hooks || analysis.hooks.length === 0) {
      toast.error("No overlay texts to copy");
      return;
    }
    const overlayText = analysis.hooks.join("\n");
    await copyToClipboard(overlayText, "Overlay texts copied!");
    setCopiedOverlays(true);
    setTimeout(() => setCopiedOverlays(false), 2000);
  };

  const handleSaveStyle = async () => {
    if (!analysis) return;
    setSaving(true);
    
    try {
      // Save to inspo_analyses table
      const { error } = await supabase.from("inspo_analyses").insert({
        source_url: url,
        platform: url.includes("instagram") ? "instagram" : url.includes("tiktok") ? "tiktok" : "other",
        analysis_data: analysis as any,
        title: (analysis as any).styleName || `Style - ${new Date().toLocaleDateString()}`,
      });

      if (error) throw error;
      toast.success("Style saved to library!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save style");
    } finally {
      setSaving(false);
    }
  };

  const handleExportStyle = () => {
    if (!analysis) return;
    downloadAsJson(analysis, generateFilename("style-preset", "json"));
  };

  // Compute display values from analysis
  const energyLevel = analysis?.pacing?.rhythm === "fast" ? 3 : analysis?.pacing?.rhythm === "medium" ? 2 : 1;
  const pacingText = analysis?.pacing?.averageClipLength 
    ? `${analysis.pacing.rhythm || "Medium"} cuts every ${analysis.pacing.averageClipLength}s`
    : "Medium pacing";
  const fontStyle = analysis?.typography 
    ? `${analysis.typography.font_headline || "Bold"} ${analysis.typography.text_case || ""}`
    : "Bold uppercase";
  const colorPalette = analysis?.color?.palette || ["#E1306C", "#405DE6", "#FFFFFF"];
  const hooks = analysis?.hooks || [];
  const structure = analysis?.structure 
    ? [
        { time: `0-${analysis.structure.hook?.duration || 3}s`, label: analysis.structure.hook?.style || "Hook" },
        { time: `${analysis.structure.hook?.duration || 3}-${(analysis.structure.hook?.duration || 3) + (analysis.structure.body?.duration || 10)}s`, label: analysis.structure.body?.style || "Body" },
        { time: `${(analysis.structure.hook?.duration || 3) + (analysis.structure.body?.duration || 10)}s+`, label: analysis.structure.cta?.style || "CTA" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organic")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Inspo Scrubber</h1>
              <p className="text-xs text-muted-foreground">
                Clone the style of any viral reel
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* URL Input */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Paste Instagram, TikTok, or YouTube URL</span>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="https://www.instagram.com/reel/... or https://www.tiktok.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAnalyze}
                disabled={!url || isAnalyzing}
                className="bg-gradient-to-r from-[#405DE6] to-[#E1306C] min-w-[140px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Style
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Style Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Style Identified
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#405DE6] to-[#E1306C] bg-clip-text text-transparent">
                    {analysis.styleName || "Custom Style"}
                  </span>
                  <Badge variant="secondary">
                    <Zap className="w-3 h-3 mr-1" />
                    {energyLevel === 3 ? "High" : energyLevel === 2 ? "Medium" : "Low"} Energy
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" />
                      Pacing
                    </div>
                    <p className="text-sm font-medium">{pacingText}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Type className="w-3 h-3" />
                      Font Style
                    </div>
                    <p className="text-sm font-medium">{fontStyle}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Palette className="w-3 h-3" />
                    Color Theme
                  </div>
                  <div className="flex gap-2">
                    {colorPalette.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => copyToClipboard(color, `Copied ${color}`)}
                      />
                    ))}
                  </div>
                </div>

                {structure.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Structure</h4>
                    <div className="space-y-2">
                      {structure.map((segment, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          <span className="text-xs text-muted-foreground w-16">
                            {segment.time}
                          </span>
                          <span className="text-sm font-medium">{segment.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.music && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">Music</div>
                    <p className="text-sm font-medium">
                      {analysis.music.genre} • {analysis.music.energy} energy • {analysis.music.bpm} BPM
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overlays & Actions */}
            <div className="space-y-4">
              {hooks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Example Overlays / Hooks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {hooks.map((overlay, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-full bg-black text-white text-sm font-bold border border-white/20"
                        >
                          {overlay}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Apply This Style</h3>
                  <Button 
                    className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                    onClick={handleApplyToVideo}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Apply to My Video
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleCopyOverlays}
                    disabled={hooks.length === 0}
                  >
                    {copiedOverlays ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedOverlays ? "Copied!" : "Copy Overlay Texts"}
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex-1"
                      onClick={handleSaveStyle}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save to Library
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex-1"
                      onClick={handleExportStyle}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[9/16] max-h-[300px] mx-auto bg-black rounded-2xl border-4 border-gray-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/50" />
                    </div>
                    {/* Safe zone indicator */}
                    <div className="absolute inset-4 border-2 border-dashed border-yellow-500/30 rounded-lg" />
                    
                    {/* Show extracted colors as overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1">
                      {colorPalette.slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
