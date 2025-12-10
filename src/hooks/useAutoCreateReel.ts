import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SelectedVideo {
  id: string;
  order: number;
  trim_start: number;
  trim_end: number;
  reason: string;
  suggested_overlay?: string;
  file_url?: string;
  thumbnail_url?: string;
  original_filename?: string;
  duration_seconds?: number;
}

export interface AutoCreateResult {
  selected_videos: SelectedVideo[];
  reel_concept: string;
  suggested_hook: string;
  suggested_cta: string;
  music_vibe: string;
  estimated_virality: number;
  total_analyzed: number;
  extracted_style?: {
    font_style: string;
    font_weight: string;
    text_color: string;
    text_shadow: boolean;
    text_position: string;
    background_style: string;
    accent_color: string;
    text_animation: string;
    hook_format: string;
    emoji_usage: boolean;
  };
}

export type DaraFormatType = 
  | "grid_style"
  | "egc_warehouse"
  | "founders_objection"
  | "creator_testimonial"
  | "ai_enhanced"
  | "text_heavy"
  | "dpa_catalog"
  | "negative_marketing"
  | "ugly_ads"
  | "brandformance";

export function useAutoCreateReel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutoCreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoCreate = useCallback(async (options?: {
    organizationId?: string;
    filterCategory?: string;
    maxVideos?: number;
    daraFormat?: DaraFormatType;
  }): Promise<AutoCreateResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-auto-create-reel", {
        body: {
          organization_id: options?.organizationId,
          filter_category: options?.filterCategory,
          max_videos: options?.maxVideos || 50,
          dara_format: options?.daraFormat,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.selected_videos || data.selected_videos.length === 0) {
        toast.error("No suitable videos found for a reel");
        return null;
      }

      setResult(data);
      toast.success(`AI selected ${data.selected_videos.length} videos for your reel!`);
      return data;
    } catch (err) {
      console.error("Auto-create reel failed:", err);
      const message = err instanceof Error ? err.message : "Failed to auto-create reel";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    autoCreate,
    loading,
    result,
    error,
    reset,
  };
}
