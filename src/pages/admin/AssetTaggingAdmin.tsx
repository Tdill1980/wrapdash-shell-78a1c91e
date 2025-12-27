import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Eye, Edit, RefreshCw, CheckCircle, XCircle, Lock, Image, Video, Zap } from "lucide-react";
import { ManualTagEditorModal } from "@/components/admin/ManualTagEditorModal";
import { useVisualAnalyzer } from "@/hooks/useVisualAnalyzer";

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

const AssetTaggingAdmin = () => {
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<ContentFileRow | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const { analyzeAllUntagged, getStatus, analyzing: bulkAnalyzing } = useVisualAnalyzer();

  const { data: status } = useQuery({
    queryKey: ["visual-analyzer-status"],
    queryFn: getStatus,
  });

  const handleBulkAnalyze = async () => {
    try {
      const result = await analyzeAllUntagged(50);
      toast.success(`Bulk analysis complete: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed`);
      queryClient.invalidateQueries({ queryKey: ["asset-tagging-admin"] });
      queryClient.invalidateQueries({ queryKey: ["visual-analyzer-status"] });
    } catch (err) {
      console.error("Bulk analysis failed:", err);
      toast.error("Bulk analysis failed");
    }
  };

  const { data: assets, isLoading } = useQuery({
    queryKey: ["asset-tagging-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_files")
        .select("id, file_type, file_url, thumbnail_url, original_filename, visual_tags, visual_analyzed_at, content_category, created_at")
        .neq("content_category", "inspo_reference")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ContentFileRow[];
    },
  });

  const getManualOverride = (visualTags: Record<string, unknown> | null): boolean => {
    if (!visualTags) return false;
    const meta = visualTags.meta as Record<string, unknown> | undefined;
    return meta?.manual_override === true;
  };

  const getQualityScore = (visualTags: Record<string, unknown> | null, fileType: string): number | null => {
    if (!visualTags) return null;
    const tags = visualTags[fileType] as Record<string, unknown> | undefined;
    return typeof tags?.quality_score === "number" ? tags.quality_score : null;
  };

  const handleAnalyze = async (asset: ContentFileRow) => {
    if (getManualOverride(asset.visual_tags)) {
      toast.error("This asset is manually locked and cannot be re-analyzed.");
      return;
    }

    setAnalyzingIds((prev) => new Set(prev).add(asset.id));

    try {
      const functionName = asset.file_type === "video" ? "ai-analyze-video-frame" : "ai-analyze-image";
      const body = asset.file_type === "video" 
        ? { video_id: asset.id }
        : { content_file_id: asset.id };

      const { error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      toast.success("Analysis started. Refresh in a few seconds to see results.");
      
      // Refresh after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["asset-tagging-admin"] });
      }, 3000);
    } catch (err) {
      console.error("Analysis failed:", err);
      toast.error("Failed to start analysis");
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  };

  const handleSaved = () => {
    setSelectedAsset(null);
    queryClient.invalidateQueries({ queryKey: ["asset-tagging-admin"] });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Asset Tagging Admin</h1>
            <p className="text-muted-foreground">Review and manually override AI-generated tags</p>
            {status && (
              <p className="text-sm text-muted-foreground mt-1">
                {status.analyzed} analyzed · {status.unanalyzed} unanalyzed
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBulkAnalyze}
              disabled={bulkAnalyzing || !status?.unanalyzed}
            >
              {bulkAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Bulk Analyze ({status?.unanalyzed || 0})
            </Button>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["asset-tagging-admin"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assets ({assets?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Preview</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-28">Analyzed</TableHead>
                    <TableHead className="w-28">Override</TableHead>
                    <TableHead className="w-24">Quality</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets?.map((asset) => {
                    const isManualOverride = getManualOverride(asset.visual_tags);
                    const qualityScore = getQualityScore(asset.visual_tags, asset.file_type);
                    const isAnalyzing = analyzingIds.has(asset.id);

                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          {asset.thumbnail_url ? (
                            <img
                              src={asset.thumbnail_url}
                              alt="Thumbnail"
                              className="w-16 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                              {asset.file_type === "video" ? (
                                <Video className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Image className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium truncate max-w-[200px]">
                          {asset.original_filename || "Unnamed"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {asset.file_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {asset.visual_analyzed_at ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isManualOverride ? (
                            <Badge variant="default" className="bg-amber-600">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          ) : (
                            <Badge variant="outline">Auto</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {qualityScore !== null ? (
                            <span className={`font-medium ${qualityScore >= 70 ? "text-green-600" : qualityScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                              {qualityScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAsset(asset)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            {!isManualOverride && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAnalyze(asset)}
                                disabled={isAnalyzing}
                              >
                                {isAnalyzing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedAsset && (
        <ManualTagEditorModal
          contentFile={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSaved={handleSaved}
        />
      )}
    </MainLayout>
  );
};

export default AssetTaggingAdmin;
