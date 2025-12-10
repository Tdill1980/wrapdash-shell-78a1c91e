import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Wand2,
  Music,
  Type,
  Sparkles,
  GripVertical,
  Trash2,
  Clock,
  Zap,
  Palette,
  Layers,
  Scissors,
  Loader2,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReelBeatSync } from "@/hooks/useReelBeatSync";
import { useReelCaptions, CaptionStyle } from "@/hooks/useReelCaptions";
import { useReelOverlays, BrandPackId } from "@/hooks/useReelOverlays";
import { useEditorBrain } from "@/hooks/useEditorBrain";
import { useSmartAssist } from "@/hooks/useSmartAssist";
import { BeatSyncPanel } from "@/components/reel/BeatSyncPanel";
import { CaptionsPanel } from "@/components/reel/CaptionsPanel";
import { BrandOverlayPanel } from "@/components/reel/BrandOverlayPanel";
import { SmartAssistPanel } from "@/components/reel-builder/SmartAssistPanel";
import { MediaLibraryModal } from "@/components/media/MediaLibraryModal";
import { MediaFile } from "@/components/media/MediaLibrary";
import { toast } from "sonner";

interface Clip {
  id: string;
  name: string;
  url: string;
  duration: number;
  thumbnail?: string;
  trimStart: number;
  trimEnd: number;
  speed?: number;
  hookScore?: number;
  energyLevel?: number;
  suggestedOverlay?: string;
  reason?: string;
}

interface AutoCreateState {
  autoCreatedClips?: Array<{
    id: string;
    order: number;
    trim_start: number;
    trim_end: number;
    reason?: string;
    suggested_overlay?: string;
    file_url?: string;
    thumbnail_url?: string;
    original_filename?: string;
    duration_seconds?: number;
  }>;
  reelConcept?: string;
  suggestedHook?: string;
  suggestedCta?: string;
  musicVibe?: string;
  autoRunSmartAssist?: boolean;
}

export default function ReelBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const autoCreateState = location.state as AutoCreateState | undefined;

  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("clip");
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [reelConcept, setReelConcept] = useState<string | null>(null);

  const beatSync = useReelBeatSync();
  const captionsEngine = useReelCaptions();
  const overlaysEngine = useReelOverlays();
  const editorBrain = useEditorBrain();
  const smartAssist = useSmartAssist();

  // Handle auto-created clips from ContentBox
  useEffect(() => {
    if (autoCreateState?.autoCreatedClips && autoCreateState.autoCreatedClips.length > 0) {
      const newClips: Clip[] = autoCreateState.autoCreatedClips
        .sort((a, b) => a.order - b.order)
        .map((ac) => ({
          id: ac.id,
          name: ac.original_filename || `Clip ${ac.order}`,
          url: ac.file_url || "",
          duration: ac.duration_seconds || 10,
          thumbnail: ac.thumbnail_url,
          trimStart: ac.trim_start || 0,
          trimEnd: ac.trim_end || (ac.duration_seconds || 10),
          speed: 1,
          suggestedOverlay: ac.suggested_overlay,
          reason: ac.reason,
        }));

      setClips(newClips);
      setReelConcept(autoCreateState.reelConcept || null);

      toast.success(`AI loaded ${newClips.length} clips for your reel!`, {
        description: autoCreateState.reelConcept,
      });

      // Auto-run Smart Assist if requested
      if (autoCreateState.autoRunSmartAssist && newClips.length > 0) {
        setTimeout(() => {
          smartAssist.runSmartAssist(newClips);
        }, 500);
      }

      // Clear location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [autoCreateState]);

  const handleRunSmartAssist = async () => {
    await smartAssist.runSmartAssist(clips);
  };

  const handleApplyAIPlan = () => {
    if (!smartAssist.creative) return;

    const newClips: Clip[] = smartAssist.creative.sequence.map((seq, idx) => {
      const originalClip = clips[idx] || clips[0];
      return {
        ...originalClip,
        id: originalClip?.id || `ai_${idx}`,
        name: seq.label?.replace(/_/g, " ") || `Scene ${idx + 1}`,
        url: originalClip?.url || clips[0].url,
        duration: seq.end - seq.start,
        trimStart: seq.start,
        trimEnd: seq.end,
        speed: seq.speed || 1,
      };
    });

    setClips(newClips);
    toast.success("AI Timeline Applied!");
  };

  const handleAddClipsFromLibrary = (files: MediaFile[]) => {
    const videoFiles = files.filter((f) => f.file_type === "video");
    const newClips: Clip[] = videoFiles.map((file) => ({
      id: file.id,
      name: file.original_filename || "Untitled",
      url: file.file_url,
      duration: file.duration_seconds || 10,
      thumbnail: file.thumbnail_url || undefined,
      trimStart: 0,
      trimEnd: file.duration_seconds || 10,
      speed: 1,
    }));
    setClips((prev) => [...prev, ...newClips]);
    toast.success(`Added ${newClips.length} clip(s)`);
  };

  const handleRemoveClip = (id: string) => {
    setClips(clips.filter((c) => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  const handleAnalyzeBeats = async () => {
    if (!audioUrl) return;
    const result = await beatSync.analyzeMusic(audioUrl);
    if (result) {
      toast.success(`Detected ${result.bpm} BPM with ${result.beats.length} beats`);
    }
  };

  const handleApplyBeatSync = () => {
    const syncedClips = beatSync.applyBeatSync(clips);
    setClips(syncedClips as Clip[]);
    toast.success("Beat sync applied to clips!");
  };

  const handleGenerateCaptions = async (style: CaptionStyle) => {
    const captions = await captionsEngine.generateCaptions("", style);
    if (captions.length > 0) {
      toast.success(`Generated ${captions.length} captions`);
    }
  };

  const handleApplyBrandPack = (packId: BrandPackId) => {
    overlaysEngine.applyBrandPack(packId, totalDuration);
    toast.success(`Applied ${packId.toUpperCase()} overlay pack`);
  };

  const totalDuration = clips.reduce(
    (acc, clip) => acc + (clip.trimEnd - clip.trimStart) / (clip.speed || 1),
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => editorBrain.extractBestScenes(clips, setClips)}
              disabled={clips.length === 0 || editorBrain.isAnalyzing}
            >
              <Scissors className="w-4 h-4 mr-1.5" />
              Best Scenes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => editorBrain.autoSequence(clips, setClips)}
              disabled={clips.length < 2 || editorBrain.isSequencing}
            >
              {editorBrain.isSequencing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Layers className="w-4 h-4 mr-1.5" />
              )}
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
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
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
                  <Button size="sm" variant="outline" onClick={() => setShowLibraryModal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Clips
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clips.length === 0 ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowLibraryModal(true)}
                  >
                    <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to add clips</p>
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Assist Panel */}
            <SmartAssistPanel
              analysis={smartAssist.analysis}
              creative={smartAssist.creative}
              loading={smartAssist.loading}
              onRunAnalysis={handleRunSmartAssist}
              onApply={handleApplyAIPlan}
              hasClips={clips.length > 0}
            />
          </div>

          {/* Right: Editor Panels */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="ai" className="text-xs"><Brain className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="clip" className="text-xs"><Wand2 className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="audio" className="text-xs"><Music className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="captions" className="text-xs"><Type className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="overlays" className="text-xs"><Palette className="w-3 h-3" /></TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="mt-4">
                <SmartAssistPanel
                  analysis={smartAssist.analysis}
                  creative={smartAssist.creative}
                  loading={smartAssist.loading}
                  onRunAnalysis={handleRunSmartAssist}
                  onApply={handleApplyAIPlan}
                  hasClips={clips.length > 0}
                />
              </TabsContent>

              <TabsContent value="clip" className="mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">{selectedClip ? "Edit Clip" : "Select Clip"}</CardTitle></CardHeader>
                  <CardContent>
                    {selectedClip ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground">Speed</label>
                          <div className="flex gap-2 mt-1">
                            {["0.5x", "1x", "1.5x", "2x"].map((speed) => (
                              <Button key={speed} size="sm" variant={speed === "1x" ? "default" : "outline"} className="flex-1">{speed}</Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Select a clip to edit</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audio" className="mt-4">
                <BeatSyncPanel audioUrl={audioUrl} beats={beatSync.beats} bpm={beatSync.bpm} loading={beatSync.loading} onSelectAudio={() => setAudioUrl("https://example.com/audio.mp3")} onAnalyze={handleAnalyzeBeats} onApplyBeatSync={handleApplyBeatSync} />
              </TabsContent>

              <TabsContent value="captions" className="mt-4">
                <CaptionsPanel captions={captionsEngine.captions} settings={captionsEngine.settings} loading={captionsEngine.loading} onGenerateCaptions={handleGenerateCaptions} onUpdateSettings={captionsEngine.updateSettings} onRemoveCaption={captionsEngine.removeCaption} />
              </TabsContent>

              <TabsContent value="overlays" className="mt-4">
                <BrandOverlayPanel overlays={overlaysEngine.overlays} activePack={overlaysEngine.activePack} totalDuration={totalDuration} onApplyPack={handleApplyBrandPack} onAddOverlay={() => overlaysEngine.addOverlay({ text: "Custom", style: "modern", position: "center", start: 0, end: 3, color: "#E1306C" })} onRemoveOverlay={overlaysEngine.removeOverlay} onClearOverlays={overlaysEngine.clearOverlays} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        multiSelect
        onMultiSelect={handleAddClipsFromLibrary}
        filterType="video"
      />
    </div>
  );
}
