import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Target, Zap } from "lucide-react";

interface HybridModeSelectorProps {
  mode: 'auto' | 'hybrid' | 'exact';
  setMode: (mode: 'auto' | 'hybrid' | 'exact') => void;
  hybridBrief: string;
  setHybridBrief: (brief: string) => void;
  contentType: string;
  setContentType: (type: string) => void;
  references: string;
  setReferences: (refs: string) => void;
  assets: string;
  setAssets: (assets: string) => void;
}

export function HybridModeSelector({
  mode,
  setMode,
  hybridBrief,
  setHybridBrief,
  contentType,
  setContentType,
  references,
  setReferences,
  assets,
  setAssets,
}: HybridModeSelectorProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Content Mode</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* MODE TOGGLE */}
        <div className="flex gap-2">
          <Button
            variant={mode === "auto" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("auto")}
            className={mode === "auto" ? "bg-gradient-to-r from-[#405DE6] to-[#E1306C]" : ""}
          >
            <Wand2 className="w-4 h-4 mr-1" />
            Auto
          </Button>
          <Button
            variant={mode === "hybrid" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("hybrid")}
            className={mode === "hybrid" ? "bg-gradient-to-r from-[#405DE6] to-[#E1306C]" : ""}
          >
            <Target className="w-4 h-4 mr-1" />
            Hybrid
          </Button>
          <Button
            variant={mode === "exact" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("exact")}
            className={mode === "exact" ? "bg-gradient-to-r from-[#405DE6] to-[#E1306C]" : ""}
          >
            <Zap className="w-4 h-4 mr-1" />
            Exact
          </Button>
        </div>

        {/* Mode description */}
        <p className="text-xs text-muted-foreground">
          {mode === "auto" && "AI generates everything automatically based on your video."}
          {mode === "hybrid" && "You provide direction, AI executes the creative."}
          {mode === "exact" && "Full control - AI only enhances and renders."}
        </p>

        {/* HYBRID MODE OPTIONS */}
        {mode === "hybrid" && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            {/* Brief */}
            <div className="space-y-2">
              <Label className="text-xs">What should this content communicate?</Label>
              <Textarea
                placeholder="Ex: Promote chrome delete special. Use Tesla video. Tone: luxury."
                value={hybridBrief}
                onChange={(e) => setHybridBrief(e.target.value)}
                className="bg-background min-h-[80px]"
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label className="text-xs">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="static">Static Post</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="ad">Paid Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* References */}
            <div className="space-y-2">
              <Label className="text-xs">Reference Links (Optional)</Label>
              <Input
                placeholder="Paste Canva link, IG post, YouTube link..."
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Assets */}
            <div className="space-y-2">
              <Label className="text-xs">Additional Asset URLs (Optional)</Label>
              <Input
                placeholder="Comma-separated URLs or select from library"
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        )}

        {/* EXACT MODE OPTIONS */}
        {mode === "exact" && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="space-y-2">
              <Label className="text-xs">Exact Script / Instructions</Label>
              <Textarea
                placeholder="Enter exact script, overlay text, timing instructions..."
                value={hybridBrief}
                onChange={(e) => setHybridBrief(e.target.value)}
                className="bg-background min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="static">Static Post</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="ad">Paid Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
