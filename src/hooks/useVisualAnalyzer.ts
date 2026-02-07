import { useState } from "react";
import { lovable3DRenders, lovableFunctions } from "@/integrations/supabase/client";

// content_files lives in Lovable's Supabase - see MediaLibrary.tsx for details

export function useVisualAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const analyzeVideo = async (videoId: string) => {
    const { error } = await lovableFunctions.functions.invoke("ai-analyze-video-frame", {
      body: { video_id: videoId }
    });

    if (error) throw error;
  };

  const analyzeAllUntagged = async (limit = 25) => {
    setAnalyzing(true);
    setProgress({ current: 0, total: limit });

    const { data, error } = await lovableFunctions.functions.invoke(
      "backfill-video-visual-tags",
      { body: { limit } }
    );

    setAnalyzing(false);

    if (error) throw error;
    return data as { processed: number; skipped: number; failed: number };
  };

  const getStatus = async () => {
    // Only count raw source footage for analysis status
    const { count: analyzedCount } = await lovable3DRenders
      .from("content_files")
      .select("id", { count: "exact", head: true })
      .eq("file_type", "video")
      .eq("content_category", "raw")
      .not("visual_analyzed_at", "is", null);

    const { count: unanalyzedCount } = await lovable3DRenders
      .from("content_files")
      .select("id", { count: "exact", head: true })
      .eq("file_type", "video")
      .eq("content_category", "raw")
      .is("visual_analyzed_at", null);

    return {
      analyzed: analyzedCount ?? 0,
      unanalyzed: unanalyzedCount ?? 0
    };
  };

  return {
    analyzeVideo,
    analyzeAllUntagged,
    getStatus,
    analyzing,
    progress
  };
}
