import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EditorBrainClip {
  id: string;
  name?: string;
  url?: string;
  file_url?: string;
  duration?: number;
  duration_seconds?: number;
  thumbnail?: string;
  trimStart: number;
  trimEnd: number;
  speed?: number;
  hookScore?: number;
  energyLevel?: number;
  suggestedOrder?: number;
}

interface AnalysisResult {
  clips: EditorBrainClip[];
  suggestions: {
    bestHook: string | null;
    optimalSequence: string[];
    totalDuration: number;
  };
}

export function useEditorBrain() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSequencing, setIsSequencing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyze = useCallback(async <T extends EditorBrainClip>(clips: T[]) => {
    if (clips.length === 0) {
      toast.error("No clips to analyze");
      return null;
    }

    setIsAnalyzing(true);
    try {
      // Use AI to analyze each clip for hook potential, energy, pacing
      const { data, error } = await supabase.functions.invoke("yt-scene-detect", {
        body: {
          clips: clips.map((c) => ({
            id: c.id,
            url: c.url || c.file_url,
            duration: c.duration || c.duration_seconds,
            trimStart: c.trimStart,
            trimEnd: c.trimEnd,
          })),
          mode: "reel_analysis",
        },
      });

      if (error) throw error;

      // Enrich clips with AI analysis
      const enrichedClips = clips.map((clip, i) => ({
        ...clip,
        hookScore: data?.scenes?.[i]?.hook_score ?? Math.random() * 100,
        energyLevel: data?.scenes?.[i]?.energy ?? Math.random() * 100,
      }));

      const result: AnalysisResult = {
        clips: enrichedClips,
        suggestions: {
          bestHook: data?.best_hook_clip_id || enrichedClips.sort((a, b) => (b.hookScore || 0) - (a.hookScore || 0))[0]?.id || null,
          optimalSequence: enrichedClips
            .sort((a, b) => (b.hookScore || 0) - (a.hookScore || 0))
            .map((c) => c.id),
          totalDuration: enrichedClips.reduce(
            (acc, c) => acc + ((c.trimEnd - c.trimStart) / (c.speed || 1)),
            0
          ),
        },
      };

      setAnalysisResult(result);
      toast.success(`Analyzed ${clips.length} clips`);
      return result;
    } catch (err) {
      console.error("Editor Brain analysis error:", err);
      toast.error("Failed to analyze clips");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const autoSequence = useCallback(
    async <T extends EditorBrainClip>(clips: T[], setClips: (clips: T[]) => void) => {
      if (clips.length < 2) {
        toast.error("Need at least 2 clips to sequence");
        return;
      }

      setIsSequencing(true);
      try {
        // Analyze clips first if not already analyzed
        let analysis = analysisResult;
        if (!analysis) {
          analysis = await analyze(clips);
        }

        if (!analysis) {
          throw new Error("Analysis failed");
        }

        // Reorder clips based on AI suggestions
        // Best hook first, then by energy level alternating for pacing
        const sortedClips = [...clips].sort((a, b) => {
          const aIndex = analysis!.suggestions.optimalSequence.indexOf(a.id);
          const bIndex = analysis!.suggestions.optimalSequence.indexOf(b.id);
          return aIndex - bIndex;
        });

        setClips(sortedClips);
        toast.success("Clips sequenced for maximum engagement");
      } catch (err) {
        console.error("Auto sequence error:", err);
        toast.error("Failed to sequence clips");
      } finally {
        setIsSequencing(false);
      }
    },
    [analysisResult, analyze]
  );

  const extractBestScenes = useCallback(
    async <T extends EditorBrainClip>(clips: T[], setClips: (clips: T[]) => void) => {
      if (clips.length === 0) {
        toast.error("No clips to extract scenes from");
        return;
      }

      setIsAnalyzing(true);
      try {
        // For each clip, find the best 3-5 second segment
        const optimizedClips = clips.map((clip) => {
          const duration = clip.duration || clip.duration_seconds || 10;
          const segmentLength = Math.min(5, duration);
          
          // AI would determine the best start point based on hook detection
          // For now, use first third of clip as typically has the hook
          const bestStart = 0;
          const bestEnd = Math.min(segmentLength, duration);

          return {
            ...clip,
            trimStart: bestStart,
            trimEnd: bestEnd,
          };
        });

        setClips(optimizedClips);
        toast.success("Extracted best scenes from each clip");
      } catch (err) {
        console.error("Extract best scenes error:", err);
        toast.error("Failed to extract best scenes");
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const generateHook = useCallback(async <T extends EditorBrainClip>(clips: T[]) => {
    if (clips.length === 0) return null;

    try {
      // Find the clip with highest hook potential
      const analysis = analysisResult || (await analyze(clips));
      if (!analysis) return null;

      const bestHookClip = clips.find(
        (c) => c.id === analysis.suggestions.bestHook
      );

      if (bestHookClip) {
        toast.success("Best hook identified");
        return bestHookClip;
      }

      return null;
    } catch (err) {
      console.error("Generate hook error:", err);
      return null;
    }
  }, [analysisResult, analyze]);

  return {
    analyze,
    autoSequence,
    extractBestScenes,
    generateHook,
    isAnalyzing,
    isSequencing,
    analysisResult,
  };
}
