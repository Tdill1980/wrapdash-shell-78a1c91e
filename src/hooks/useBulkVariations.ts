import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BulkVariationConfig {
  brief: string;
  source_media_ids?: string[];
  inspiration_ids?: string[];
  agents: string[];
  formats: string[];
  styles: string[];
  count_per_combo: number;
}

export interface BulkVariationResult {
  success: boolean;
  bulk_id: string;
  total_requested: number;
  variations_created: number;
  failed: number;
  items: Array<{
    agent: string;
    format: string;
    style: string;
    hook: string;
    caption: string;
    music_vibe: string;
  }>;
}

export interface AutoTagResult {
  success: boolean;
  file_id: string;
  tags: string[];
  content_type: string;
  confidence: number;
  full_analysis: Record<string, unknown>;
}

export function useBulkVariations() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const generateVariations = useMutation({
    mutationFn: async (config: BulkVariationConfig): Promise<BulkVariationResult> => {
      const totalVariations = 
        config.agents.length * 
        config.formats.length * 
        config.styles.length * 
        config.count_per_combo;

      setProgress(0);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 500);

      try {
        const { data, error } = await supabase.functions.invoke("ai-bulk-variations", {
          body: {
            brief: config.brief,
            source_media_ids: config.source_media_ids,
            inspiration_ids: config.inspiration_ids,
            variations: {
              agents: config.agents,
              formats: config.formats,
              styles: config.styles,
              count_per_combo: config.count_per_combo
            }
          }
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (error) throw error;
        return data as BulkVariationResult;
      } catch (err) {
        clearInterval(progressInterval);
        setProgress(0);
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["content-queue"] });
      toast.success(`Created ${data.variations_created} content variations!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate variations: ${error.message}`);
    }
  });

  const autoTagFile = useMutation({
    mutationFn: async (params: {
      file_id: string;
      file_url: string;
      file_type: string;
      original_filename?: string;
    }): Promise<AutoTagResult> => {
      const { data, error } = await supabase.functions.invoke("ai-auto-tag", {
        body: params
      });

      if (error) throw error;
      return data as AutoTagResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
      if (data.tags.length > 0) {
        toast.success(`Auto-tagged with ${data.tags.length} tags`);
      }
    },
    onError: (error: Error) => {
      console.error("Auto-tag error:", error);
      // Don't show error toast - auto-tagging is optional
    }
  });

  const estimateVariationCount = (config: Partial<BulkVariationConfig>): number => {
    return (
      (config.agents?.length || 0) *
      (config.formats?.length || 0) *
      (config.styles?.length || 0) *
      (config.count_per_combo || 1)
    );
  };

  return {
    generateVariations,
    autoTagFile,
    estimateVariationCount,
    progress,
    isGenerating: generateVariations.isPending,
    isTagging: autoTagFile.isPending
  };
}
