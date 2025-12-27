import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Lock, Save } from "lucide-react";

interface ContentFileRow {
  id: string;
  file_type: string;
  file_url: string;
  thumbnail_url: string | null;
  original_filename: string | null;
  visual_tags: Record<string, unknown> | null;
  visual_analyzed_at: string | null;
  content_category: string | null;
  created_at: string;
}

interface VideoTags {
  has_vehicle: boolean;
  has_wrap_install: boolean;
  has_peel: boolean;
  has_finished_result: boolean;
  has_logo: boolean;
  has_person: boolean;
  environment: "shop" | "outdoor" | "unknown";
  dominant_motion: "static" | "hand_install" | "peel_motion" | "camera_pan";
  quality_score: number;
}

interface ImageTags {
  has_vehicle: boolean;
  wrap_type: "full" | "partial" | "accent" | "unknown";
  finish: "gloss" | "matte" | "satin" | "unknown";
  has_logo: boolean;
  environment: "shop" | "outdoor" | "studio" | "unknown";
  quality_score: number;
}

interface ManualTagEditorModalProps {
  contentFile: ContentFileRow;
  onClose: () => void;
  onSaved: () => void;
}

const defaultVideoTags: VideoTags = {
  has_vehicle: false,
  has_wrap_install: false,
  has_peel: false,
  has_finished_result: false,
  has_logo: false,
  has_person: false,
  environment: "unknown",
  dominant_motion: "static",
  quality_score: 50,
};

const defaultImageTags: ImageTags = {
  has_vehicle: false,
  wrap_type: "unknown",
  finish: "unknown",
  has_logo: false,
  environment: "unknown",
  quality_score: 50,
};

export function ManualTagEditorModal({
  contentFile,
  onClose,
  onSaved,
}: ManualTagEditorModalProps) {
  const isVideo = contentFile.file_type === "video";
  const [isSaving, setIsSaving] = useState(false);
  const [lockAsset, setLockAsset] = useState(true);

  const [videoTags, setVideoTags] = useState<VideoTags>(defaultVideoTags);
  const [imageTags, setImageTags] = useState<ImageTags>(defaultImageTags);

  useEffect(() => {
    const existing = contentFile.visual_tags;
    if (!existing) return;

    if (isVideo && existing.video) {
      const v = existing.video as Partial<VideoTags>;
      setVideoTags({
        has_vehicle: v.has_vehicle ?? false,
        has_wrap_install: v.has_wrap_install ?? false,
        has_peel: v.has_peel ?? false,
        has_finished_result: v.has_finished_result ?? false,
        has_logo: v.has_logo ?? false,
        has_person: v.has_person ?? false,
        environment: v.environment ?? "unknown",
        dominant_motion: v.dominant_motion ?? "static",
        quality_score: v.quality_score ?? 50,
      });
    } else if (!isVideo && existing.image) {
      const i = existing.image as Partial<ImageTags>;
      setImageTags({
        has_vehicle: i.has_vehicle ?? false,
        wrap_type: i.wrap_type ?? "unknown",
        finish: i.finish ?? "unknown",
        has_logo: i.has_logo ?? false,
        environment: i.environment ?? "unknown",
        quality_score: i.quality_score ?? 50,
      });
    }

    // Check if already locked
    const meta = existing.meta as Record<string, unknown> | undefined;
    if (meta?.manual_override === true) {
      setLockAsset(true);
    }
  }, [contentFile, isVideo]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const existingVisualTags = (contentFile.visual_tags || {}) as Record<string, unknown>;
      const existingMeta = (existingVisualTags.meta || {}) as Record<string, unknown>;

      const updatedVisualTags: Record<string, unknown> = {
        ...existingVisualTags,
        [contentFile.file_type]: isVideo ? videoTags : imageTags,
        meta: {
          ...existingMeta,
          manual_override: lockAsset,
          last_manual_edit: new Date().toISOString(),
        },
      };

      const updatePayload: Record<string, unknown> = {
        visual_tags: updatedVisualTags,
      };
      
      if (lockAsset) {
        updatePayload.analysis_confidence = 1.0;
      }

      const { error } = await supabase
        .from("content_files")
        .update(updatePayload)
        .eq("id", contentFile.id);

      if (error) throw error;

      toast.success(lockAsset ? "Tags saved and asset locked" : "Tags saved");
      onSaved();
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save tags");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tags: {contentFile.original_filename || "Asset"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          {contentFile.thumbnail_url && (
            <div className="flex justify-center">
              <img
                src={contentFile.thumbnail_url}
                alt="Preview"
                className="max-h-32 rounded border"
              />
            </div>
          )}

          {isVideo ? (
            // Video Tags
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Video Tags
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Has Vehicle</Label>
                  <Switch
                    checked={videoTags.has_vehicle}
                    onCheckedChange={(c) => setVideoTags((t) => ({ ...t, has_vehicle: c }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Has Wrap Install</Label>
                  <Switch
                    checked={videoTags.has_wrap_install}
                    onCheckedChange={(c) => setVideoTags((t) => ({ ...t, has_wrap_install: c }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Has Peel</Label>
                  <Switch
                    checked={videoTags.has_peel}
                    onCheckedChange={(c) => setVideoTags((t) => ({ ...t, has_peel: c }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Has Finished Result</Label>
                  <Switch
                    checked={videoTags.has_finished_result}
                    onCheckedChange={(c) => setVideoTags((t) => ({ ...t, has_finished_result: c }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Has Logo</Label>
                  <Switch
                    checked={videoTags.has_logo}
                    onCheckedChange={(c) => setVideoTags((t) => ({ ...t, has_logo: c }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Has Person</Label>
                  <Switch
                    checked={videoTags.has_person}
                    onCheckedChange={(c) => setVideoTags((t) => ({ ...t, has_person: c }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={videoTags.environment}
                  onValueChange={(v) => setVideoTags((t) => ({ ...t, environment: v as VideoTags["environment"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dominant Motion</Label>
                <Select
                  value={videoTags.dominant_motion}
                  onValueChange={(v) => setVideoTags((t) => ({ ...t, dominant_motion: v as VideoTags["dominant_motion"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="hand_install">Hand Install</SelectItem>
                    <SelectItem value="peel_motion">Peel Motion</SelectItem>
                    <SelectItem value="camera_pan">Camera Pan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quality Score: {videoTags.quality_score}</Label>
                <Slider
                  value={[videoTags.quality_score]}
                  onValueChange={([v]) => setVideoTags((t) => ({ ...t, quality_score: v }))}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          ) : (
            // Image Tags
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Image Tags
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Has Vehicle</Label>
                  <Switch
                    checked={imageTags.has_vehicle}
                    onCheckedChange={(c) => setImageTags((t) => ({ ...t, has_vehicle: c }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Has Logo</Label>
                  <Switch
                    checked={imageTags.has_logo}
                    onCheckedChange={(c) => setImageTags((t) => ({ ...t, has_logo: c }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Wrap Type</Label>
                <Select
                  value={imageTags.wrap_type}
                  onValueChange={(v) => setImageTags((t) => ({ ...t, wrap_type: v as ImageTags["wrap_type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="accent">Accent</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Finish</Label>
                <Select
                  value={imageTags.finish}
                  onValueChange={(v) => setImageTags((t) => ({ ...t, finish: v as ImageTags["finish"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gloss">Gloss</SelectItem>
                    <SelectItem value="matte">Matte</SelectItem>
                    <SelectItem value="satin">Satin</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Environment</Label>
                <Select
                  value={imageTags.environment}
                  onValueChange={(v) => setImageTags((t) => ({ ...t, environment: v as ImageTags["environment"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Shop</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quality Score: {imageTags.quality_score}</Label>
                <Slider
                  value={[imageTags.quality_score]}
                  onValueChange={([v]) => setImageTags((t) => ({ ...t, quality_score: v }))}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          )}

          {/* Lock Asset Toggle */}
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              <div>
                <Label className="font-medium">Lock Asset</Label>
                <p className="text-xs text-muted-foreground">AI will never re-analyze this asset</p>
              </div>
            </div>
            <Switch checked={lockAsset} onCheckedChange={setLockAsset} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
