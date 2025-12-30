import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Type, Loader2, Sparkles, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Caption,
  CaptionStyle,
  CaptionSettings,
  CAPTION_STYLE_CONFIGS,
} from "@/hooks/useReelCaptions";

interface CaptionsPanelProps {
  captions: Caption[];
  settings: CaptionSettings;
  loading: boolean;
  onGenerateCaptions: (style: CaptionStyle) => void;
  onUpdateSettings: (updates: Partial<CaptionSettings>) => void;
  onRemoveCaption: (id: string) => void;
  jobId?: string; // video_edit_queue id for overlay approval
  scenes?: Array<{ sceneId: string; text?: string; start: number; end: number; textPosition?: string; animation?: string }>;
  onOverlaysApproved?: () => void;
}

export function CaptionsPanel({
  captions,
  settings,
  loading,
  onGenerateCaptions,
  onUpdateSettings,
  onRemoveCaption,
  jobId,
  scenes = [],
  onOverlaysApproved,
}: CaptionsPanelProps) {
  const [approving, setApproving] = useState(false);
  const [approvedSceneIds, setApprovedSceneIds] = useState<Set<string>>(new Set());
  const styles: CaptionStyle[] = ["sabri", "dara", "clean"];

  // Scenes with text overlays
  const scenesWithText = scenes.filter(s => s.text);
  const allApproved = scenesWithText.length > 0 && scenesWithText.every(s => approvedSceneIds.has(s.sceneId));

  const handleApproveAllOverlays = async () => {
    if (!jobId || scenesWithText.length === 0) {
      toast.error("No overlays to approve or missing job ID");
      return;
    }

    setApproving(true);
    try {
      // Insert all scene overlays as approved
      const overlaysToInsert = scenesWithText.map(scene => ({
        job_id: jobId,
        scene_id: scene.sceneId,
        text: scene.text!,
        position: scene.textPosition || 'center',
        animation: scene.animation || 'pop',
        start_time: scene.start,
        end_time: scene.end,
        approved: true,
        approved_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("scene_text_overlays")
        .upsert(overlaysToInsert, { onConflict: 'job_id,scene_id' });

      if (error) throw error;

      setApprovedSceneIds(new Set(scenesWithText.map(s => s.sceneId)));
      toast.success(`${scenesWithText.length} text overlays approved for rendering`);
      onOverlaysApproved?.();
    } catch (err) {
      console.error("[CaptionsPanel] Approve overlays error:", err);
      toast.error("Failed to approve overlays");
    } finally {
      setApproving(false);
    }
  };

  const handleApproveOne = async (scene: typeof scenes[0]) => {
    if (!jobId || !scene.text) return;

    try {
      const { error } = await supabase
        .from("scene_text_overlays")
        .upsert({
          job_id: jobId,
          scene_id: scene.sceneId,
          text: scene.text,
          position: scene.textPosition || 'center',
          animation: scene.animation || 'pop',
          start_time: scene.start,
          end_time: scene.end,
          approved: true,
          approved_at: new Date().toISOString(),
        }, { onConflict: 'job_id,scene_id' });

      if (error) throw error;

      setApprovedSceneIds(prev => new Set([...prev, scene.sceneId]));
      toast.success("Overlay approved");
    } catch (err) {
      console.error("[CaptionsPanel] Approve overlay error:", err);
      toast.error("Failed to approve overlay");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Type className="w-4 h-4" />
          Auto Captions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Blueprint Scene Overlays - Approve Section */}
        {jobId && scenesWithText.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Scene Text Overlays</span>
              <Button
                size="sm"
                variant={allApproved ? "secondary" : "default"}
                disabled={approving || allApproved}
                onClick={handleApproveAllOverlays}
                className="h-7 text-xs"
              >
                {approving ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : allApproved ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : null}
                {allApproved ? "All Approved" : `Approve All (${scenesWithText.length})`}
              </Button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {scenesWithText.map((scene) => (
                <div
                  key={scene.sceneId}
                  className={cn(
                    "flex items-center justify-between p-1.5 rounded text-xs",
                    approvedSceneIds.has(scene.sceneId)
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-muted/50"
                  )}
                >
                  <span className="truncate flex-1 font-medium">{scene.text}</span>
                  {approvedSceneIds.has(scene.sceneId) ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-2" />
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-2 text-[10px]"
                      onClick={() => handleApproveOne(scene)}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style selector */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Caption Style</label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => onUpdateSettings({ style })}
                className={cn(
                  "p-2 rounded-lg border text-xs text-center transition-all",
                  settings.style === style
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="font-medium block">{CAPTION_STYLE_CONFIGS[style].name}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {CAPTION_STYLE_CONFIGS[settings.style].description}
          </p>
        </div>

        {/* Generate button */}
        <Button
          className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
          onClick={() => onGenerateCaptions(settings.style)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Captions
            </>
          )}
        </Button>

        {/* Caption preview */}
        {captions.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {captions.map((caption) => (
              <div
                key={caption.id}
                className="p-2 rounded-lg bg-muted/50 border border-border group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm",
                        caption.style === "sabri" && "font-bold uppercase",
                        caption.style === "dara" && "italic"
                      )}
                    >
                      {caption.text}
                      {caption.emoji && <span className="ml-1">{caption.emoji}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {caption.start.toFixed(1)}s - {caption.end.toFixed(1)}s
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveCaption(caption.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Position selector */}
        {captions.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Position</label>
            <div className="grid grid-cols-3 gap-1">
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onUpdateSettings({ position: pos })}
                  className={cn(
                    "py-1.5 px-2 rounded text-[10px] capitalize transition-all",
                    settings.position === pos
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
