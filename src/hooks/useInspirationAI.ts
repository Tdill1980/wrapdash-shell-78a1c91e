import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HookItem {
  text: string;
  type: "question" | "statement" | "before_after" | "reveal" | "problem_solution" | "social_proof";
  best_for: "video" | "static" | "both";
  energy_level: "calm" | "medium" | "high";
}

export interface HookFormula {
  formula: string;
  example: string;
  best_for: string;
}

export interface LibraryAnalysis {
  themes: string[];
  hook_patterns: string[];
  content_styles: string[];
  recommendations: string[];
  hook_formulas: HookFormula[];
}

export interface AdPackage {
  ad_type: string;
  platform: string;
  hooks: Array<{
    text: string;
    voiceover: string;
    visual_direction: string;
  }>;
  script: {
    intro: string;
    body: string;
    cta: string;
    total_duration: string;
  };
  text_overlays: Array<{
    timestamp: string;
    text: string;
    style: string;
  }>;
  cta_options: string[];
  caption: string;
  hashtags: string[];
  media_usage: Array<{
    filename: string;
    usage: string;
    timestamp: string;
  }>;
  selected_media: any[];
}

export function useInspirationAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [generatingAd, setGeneratingAd] = useState(false);
  const [libraryAnalysis, setLibraryAnalysis] = useState<LibraryAnalysis | null>(null);
  const [generatedHooks, setGeneratedHooks] = useState<HookItem[]>([]);
  const [adPackage, setAdPackage] = useState<AdPackage | null>(null);

  const analyzeLibrary = async (mediaIds?: string[]) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-from-inspiration", {
        body: { action: "analyze_library", mediaIds }
      });

      if (error) throw error;
      
      setLibraryAnalysis(data);
      toast.success("Library analyzed! Found patterns and hook formulas.");
      return data;
    } catch (err) {
      console.error("Error analyzing library:", err);
      toast.error("Failed to analyze library");
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const generateHooks = async (mediaIds?: string[]) => {
    setGeneratingHooks(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-from-inspiration", {
        body: { action: "generate_hooks", mediaIds }
      });

      if (error) throw error;
      
      setGeneratedHooks(data.hooks || []);
      toast.success(`Generated ${data.hooks?.length || 0} fresh hooks!`);
      return data.hooks;
    } catch (err) {
      console.error("Error generating hooks:", err);
      toast.error("Failed to generate hooks");
      return [];
    } finally {
      setGeneratingHooks(false);
    }
  };

  const generateAd = async (params: {
    mediaIds?: string[];
    adType: "video" | "static" | "carousel";
    platform: string;
    objective: string;
  }) => {
    setGeneratingAd(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-from-inspiration", {
        body: { 
          action: "generate_ad", 
          mediaIds: params.mediaIds,
          adType: params.adType,
          platform: params.platform,
          objective: params.objective
        }
      });

      if (error) throw error;
      
      setAdPackage(data);
      toast.success("Ad package created using your inspiration!");
      return data;
    } catch (err) {
      console.error("Error generating ad:", err);
      toast.error("Failed to generate ad");
      return null;
    } finally {
      setGeneratingAd(false);
    }
  };

  return {
    // State
    analyzing,
    generatingHooks,
    generatingAd,
    libraryAnalysis,
    generatedHooks,
    adPackage,
    // Actions
    analyzeLibrary,
    generateHooks,
    generateAd,
    // Setters
    setLibraryAnalysis,
    setGeneratedHooks,
    setAdPackage,
  };
}
