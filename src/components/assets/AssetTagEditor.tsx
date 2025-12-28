import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateAssetTags } from "@/lib/contentBoxQueries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ASSET_TAGS = [
  { slug: "asset:shop", label: "Shop" },
  { slug: "asset:b_roll", label: "B-Roll" },
  { slug: "asset:install", label: "Install" },
  { slug: "asset:completed", label: "Completed" },
  { slug: "asset:funny", label: "Funny" },
  { slug: "asset:talking_head", label: "Talking Head" },
];

interface AssetTagEditorProps {
  assetId: string;
  tags: string[];
  onTagsUpdated?: (newTags: string[]) => void;
}

export function AssetTagEditor({ assetId, tags, onTagsUpdated }: AssetTagEditorProps) {
  const [current, setCurrent] = useState<string[]>(tags);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const toggle = (tag: string) => {
    setCurrent((prev) => {
      const newTags = prev.includes(tag) 
        ? prev.filter((t) => t !== tag) 
        : [...prev, tag];
      setIsDirty(true);
      return newTags;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAssetTags(assetId, current);
      setIsDirty(false);
      onTagsUpdated?.(current);
      toast.success("Tags saved");
    } catch (err) {
      console.error("Failed to save tags:", err);
      toast.error("Failed to save tags");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {ASSET_TAGS.map((t) => (
          <button
            key={t.slug}
            onClick={() => toggle(t.slug)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              current.includes(t.slug)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isDirty && (
        <Button
          size="sm"
          onClick={save}
          disabled={saving}
          className="w-full text-xs"
        >
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Saving…
            </>
          ) : (
            "Save Tags"
          )}
        </Button>
      )}
    </div>
  );
}
