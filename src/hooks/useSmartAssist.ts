import { useState, useCallback } from "react";
import { analyzeVideo, VideoAnalysis } from "@/lib/editor-brain/videoAnalyzer";
import { assembleCreative, CreativeAssembly, CreativeSequence } from "@/lib/editor-brain/creativeAssembler";
import { toast } from "sonner";

interface SmartAssistClip {
  id: string;
  url?: string;
  file_url?: string;
  duration?: number;
  duration_seconds?: number;
  name?: string;
}

export interface SmartAssistResult {
  analysis: VideoAnalysis;
  creative: CreativeAssembly;
}

export function useSmartAssist() {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [creative, setCreative] = useState<CreativeAssembly | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSmartAssist = useCallback(async (
    clips: SmartAssistClip[], 
    userPrompt?: string
  ): Promise<SmartAssistResult | null> => {
    if (clips.length === 0) {
      toast.error("No clips to analyze");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Use primary clip for analysis
      const primaryClip = clips[0];
      const clipUrl = primaryClip.url || primaryClip.file_url || "";
      const clipDuration = primaryClip.duration || primaryClip.duration_seconds || 15;

      // Step 1: Analyze video with Editor Brain
      const analysisResult = await analyzeVideo({
        playbackUrl: clipUrl,
        duration: clipDuration,
      });

      // If multiple clips, merge their durations and create combined scenes
      if (clips.length > 1) {
        let currentTime = 0;
        clips.forEach((clip, index) => {
          const duration = clip.duration || clip.duration_seconds || 5;
          if (index > 0) {
            analysisResult.scenes.push({
              start: currentTime,
              end: currentTime + duration,
              score: 0.7 + Math.random() * 0.2,
              label: index === clips.length - 1 ? "reveal_shot" : "b-roll",
            });
          }
          currentTime += duration;
        });
        analysisResult.duration_seconds = currentTime;
      }

      setAnalysis(analysisResult);

      // Step 2: Assemble creative plan with user prompt for context
      const creativePlan = assembleCreative({
        analysis: analysisResult,
        platform: "instagram",
        mode: "smart_assist",
        targetDuration: Math.min(30, analysisResult.duration_seconds || 15),
        userPrompt, // Pass user's prompt for relevant hooks/captions
      });

      setCreative(creativePlan);
      toast.success("Smart Assist analysis complete");

      return { analysis: analysisResult, creative: creativePlan };
    } catch (err) {
      console.error("Smart Assist failed:", err);
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      toast.error("Smart Assist analysis failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setCreative(null);
    setError(null);
  }, []);

  return {
    runSmartAssist,
    analysis,
    creative,
    loading,
    error,
    reset,
  };
}
