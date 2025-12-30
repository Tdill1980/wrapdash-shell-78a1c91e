import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, Loader2, Sparkles, Trash2, CheckCircle2, Plus, Wand2, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Caption,
  CaptionStyle,
  CaptionSettings,
  CAPTION_STYLE_CONFIGS,
} from "@/hooks/useReelCaptions";

interface OverlayTemplate {
  id: string;
  brand: string;
  name: string;
  tone: string | null;
  prompt: string;
  example: string | null;
}

interface SceneData {
  sceneId: string;
  text?: unknown;
  start: number;
  end: number;
  purpose?: string;
  textPosition?: string;
  animation?: string;
}

interface CaptionsPanelProps {
  captions: Caption[];
  settings: CaptionSettings;
  loading: boolean;
  onGenerateCaptions: (style: CaptionStyle) => void;
  onUpdateSettings: (updates: Partial<CaptionSettings>) => void;
  onRemoveCaption: (id: string) => void;
  jobId?: string;
  scenes?: SceneData[];
  onOverlaysApproved?: () => void;
  // NEW: keep blueprint in sync so you can see edits immediately in the preview
  onSceneTextChange?: (sceneId: string, text: string) => void;
  // Optional context so AI can generate better "Sabri" style hooks
  concept?: string | null;
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
  onSceneTextChange,
  concept,
}: CaptionsPanelProps) {
  const [approving, setApproving] = useState(false);
  const [approvedSceneIds, setApprovedSceneIds] = useState<Set<string>>(new Set());

  // NEW: Draft and AI generation state
  const [overlayDrafts, setOverlayDrafts] = useState<Record<string, string>>({});
  const [aiPrompt, setAiPrompt] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  const styles: CaptionStyle[] = ["sabri", "dara", "clean"];

  const coerceText = (v: unknown): string => (typeof v === "string" ? v : "");

  const defaultOverlayPrompt = (baseText: string) => {
    const base = baseText?.trim();
    const ctx = (concept || "").trim();

    if (settings.style === "sabri") {
      return [
        "You are Sabri Suby: direct-response, punchy, aggressive, conversion-focused.",
        ctx ? `Context: ${ctx}` : "",
        base ? `Rewrite this into a short overlay: ${base}` : "",
        "Rules: UPPERCASE, 3–7 words, strong verb, no fluff, no emojis unless it makes it hit harder.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (settings.style === "dara") {
      return [
        "You are Dara Denney: relatable, paid-social friendly, clean and specific.",
        ctx ? `Context: ${ctx}` : "",
        base ? `Rewrite this into a short overlay: ${base}` : "",
        "Rules: 4–9 words, sentence case, no hype, clear benefit.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      "Write a clean, professional short overlay.",
      ctx ? `Context: ${ctx}` : "",
      base ? `Rewrite this into a short overlay: ${base}` : "",
      "Rules: 3–8 words, neutral tone, no emojis.",
    ]
      .filter(Boolean)
      .join("\n");
  };

  // Scenes with text overlays (either from blueprint or draft)
  const scenesWithText = scenes.filter((s) => coerceText(s.text) || overlayDrafts[s.sceneId]);
  const allApproved =
    scenesWithText.length > 0 && scenesWithText.every((s) => approvedSceneIds.has(s.sceneId));

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase.from("brand_overlay_templates").select("*").order("name");
      if (data) setTemplates(data as OverlayTemplate[]);
    };
    loadTemplates();
  }, []);

  // Get display text for a scene (draft takes priority)
  const getSceneText = (scene: SceneData) => overlayDrafts[scene.sceneId] ?? coerceText(scene.text);

  const setSceneDraft = (sceneId: string, text: string) => {
    setOverlayDrafts((prev) => ({ ...prev, [sceneId]: text }));
    onSceneTextChange?.(sceneId, text);
  };

  // BULK: Add all from blueprint
  const handleBulkAddFromBlueprint = () => {
    const drafts: Record<string, string> = {};
    scenes.forEach(scene => {
      if (scene.text) {
        drafts[scene.sceneId] = scene.text;
      }
    });
    setOverlayDrafts(prev => ({ ...prev, ...drafts }));
    toast.success(`${Object.keys(drafts).length} scene texts added as overlay drafts`);
  };

  // BULK: Regenerate all with AI
  const handleBulkRegenerate = async () => {
    if (!jobId) return;

    setApproving(true);
    try {
      const bulkPromptRaw = aiPrompt["__bulk__"] || "";
      const newDrafts: Record<string, string> = {};

      for (const scene of scenes) {
        const currentText = getSceneText(scene);
        if (!currentText && !scene.purpose) continue;

        const promptToUse = bulkPromptRaw.trim() || defaultOverlayPrompt(currentText);

        const { data, error } = await supabase.functions.invoke("generate-text-overlay", {
          body: {
            scene: { ...scene, text: currentText },
            prompt: promptToUse,
          },
        });

        if (!error && data?.text) {
          newDrafts[scene.sceneId] = data.text;
        }
      }

      // Keep drafts + blueprint in sync
      Object.entries(newDrafts).forEach(([sceneId, text]) => setSceneDraft(sceneId, text));
      toast.success(`${Object.keys(newDrafts).length} overlays regenerated`);
    } catch (err) {
      console.error("[CaptionsPanel] Bulk regenerate error:", err);
      toast.error("Bulk regenerate failed");
    } finally {
      setApproving(false);
    }
  };

  // Apply template to all scenes
  const handleTemplateApply = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setApproving(true);
    try {
      const drafts: Record<string, string> = {};

      for (const scene of scenes) {
        const currentText = getSceneText(scene);
        const promptToUse = template.prompt?.trim() || defaultOverlayPrompt(currentText);

        const { data } = await supabase.functions.invoke("generate-text-overlay", {
          body: {
            scene: { ...scene, text: currentText },
            prompt: promptToUse,
          },
        });

        if (data?.text) {
          drafts[scene.sceneId] = data.text;
        }
      }

      Object.entries(drafts).forEach(([sceneId, text]) => setSceneDraft(sceneId, text));
      toast.success(`Applied template: ${template.name}`);
    } catch (err) {
      console.error("[CaptionsPanel] Template apply error:", err);
      toast.error("Failed to apply template");
    } finally {
      setApproving(false);
    }
  };

  // Generate single overlay with AI
  const handleGenerateOne = async (scene: SceneData) => {
    setGenerating((prev) => ({ ...prev, [scene.sceneId]: true }));

    try {
      const currentText = getSceneText(scene);
      const promptRaw = aiPrompt[scene.sceneId] || "";
      const promptToUse = promptRaw.trim() || defaultOverlayPrompt(currentText);

      const { data, error } = await supabase.functions.invoke("generate-text-overlay", {
        body: {
          scene: { ...scene, text: currentText },
          prompt: promptToUse,
        },
      });

      if (!error && data?.text) {
        setSceneDraft(scene.sceneId, data.text);
        toast.success("Overlay generated");
      } else {
        toast.error(error?.message || "Failed to generate overlay");
      }
    } catch (err) {
      console.error("[CaptionsPanel] Generate overlay error:", err);
      toast.error("Failed to generate overlay");
    } finally {
      setGenerating((prev) => ({ ...prev, [scene.sceneId]: false }));
    }
  };

  // Approve all overlays
  const handleApproveAllOverlays = async () => {
    if (!jobId || scenesWithText.length === 0) {
      toast.error("No overlays to approve or missing job ID");
      return;
    }

    // FIX 3: Filter out empty overlays
    const validOverlays = scenesWithText.filter(scene => getSceneText(scene).trim());
    if (validOverlays.length === 0) {
      toast.error("All overlay texts are empty");
      return;
    }

    setApproving(true);
    try {
      const overlaysToInsert = validOverlays.map(scene => ({
        job_id: jobId,
        scene_id: scene.sceneId,
        text: getSceneText(scene).trim(),
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

      setApprovedSceneIds(new Set(validOverlays.map(s => s.sceneId)));
      
      // FIX 2: Clear drafts after successful approval
      setOverlayDrafts({});
      setEditingSceneId(null);
      
      toast.success(`${validOverlays.length} text overlays approved for rendering`);
      onOverlaysApproved?.();
    } catch (err) {
      console.error("[CaptionsPanel] Approve overlays error:", err);
      toast.error("Failed to approve overlays");
    } finally {
      setApproving(false);
    }
  };

  // Approve single overlay
  const handleApproveOne = async (scene: SceneData) => {
    if (!jobId) return;
    const text = getSceneText(scene);
    
    // FIX 3: Prevent empty overlay approval
    if (!text?.trim()) {
      toast.error("Overlay text cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("scene_text_overlays")
        .upsert({
          job_id: jobId,
          scene_id: scene.sceneId,
          text: text.trim(),
          position: scene.textPosition || 'center',
          animation: scene.animation || 'pop',
          start_time: scene.start,
          end_time: scene.end,
          approved: true,
          approved_at: new Date().toISOString(),
        }, { onConflict: 'job_id,scene_id' });

      if (error) throw error;

      setApprovedSceneIds(prev => new Set([...prev, scene.sceneId]));
      
      // FIX 2: Clear draft for this scene after approval
      setOverlayDrafts(prev => {
        const next = { ...prev };
        delete next[scene.sceneId];
        return next;
      });
      setEditingSceneId(null);
      
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
          Text Overlays & Captions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* BULK ACTIONS BAR - Show when scenes available (jobId only needed for approval) */}
        {scenes.length > 0 && (
          <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
            {/* Template selector */}
            {templates.length > 0 && (
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                <Select onValueChange={handleTemplateApply} disabled={approving}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue placeholder="Apply brand template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.tone && <span className="text-muted-foreground">({t.tone})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bulk prompt input */}
            <Textarea
              placeholder="Optional bulk prompt (e.g. aggressive, short hooks, sales-driven)"
              value={aiPrompt["__bulk__"] || ""}
              onChange={e => setAiPrompt(prev => ({ ...prev, "__bulk__": e.target.value }))}
              className="text-xs min-h-[50px]"
            />

            {/* Bulk action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkAddFromBlueprint}
                disabled={approving}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add All as Drafts
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkRegenerate}
                disabled={approving || scenes.length === 0}
                className="h-7 text-xs"
              >
                {approving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                Regenerate All
              </Button>

              {jobId ? (
                <Button
                  size="sm"
                  variant={allApproved ? "secondary" : "default"}
                  disabled={approving || allApproved || scenesWithText.length === 0}
                  onClick={handleApproveAllOverlays}
                  className="h-7 text-xs"
                >
                  {approving ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  )}
                  {allApproved ? "All Approved" : `Approve All (${scenesWithText.length})`}
                </Button>
              ) : scenesWithText.length > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
                  ✓ {scenesWithText.length} overlay(s) ready — will be included when you render
                </span>
              )}
            </div>
          </div>
        )}

        {/* PER-SCENE OVERLAY CONTROLS - Show when scenes available (jobId only needed for approval) */}
        {scenes.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scenes.map((scene) => {
              const displayText = getSceneText(scene);
              const isApproved = approvedSceneIds.has(scene.sceneId);
              const isEditing = editingSceneId === scene.sceneId;
              const isGenerating = generating[scene.sceneId];

              return (
                <div
                  key={scene.sceneId}
                  className={cn(
                    "p-2.5 rounded-lg border transition-colors",
                    isApproved
                      ? "bg-green-500/10 border-green-500/30"
                      : displayText
                        ? "bg-muted/50 border-border"
                        : "bg-background border-dashed border-muted-foreground/30"
                  )}
                >
                  {/* Scene header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Scene {scene.sceneId.replace('scene_', '').replace('producer_', '')} • {scene.start.toFixed(1)}s – {scene.end.toFixed(1)}s
                      {scene.purpose && <span className="ml-1 opacity-60">({scene.purpose})</span>}
                    </span>
                    {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  </div>

                  {/* Text display or editor */}
                  {isEditing ? (
                    <Textarea
                      value={overlayDrafts[scene.sceneId] ?? coerceText(scene.text)}
                      onChange={(e) => setSceneDraft(scene.sceneId, e.target.value)}
                      placeholder="Enter overlay text..."
                      className="text-xs min-h-[40px] mb-2"
                      autoFocus
                      onBlur={() => setEditingSceneId(null)}
                    />
                  ) : displayText ? (
                    <p
                      className="text-sm font-medium truncate mb-2 cursor-pointer hover:text-primary"
                      onClick={() => {
                        setSceneDraft(scene.sceneId, displayText);
                        setEditingSceneId(scene.sceneId);
                      }}
                      title="Click to edit"
                    >
                      {displayText}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mb-2">No overlay text</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!displayText && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => {
                          setSceneDraft(scene.sceneId, coerceText(scene.text));
                          setEditingSceneId(scene.sceneId);
                        }}
                      >
                        <Plus className="w-2.5 h-2.5 mr-0.5" />
                        Add
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      disabled={isGenerating}
                      onClick={() => handleGenerateOne(scene)}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-2.5 h-2.5 mr-0.5" />
                      )}
                      {displayText ? "Regen" : "Generate"}
                    </Button>

                    {/* Only show Approve button after render has started */}
                    {jobId && displayText && !isApproved && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => handleApproveOne(scene)}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                        Approve
                      </Button>
                    )}
                  </div>

                  {/* Per-scene AI prompt (collapsed by default) */}
                  {isEditing && (
                    <input
                      type="text"
                      placeholder="AI prompt for this scene..."
                      value={aiPrompt[scene.sceneId] || ""}
                      onChange={e => setAiPrompt(prev => ({ ...prev, [scene.sceneId]: e.target.value }))}
                      className="w-full mt-2 text-[10px] p-1.5 rounded border bg-background"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* DIVIDER */}
        {scenes.length > 0 && <div className="border-t border-border my-2" />}

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
