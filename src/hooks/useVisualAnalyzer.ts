import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useVisualAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const analyzeVideo = async (videoId: string) => {
    const { error } = await supabase.functions.invoke("ai-analyze-video-frame", {
      body: { video_id: videoId }
    });

    if (error) throw error;
  };

  const analyzeAllUntagged = async (limit = 25) => {
    setAnalyzing(true);
    setProgress({ current: 0, total: limit });

    const { data, error } = await supabase.functions.invoke(
      "backfill-video-visual-tags",
      { body: { limit } }
    );

    setAnalyzing(false);

    if (error) throw error;
    return data as { processed: number; skipped: number; failed: number };
  };

  const getStatus = async () => {
    const { count: analyzedCount } = await supabase
      .from("content_files")
      .select("id", { count: "exact", head: true })
      .eq("file_type", "video")
      .not("visual_analyzed_at", "is", null);

    const { count: unanalyzedCount } = await supabase
      .from("content_files")
      .select("id", { count: "exact", head: true })
      .eq("file_type", "video")
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
