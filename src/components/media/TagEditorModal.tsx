import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface MediaFile {
  id: string;
  tags: string[] | null;
  content_category?: string | null;
  original_filename: string | null;
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

const SUGGESTED_TAGS = [
  "wrap", "ppf", "tint", "before", "after", "matte", "gloss", "satin",
  "chrome", "color-change", "commercial", "fleet", "custom", "partial"
];

export function TagEditorModal({ file, open, onClose, onSave }: TagEditorModalProps) {
  const [tags, setTags] = useState<string[]>(file.tags || []);
  const [category, setCategory] = useState(file.content_category || "raw");
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tags & Category</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {file.original_filename || "Untitled"}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
              {tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">No tags added</span>
              ) : (
                tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
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

          {/* Suggested Tags */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Add</Label>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 8).map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
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
