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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleAnalysis {
  styleName: string;
  energy: number;
  pacing: string;
  font: string;
  colorTheme: string[];
  structure: Array<{ time: string; label: string }>;
  overlays: string[];
}

export default function InspoScrubber() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    
    // Simulated analysis result
    await new Promise((r) => setTimeout(r, 2000));
    
    setAnalysis({
      styleName: "High-Energy Reveal",
      energy: 3,
      pacing: "Fast cuts every 0.8s",
      font: "Bold uppercase, white with shadow",
      colorTheme: ["#E1306C", "#405DE6", "#FFFFFF"],
      structure: [
        { time: "0-1.2s", label: "Hook" },
        { time: "1.2-4s", label: "B-roll body" },
        { time: "4-5s", label: "Reveal" },
      ],
      overlays: ["WAIT FOR IT…", "FINAL LOOK 🔥", "BEFORE → AFTER"],
    });
    setIsAnalyzing(false);
  };

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
              <span className="font-medium">Paste Instagram or TikTok URL</span>
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
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
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
                    {analysis.styleName}
                  </span>
                  <Badge variant="secondary">
                    <Zap className="w-3 h-3 mr-1" />
                    {analysis.energy === 3 ? "High" : analysis.energy === 2 ? "Medium" : "Low"} Energy
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" />
                      Pacing
                    </div>
                    <p className="text-sm font-medium">{analysis.pacing}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Type className="w-3 h-3" />
                      Font Style
                    </div>
                    <p className="text-sm font-medium">{analysis.font}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Palette className="w-3 h-3" />
                    Color Theme
                  </div>
                  <div className="flex gap-2">
                    {analysis.colorTheme.map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Structure</h4>
                  <div className="space-y-2">
                    {analysis.structure.map((segment, i) => (
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
              </CardContent>
            </Card>

            {/* Overlays & Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Example Overlays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.overlays.map((overlay, i) => (
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

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Apply This Style</h3>
                  <Button className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                    <Play className="w-4 h-4 mr-2" />
                    Apply to My Video
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Overlay Texts
                  </Button>
                  <Button variant="ghost" className="w-full">
                    Save Style to Library
                  </Button>
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
