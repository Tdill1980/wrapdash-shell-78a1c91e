import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Plus, Wand2, Loader2, AlertTriangle } from "lucide-react";
import { TAG_LABELS, VALID_STYLE_TAGS, VALID_VISUAL_TAGS, VALID_QUALITY_TAGS } from "@/lib/style-tag-rules";

interface MediaFile {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  content_category?: string | null;
  original_filename: string | null;
  visual_tags?: {
    style_tags?: string[];
    visual_tags?: string[];
    quality_tags?: string[];
    ai_confidence?: number;
    ai_description?: string;
    tagged_at?: string;
  } | null;
}

interface TagEditorModalProps {
  file: MediaFile;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "raw", label: "Raw" },
  { value: "template", label: "Template" },
  { value: "finished", label: "Finished" },
  { value: "inspiration", label: "Inspiration" },
];

// All valid AI tags for controlled vocabulary
const ALL_AI_TAGS: string[] = [
  ...VALID_STYLE_TAGS,
  ...VALID_VISUAL_TAGS,
  ...VALID_QUALITY_TAGS,
];

export function TagEditorModal({ file, open, onClose, onSave }: TagEditorModalProps) {
  const [tags, setTags] = useState<string[]>(file.tags || []);
  const [category, setCategory] = useState(file.content_category || "raw");
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [retagging, setRetagging] = useState(false);

  const aiConfidence = file.visual_tags?.ai_confidence;
  const aiDescription = file.visual_tags?.ai_description;
  const styleTags = file.visual_tags?.style_tags || [];
  const visualTags = file.visual_tags?.visual_tags || [];
  const qualityTags = file.visual_tags?.quality_tags || [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAIRetag = async () => {
    setRetagging(true);
    try {
      const { data, error } = await lovableFunctions.functions.invoke("ai-tag-video", {
        body: {
          content_file_id: file.id,
          video_url: file.file_url,
          thumbnail_url: file.thumbnail_url,
          existing_tags: [], // Clear AI tags but keep manual ones below
        },
      });

      if (error) throw error;

      if (data?.all_tags) {
        // Merge AI tags with any manual tags that aren't in AI vocabulary
        const manualTags = tags.filter(t => !ALL_AI_TAGS.includes(t));
        const newTags = [...new Set([...data.all_tags, ...manualTags])];
        setTags(newTags);
        toast.success(`AI tagged: ${data.all_tags.length} tags detected`);
      }
    } catch (err) {
      console.error("AI retag error:", err);
      toast.error("Failed to retag with AI");
    } finally {
      setRetagging(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("content_files")
        .update({ 
          tags, 
          content_category: category 
        })
        .eq("id", file.id);

      if (error) throw error;
      
      toast.success("Tags updated successfully");
      onSave?.();
      onClose();
    } catch (err) {
      console.error("Error saving tags:", err);
      toast.error("Failed to save tags");
    } finally {
      setSaving(false);
    }
  };

  const getTagLabel = (tag: string) => TAG_LABELS[tag] || tag;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tags & Category</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {file.original_filename || "Untitled"}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Confidence Banner */}
          {aiConfidence !== undefined && (
            <div className={`p-3 rounded-lg border ${
              aiConfidence >= 0.7 
                ? "bg-green-500/10 border-green-500/30" 
                : aiConfidence >= 0.5 
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {aiConfidence < 0.5 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  <span className="text-sm font-medium">
                    AI Confidence: {(aiConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAIRetag}
                  disabled={retagging}
                  className="h-7"
                >
                  {retagging ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Re-Tag AI
                </Button>
              </div>
              {aiDescription && (
                <p className="text-xs text-muted-foreground mt-1">{aiDescription}</p>
              )}
            </div>
          )}

          {/* No AI Tags Banner */}
          {aiConfidence === undefined && (
            <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">No AI tags yet</span>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAIRetag}
                  disabled={retagging}
                  className="h-7"
                >
                  {retagging ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Tag with AI
                </Button>
              </div>
            </div>
          )}

          {/* AI Tag Breakdown (if available) */}
          {(styleTags.length > 0 || visualTags.length > 0 || qualityTags.length > 0) && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">AI Tag Breakdown</Label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-muted/50">
                  <p className="font-medium mb-1">Style</p>
                  {styleTags.map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px] mr-1 mb-1">
                      {getTagLabel(t)}
                    </Badge>
                  ))}
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="font-medium mb-1">Visual</p>
                  {visualTags.map(t => (
                    <Badge key={t} variant="outline" className="text-[10px] mr-1 mb-1">
                      {getTagLabel(t)}
                    </Badge>
                  ))}
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="font-medium mb-1">Quality</p>
                  {qualityTags.map(t => (
                    <Badge key={t} variant="outline" className="text-[10px] mr-1 mb-1">
                      {getTagLabel(t)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Tags */}
          <div className="space-y-2">
            <Label>All Tags ({tags.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">No tags added</span>
              ) : (
                tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant={ALL_AI_TAGS.includes(tag) ? "secondary" : "default"}
                    className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeTag(tag)}
                  >
                    {getTagLabel(tag)}
                    <X className="w-3 h-3" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(newTag);
                }
              }}
            />
            <Button 
              size="icon" 
              variant="secondary"
              onClick={() => addTag(newTag)}
              disabled={!newTag.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Tag Picker */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Add AI Tags</Label>
            <Select onValueChange={addTag}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {ALL_AI_TAGS.filter(t => !tags.includes(t)).map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {getTagLabel(tag)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
