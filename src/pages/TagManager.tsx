import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Tag, Video, Plus } from "lucide-react";
import { toast } from "sonner";
import { STYLE_TAG_RULES, getStyleOptions, TAG_LABELS, VALID_STYLE_TAGS, VALID_VISUAL_TAGS, VALID_QUALITY_TAGS } from "@/lib/style-tag-rules";
import { TagList } from "@/components/ui/tag-badge";

type ContentFileRow = {
  id: string;
  original_filename: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  file_type: string | null;
  tags: string[] | null;
  visual_tags: { ai_confidence?: number; style_tags?: string[]; visual_tags?: string[]; quality_tags?: string[] } | null;
  created_at: string | null;
};

const ALL_VALID_TAGS = [
  ...VALID_STYLE_TAGS,
  ...VALID_VISUAL_TAGS,
  ...VALID_QUALITY_TAGS,
].filter((v, i, a) => a.indexOf(v) === i).sort();

function normalizeTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return [];
}

function confidenceOf(file: ContentFileRow): number | null {
  const c = file.visual_tags?.ai_confidence;
  if (typeof c === "number") return c;
  return null;
}

export default function TagManager() {
  const [files, setFiles] = useState<ContentFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState("any");
  const [onlyUntagged, setOnlyUntagged] = useState(false);
  const [onlyLowConfidence, setOnlyLowConfidence] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [retaggingId, setRetaggingId] = useState<string | null>(null);

  const styleOptions = useMemo(() => getStyleOptions(), []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_files")
      .select("id, original_filename, file_url, thumbnail_url, file_type, tags, visual_tags, created_at")
      .eq("file_type", "video")
      .order("created_at", { ascending: false })
      .limit(500);

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Failed to load videos");
      return;
    }
    setFiles((data as ContentFileRow[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return files.filter((f) => {
      const tags = normalizeTags(f.tags);

      if (s) {
        const name = (f.original_filename || "").toLowerCase();
        const match = name.includes(s) || tags.some((t) => t.toLowerCase().includes(s));
        if (!match) return false;
      }

      if (onlyUntagged && tags.length > 0) return false;

      if (onlyLowConfidence) {
        const c = confidenceOf(f);
        if (c === null || c >= 0.5) return false;
      }

      if (style !== "any" && STYLE_TAG_RULES[style as keyof typeof STYLE_TAG_RULES]) {
        const rules = STYLE_TAG_RULES[style as keyof typeof STYLE_TAG_RULES];
        if (rules.mustHaveAny?.length) {
          const hasRequired = rules.mustHaveAny.some((t) => tags.includes(t));
          if (!hasRequired) return false;
        }
        if (rules.mustNotHave?.length) {
          const hasExcluded = rules.mustNotHave.some((t) => tags.includes(t));
          if (hasExcluded) return false;
        }
      }

      return true;
    });
  }, [files, search, onlyUntagged, onlyLowConfidence, style]);

  async function retagOne(file: ContentFileRow) {
    const tags = normalizeTags(file.tags);
    const { error } = await supabase.functions.invoke("ai-tag-video", {
      body: {
        content_file_id: file.id,
        video_url: file.file_url,
        thumbnail_url: file.thumbnail_url,
        existing_tags: tags,
      },
    });
    if (error) throw error;
  }

  async function addTag(fileId: string, tag: string) {
    const { error } = await supabase.rpc("add_content_tag", { file_id: fileId, tag });
    if (error) {
      toast.error("Failed to add tag");
      throw error;
    }
    toast.success(`Added tag: ${TAG_LABELS[tag] || tag}`);
    await load();
  }

  async function removeTag(fileId: string, tag: string) {
    const { error } = await supabase.rpc("remove_content_tag", { file_id: fileId, tag });
    if (error) {
      toast.error("Failed to remove tag");
      throw error;
    }
    toast.success(`Removed tag: ${TAG_LABELS[tag] || tag}`);
    await load();
  }

  async function handleRetagOne(file: ContentFileRow) {
    setRetaggingId(file.id);
    try {
      await retagOne(file);
      toast.success("Video re-tagged");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Re-tag failed");
    } finally {
      setRetaggingId(null);
    }
  }

  async function bulkRetagVisible() {
    if (filtered.length === 0) {
      toast.error("No videos to re-tag");
      return;
    }
    setBulkRunning(true);
    try {
      let count = 0;
      for (const f of filtered) {
        await retagOne(f);
        count++;
        await new Promise((r) => setTimeout(r, 700));
      }
      toast.success(`Re-tagged ${count} videos`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Bulk re-tag failed");
    } finally {
      setBulkRunning(false);
    }
  }

  async function bulkRetagLowConfidence() {
    const low = filtered.filter((f) => {
      const c = confidenceOf(f);
      return c !== null && c < 0.5;
    });
    if (low.length === 0) {
      toast.error("No low-confidence videos to re-tag");
      return;
    }
    setBulkRunning(true);
    try {
      let count = 0;
      for (const f of low) {
        await retagOne(f);
        count++;
        await new Promise((r) => setTimeout(r, 700));
      }
      toast.success(`Re-tagged ${count} low-confidence videos`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Bulk re-tag failed");
    } finally {
      setBulkRunning(false);
    }
  }

  const untaggedCount = files.filter((f) => !f.tags || f.tags.length === 0).length;
  const lowConfCount = files.filter((f) => {
    const c = confidenceOf(f);
    return c !== null && c < 0.5;
  }).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Tag Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage AI tags, re-tag videos, and fix style matching
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Stats Banner */}
      {(untaggedCount > 0 || lowConfCount > 0) && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {untaggedCount > 0 && (
              <span className="text-sm">
                <strong>{untaggedCount}</strong> untagged videos
              </span>
            )}
            {lowConfCount > 0 && (
              <span className="text-sm">
                <strong>{lowConfCount}</strong> low-confidence tags
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setOnlyUntagged(true);
              setOnlyLowConfidence(false);
            }}
          >
            Show Issues
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-muted/30 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All Styles</SelectItem>
              {styleOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="untagged"
              checked={onlyUntagged}
              onCheckedChange={(v) => setOnlyUntagged(!!v)}
            />
            <label htmlFor="untagged" className="text-sm cursor-pointer">
              Untagged only
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="lowconf"
              checked={onlyLowConfidence}
              onCheckedChange={(v) => setOnlyLowConfidence(!!v)}
            />
            <label htmlFor="lowconf" className="text-sm cursor-pointer">
              Low confidence
            </label>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={bulkRetagVisible}
            disabled={bulkRunning || filtered.length === 0}
          >
            {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Re-Tag Visible ({filtered.length})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={bulkRetagLowConfidence}
            disabled={bulkRunning}
          >
            Re-Tag Low Confidence
          </Button>

          <span className="text-sm text-muted-foreground">
            {filtered.length} of {files.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((f) => {
          const tags = normalizeTags(f.tags);
          const conf = confidenceOf(f);
          const isRetagging = retaggingId === f.id;

          return (
            <Card key={f.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {f.thumbnail_url ? (
                    <img
                      src={f.thumbnail_url}
                      alt={f.original_filename || "Video"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Confidence badge */}
                  {conf !== null && (
                    <Badge
                      variant={conf >= 0.7 ? "default" : conf >= 0.5 ? "secondary" : "destructive"}
                      className="absolute top-2 right-2 text-xs"
                    >
                      AI {Math.round(conf * 100)}%
                    </Badge>
                  )}
                  {/* Untagged warning */}
                  {tags.length === 0 && (
                    <Badge variant="outline" className="absolute top-2 left-2 bg-background/80">
                      Untagged
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 space-y-3">
                  <p className="text-sm font-medium truncate" title={f.original_filename || f.id}>
                    {f.original_filename || f.id.slice(0, 8)}
                  </p>

                  {/* Tags */}
                  <div className="min-h-[48px]">
                    {tags.length > 0 ? (
                      <TagList tags={tags} maxVisible={4} />
                    ) : (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetagOne(f)}
                      disabled={isRetagging}
                    >
                      {isRetagging ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Re-Tag AI
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => f.file_url && window.open(f.file_url, "_blank")}
                      disabled={!f.file_url}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      View
                    </Button>

                    <Select onValueChange={(tag) => addTag(f.id, tag)}>
                      <SelectTrigger className="w-24 h-8">
                        <Plus className="h-3 w-3 mr-1" />
                        <span className="text-xs">Add</span>
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_VALID_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TAG_LABELS[t] || t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Editable tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                      {tags.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs"
                          onClick={() => removeTag(f.id, t)}
                          title="Click to remove"
                        >
                          {TAG_LABELS[t] || t} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No videos match the current filters
        </div>
      )}
    </div>
  );
}
