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

// Error types for fail-loud handling
export type AutoCreateErrorType = 
  | "INSUFFICIENT_RAW_CLIPS"
  | "INSUFFICIENT_QUALIFYING_CLIPS"
  | "AI_SELECTION_PARSE_FAILED"
  | "RATE_LIMIT"
  | "PAYMENT_REQUIRED"
  | "UNKNOWN";

export interface AutoCreateError {
  type: AutoCreateErrorType;
  message: string;
  suggestion?: string;
  diagnostics?: {
    intent?: Record<string, boolean>;
    threshold?: number;
    total_videos?: number;
    raw_videos?: number;
    qualifying_videos?: number;
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
  const [error, setError] = useState<AutoCreateError | null>(null);

  const autoCreate = useCallback(async (options?: {
    organizationId?: string;
    filterCategory?: string;
    maxVideos?: number;
    daraFormat?: DaraFormatType;
    videoUrl?: string;
    videoDuration?: number;
    topic?: string;
    contentType?: string;
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
          video_url: options?.videoUrl,
          video_duration: options?.videoDuration,
          topic: options?.topic,
          content_type: options?.contentType,
        },
      });

      // Handle edge function errors - note: 422 responses include data with error details
      if (fnError) {
        // Check for rate limit / payment errors from the invoke wrapper
        const errMsg = fnError.message?.toLowerCase() || "";
        if (errMsg.includes("rate limit") || errMsg.includes("429")) {
          const rateError: AutoCreateError = {
            type: "RATE_LIMIT",
            message: "Rate limit exceeded. Please wait and try again.",
          };
          setError(rateError);
          toast.error(rateError.message);
          return null;
        }
        if (errMsg.includes("payment") || errMsg.includes("402")) {
          const paymentError: AutoCreateError = {
            type: "PAYMENT_REQUIRED",
            message: "Payment required. Please add credits to continue.",
          };
          setError(paymentError);
          toast.error(paymentError.message);
          return null;
        }
        
        // For 422 errors, the data contains the structured error - don't throw, let it fall through
        // to the data?.error handling below
        if (!data?.error) {
          throw new Error(fnError.message);
        }
      }

      // Handle 422 fail-loud errors from the function
      if (data?.error) {
        const errorType = data.error as string;
        
        if (errorType === "INSUFFICIENT_RAW_CLIPS") {
          const insufficientError: AutoCreateError = {
            type: "INSUFFICIENT_RAW_CLIPS",
            message: data.message || "Not enough raw clips available.",
            suggestion: data.suggestion || "Upload more source footage.",
          };
          setError(insufficientError);
          toast.error(insufficientError.message, {
            description: insufficientError.suggestion,
            action: {
              label: "Upload Videos",
              onClick: () => window.location.href = "/organic/content-box",
            },
          });
          return null;
        }

        if (errorType === "INSUFFICIENT_QUALIFYING_CLIPS") {
          const qualifyingError: AutoCreateError = {
            type: "INSUFFICIENT_QUALIFYING_CLIPS",
            message: data.message || "Not enough qualifying clips for this topic.",
            suggestion: data.suggestion || "Run Analyze Library to tag more videos.",
            diagnostics: data.diagnostics,
          };
          setError(qualifyingError);
          toast.error(qualifyingError.message, {
            description: qualifyingError.suggestion,
            action: {
              label: "Analyze Library",
              onClick: () => {
                // This will be wired to the visual analyzer in the UI
                console.log("Analyze Library clicked - diagnostics:", qualifyingError.diagnostics);
              },
            },
          });
          return null;
        }

        if (errorType === "AI_SELECTION_PARSE_FAILED") {
          const parseError: AutoCreateError = {
            type: "AI_SELECTION_PARSE_FAILED",
            message: "AI returned an invalid response. Please try again.",
          };
          setError(parseError);
          toast.error(parseError.message);
          return null;
        }

        // Generic error fallback
        const genericError: AutoCreateError = {
          type: "UNKNOWN",
          message: data.error || "Unknown error occurred.",
        };
        setError(genericError);
        toast.error(genericError.message);
        return null;
      }

      if (!data.selected_videos || data.selected_videos.length === 0) {
        const noVideosError: AutoCreateError = {
          type: "INSUFFICIENT_QUALIFYING_CLIPS",
          message: "No suitable videos found for a reel.",
          suggestion: "Try a different topic or analyze more videos.",
        };
        setError(noVideosError);
        toast.error(noVideosError.message);
        return null;
      }

      setResult(data);
      toast.success(`AI selected ${data.selected_videos.length} videos for your reel!`);
      return data;
    } catch (err) {
      console.error("Auto-create reel failed:", err);
      const message = err instanceof Error ? err.message : "Failed to auto-create reel";
      const unknownError: AutoCreateError = {
        type: "UNKNOWN",
        message,
      };
      setError(unknownError);
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

  // Helper to check if error needs library analysis
  const needsAnalysis = error?.type === "INSUFFICIENT_QUALIFYING_CLIPS";

  return {
    autoCreate,
    loading,
    result,
    error,
    reset,
    needsAnalysis,
  };
}
