import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Scissors,
  Wand2,
  Music,
  Type,
  Sparkles,
  GripVertical,
  Trash2,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Clip {
  id: string;
  name: string;
  duration: number;
  thumbnail?: string;
  trimStart: number;
  trimEnd: number;
}

export default function ReelBuilder() {
  const navigate = useNavigate();
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAddClips = () => {
    // Placeholder - will trigger file picker
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      name: `Clip ${clips.length + 1}`,
      duration: 5,
      trimStart: 0,
      trimEnd: 5,
    };
    setClips([...clips, newClip]);
  };

  const handleRemoveClip = (id: string) => {
    setClips(clips.filter((c) => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  const totalDuration = clips.reduce(
    (acc, clip) => acc + (clip.trimEnd - clip.trimStart),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organic")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Multi-Clip Reel Builder</h1>
              <p className="text-xs text-muted-foreground">
                {clips.length} clips • {totalDuration.toFixed(1)}s total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI Sequence
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
              disabled={clips.length === 0}
            >
              Render Reel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Preview + Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview */}
            <Card>
              <CardContent className="p-4">
                <div className="aspect-[9/16] max-h-[400px] mx-auto bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                  {clips.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Add clips to preview</p>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute z-10"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timeline
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleAddClips}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Clips
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clips.length === 0 ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={handleAddClips}
                  >
                    <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to add clips or drag & drop videos here
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {clips.map((clip, index) => (
                      <div
                        key={clip.id}
                        className={cn(
                          "shrink-0 w-24 rounded-lg border-2 cursor-pointer transition-all",
                          selectedClip === clip.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedClip(clip.id)}
                      >
                        <div className="aspect-[9/16] bg-muted rounded-t-md flex items-center justify-center relative group">
                          <GripVertical className="w-4 h-4 text-muted-foreground absolute top-1 left-1 opacity-0 group-hover:opacity-100" />
                          <span className="text-xs font-medium">{index + 1}</span>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="w-5 h-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveClip(clip.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="p-1.5 text-center">
                          <p className="text-[10px] font-medium truncate">{clip.name}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {(clip.trimEnd - clip.trimStart).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    ))}
                    <div
                      className="shrink-0 w-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex items-center justify-center aspect-[9/16]"
                      onClick={handleAddClips}
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestion */}
            {clips.length >= 2 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Wand2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">AI Sequence Suggestion</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start with Clip 2 for a stronger hook, move Clip 1 to mid-section,
                        and add a "Wait for it..." overlay at 0.4s for maximum retention.
                      </p>
                      <Button size="sm" variant="secondary" className="mt-3">
                        <Zap className="w-3 h-3 mr-1" />
                        Apply AI Timeline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Clip Editor */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {selectedClip ? "Edit Clip" : "Clip Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedClip ? (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Trim Start</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Trim End</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={100}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Speed</label>
                      <div className="flex gap-2 mt-1">
                        {["0.5x", "1x", "1.5x", "2x"].map((speed) => (
                          <Button
                            key={speed}
                            size="sm"
                            variant={speed === "1x" ? "default" : "outline"}
                            className="flex-1"
                          >
                            {speed}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select a clip to edit
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Audio & Overlays</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Music className="w-4 h-4 mr-2" />
                  Add Music Track
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Type className="w-4 h-4 mr-2" />
                  Add Text Overlay
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply Inspo Style
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
