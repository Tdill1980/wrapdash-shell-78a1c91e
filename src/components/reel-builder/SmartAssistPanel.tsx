import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wand2,
  Sparkles,
  Scissors,
  Clock,
  Zap,
  MessageSquare,
  Target,
  Music,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";
import { VideoAnalysis } from "@/lib/editor-brain/videoAnalyzer";
import { CreativeAssembly, CreativeSequence } from "@/lib/editor-brain/creativeAssembler";
import { cn } from "@/lib/utils";

interface SmartAssistPanelProps {
  analysis: VideoAnalysis | null;
  creative: CreativeAssembly | null;
  loading: boolean;
  onRunAnalysis: () => void;
  onApply: () => void;
  hasClips: boolean;
}

export function SmartAssistPanel({
  analysis,
  creative,
  loading,
  onRunAnalysis,
  onApply,
  hasClips,
}: SmartAssistPanelProps) {
  if (loading) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative p-4 rounded-full bg-primary/10">
                <Wand2 className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium">Analyzing clips...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Detecting hooks, scenes, and transformations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || !creative) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Smart Assist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI analyzes your clips to find the best hooks, sequences, and
            overlay placements.
          </p>
          <Button
            onClick={onRunAnalysis}
            disabled={!hasClips}
            className="w-full"
            variant="default"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Run Smart Assist
          </Button>
          {!hasClips && (
            <p className="text-xs text-muted-foreground text-center">
              Add clips first to enable analysis
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const energyColors = {
    low: "bg-blue-500/20 text-blue-600",
    medium: "bg-yellow-500/20 text-yellow-600",
    high: "bg-red-500/20 text-red-600",
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            Smart Assist Results
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Check className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Rating */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Content Score</span>
          </div>
          <span className="text-lg font-bold text-primary">
            {analysis.content_rating || 75}/100
          </span>
        </div>

        {/* Energy & Style */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Energy
            </p>
            <Badge
              className={cn(
                "mt-1 capitalize",
                energyColors[analysis.energy_level || "medium"]
              )}
            >
              <Zap className="w-3 h-3 mr-1" />
              {analysis.energy_level || "medium"}
            </Badge>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Template
            </p>
            <p className="text-xs font-medium mt-1 truncate">
              {creative.template_style.replace(/-/g, " ")}
            </p>
          </div>
        </div>

        <Separator />

        {/* Hook */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            Recommended Hook
          </div>
          <p className="text-sm font-semibold text-primary bg-primary/10 p-2 rounded-lg">
            "{creative.hook}"
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3 h-3" />
            Call to Action
          </div>
          <p className="text-sm font-medium">{creative.cta}</p>
        </div>

        {/* Music Suggestion */}
        {creative.music_suggestion && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs">{creative.music_suggestion}</span>
          </div>
        )}

        <Separator />

        {/* Scene Sequence */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scissors className="w-3 h-3" />
            AI Scene Sequence ({creative.sequence.length} scenes)
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {creative.sequence.slice(0, 5).map((scene, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="flex-1 capitalize">
                  {scene.label?.replace(/_/g, " ") || "Scene"}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {scene.start.toFixed(1)}s - {scene.end.toFixed(1)}s
                </span>
              </div>
            ))}
            {creative.sequence.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                +{creative.sequence.length - 5} more scenes
              </p>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <Button
          onClick={onApply}
          className="w-full bg-gradient-to-r from-primary to-[#E1306C] hover:opacity-90"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Apply AI Plan to Timeline
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>

        {/* Rationale */}
        {creative.creative_rationale && (
          <p className="text-[10px] text-muted-foreground text-center">
            {creative.creative_rationale}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
