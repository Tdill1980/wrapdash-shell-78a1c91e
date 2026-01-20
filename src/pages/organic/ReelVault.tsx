import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Image, Play, ExternalLink, RefreshCw, Download, Loader2, CheckSquare, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { listCreatives, Creative, FormatSlug, SourceType, ToolSlug, CreativeStatus } from "@/lib/creativeVault";
import { downloadAsZip, DownloadItem, sanitizeFolderName, sanitizeFilename, getExtensionFromUrl } from "@/lib/downloadUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SOURCE_LABELS: Record<SourceType, string> = {
  mighty_task: "Mighty Task",
  content_calendar: "Calendar",
  noah_prompt: "Noah",
  manual: "Manual",
  youtube: "YouTube",
  inspiration: "Inspiration",
  producer_job: "Producer",
};

const TOOL_LABELS: Record<ToolSlug, string> = {
  multi_clip_reel: "Multi-Clip",
  auto_split: "Auto-Split",
  static_creator: "Static",
  content_atomizer: "Atomizer",
  youtube_editor: "YouTube",
  inspo_scrubber: "Inspiration",
  mighty_edit: "MightyEdit",
};

const STATUS_COLORS: Record<CreativeStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  rendering: "bg-amber-500/20 text-amber-500",
  complete: "bg-emerald-500/20 text-emerald-500",
  failed: "bg-destructive/20 text-destructive",
};

export default function ReelVault() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState<FormatSlug | "all">("all");
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ completed: 0, total: 0 });

  const fetchCreatives = async () => {
    setLoading(true);
    try {
      const data = await listCreatives(
        formatFilter === "all" ? undefined : { format: formatFilter }
      );
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch creatives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatives();
  }, [formatFilter]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableItems = items.filter(c => c.status === "complete" && c.output_url);
  
  const selectAll = () => {
    const ids = selectableItems.map(c => c.id);
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Batch export handler
  const handleBatchExport = async () => {
    const selected = items.filter(c => selectedIds.has(c.id) && c.output_url);
    if (selected.length === 0) {
      toast.error("No downloadable items selected");
      return;
    }

    setIsExporting(true);
    setExportProgress({ completed: 0, total: selected.length });

    try {
      // Build download items with folder structure: date/brand/platform
      const downloadItems: DownloadItem[] = selected.map(creative => {
        // Date folder: YYYY-MM-DD
        const date = new Date(creative.created_at).toISOString().slice(0, 10);

        // Brand folder (or "Unbranded")
        const brand = creative.brand || "Unbranded";

        // Platform folder (or "General")
        const platform = creative.platform || "General";

        // Folder path: date/brand/platform
        const folder = `${date}/${sanitizeFolderName(brand)}/${sanitizeFolderName(platform)}`;

        // Filename from title or ID
        const ext = getExtensionFromUrl(creative.output_url || "");
        const filename = sanitizeFilename(creative.title || creative.id) + ext;

        return {
          url: creative.output_url!,
          filename,
          folder,
        };
      });

      await downloadAsZip(
        downloadItems,
        `reel-vault-export-${new Date().toISOString().slice(0, 10)}.zip`,
        (completed, total) => setExportProgress({ completed, total })
      );

      clearSelection();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export creatives");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Reel Vault</h1>
                <p className="text-sm text-muted-foreground">
                  All AI-created content in one place
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCreatives}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Format Filter Tabs */}
          <Tabs
            value={formatFilter}
            onValueChange={(v) => setFormatFilter(v as FormatSlug | "all")}
            className="mt-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="reel">Reels</TabsTrigger>
              <TabsTrigger value="short">Shorts</TabsTrigger>
              <TabsTrigger value="story">Stories</TabsTrigger>
              <TabsTrigger value="static">Static</TabsTrigger>
              <TabsTrigger value="carousel">Carousel</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No creatives yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first reel using the Reel Builder or other tools
            </p>
            <Button onClick={() => navigate("/organic/reel-builder")}>
              Open Reel Builder
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((creative) => {
              const isSelectable = creative.status === "complete" && creative.output_url;
              const isSelected = selectedIds.has(creative.id);
              
              return (
                <Card
                  key={creative.id}
                  className={cn(
                    "overflow-hidden transition-all cursor-pointer group relative",
                    isSelected && "ring-2 ring-primary",
                    !isSelected && "hover:ring-2 hover:ring-primary/50"
                  )}
                >
                  {/* Selection Checkbox */}
                  {isSelectable && (
                    <div 
                      className="absolute top-2 left-2 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(creative.id)}
                        className="h-5 w-5 bg-background/90 border-2"
                      />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div 
                    className="aspect-[9/16] bg-muted relative"
                    onClick={() => isSelectable && toggleSelection(creative.id)}
                  >
                    {creative.thumbnail_url ? (
                      <img
                        src={creative.thumbnail_url}
                        alt={creative.title || "Creative"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {creative.format_slug === "static" || creative.format_slug === "carousel" ? (
                          <Image className="h-12 w-12 text-muted-foreground/30" />
                        ) : (
                          <Video className="h-12 w-12 text-muted-foreground/30" />
                        )}
                      </div>
                    )}

                    {/* Play overlay for videos */}
                    {creative.output_url && creative.format_slug !== "static" && (
                      <a
                        href={creative.output_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Play className="h-12 w-12 text-white" />
                      </a>
                    )}

                    {/* Status Badge */}
                    <Badge
                      className={cn(
                        "absolute top-2 right-2 text-xs",
                        STATUS_COLORS[creative.status as CreativeStatus] || STATUS_COLORS.draft
                      )}
                    >
                      {creative.status}
                    </Badge>
                  </div>

                  <CardContent className="p-3">
                    {/* Title */}
                    <h3 className="font-medium text-sm line-clamp-1 mb-1">
                      {creative.title || "Untitled"}
                    </h3>

                    {/* Meta row */}
                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      {creative.brand && (
                        <Badge variant="outline" className="text-xs">
                          {creative.brand}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {SOURCE_LABELS[creative.source_type as SourceType] || creative.source_type}
                      </Badge>
                      {creative.tool_slug && (
                        <Badge variant="secondary" className="text-xs">
                          {TOOL_LABELS[creative.tool_slug as ToolSlug] || creative.tool_slug}
                        </Badge>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(creative.created_at).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    {creative.output_url && (
                      <a
                        href={creative.output_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Watch
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Toolbar - Fixed at bottom */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          
          <div className="h-4 w-px bg-border" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={selectAll}
            disabled={selectedIds.size === selectableItems.length}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            All ({selectableItems.length})
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
          
          <div className="h-4 w-px bg-border" />
          
          <Button 
            onClick={handleBatchExport} 
            disabled={isExporting}
            className="bg-primary hover:bg-primary/90"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {exportProgress.completed}/{exportProgress.total}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download ZIP
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
