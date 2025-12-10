/**
 * VIDEO INTELLIGENCE ENGINE (VIE)
 * 
 * Analyzes uploaded videos using AI to detect:
 * - Scene segments with quality scores
 * - Best hook moments
 * - Installer action detection
 * - Before/after transformations
 * - Vehicle type and wrap color
 * - Speech transcription
 * - Shot types (cinematic, detail, B-roll)
 */

import { supabase } from "@/integrations/supabase/client";

export interface AnalyzedScene {
  start: number;
  end: number;
  score: number;
  label?: "hook_action" | "reveal_shot" | "detail" | "b-roll" | "talking_head" | "before" | "after" | "transition";
  speech?: string;
  action?: "applying_vinyl" | "squeegee" | "heat_gun" | "cleaning" | "reveal" | "comparison";
}

export interface VideoAnalysis {
  scenes: AnalyzedScene[];
  transcript?: string;
  keywords: string[];
  detected_vehicle?: string;
  wrap_color?: string;
  wrap_finish?: "gloss" | "matte" | "satin" | "metallic" | "chrome";
  shot_types: string[];
  summary?: string;
  suggestions?: string[];
  best_hook_scene?: AnalyzedScene;
  duration_seconds?: number;
  energy_level?: "low" | "medium" | "high";
  content_rating?: number;
}

export interface VideoAnalyzerOptions {
  playbackUrl: string;
  muxPlaybackId?: string;
  thumbnailUrl?: string;
  existingTranscript?: string;
  duration?: number;
}

/**
 * Analyzes a video and returns structured intelligence data
 */
export async function analyzeVideo(options: VideoAnalyzerOptions): Promise<VideoAnalysis> {
  const { playbackUrl, muxPlaybackId, thumbnailUrl, existingTranscript, duration } = options;

  if (!playbackUrl) {
    throw new Error("Playback URL required for video analysis");
  }

  try {
    // Call the AI video process edge function for analysis
    const { data, error } = await supabase.functions.invoke("ai-video-process", {
      body: {
        action: "ai_enhance",
        fileUrl: playbackUrl,
        transcript: existingTranscript || "",
      },
    });

    if (error) {
      console.error("Video analysis error:", error);
      throw error;
    }

    const result = data?.result || {};

    // Build structured analysis from AI response
    const scenes: AnalyzedScene[] = [];
    
    // Parse cut recommendations into scenes
    if (result.cuts && Array.isArray(result.cuts)) {
      result.cuts.forEach((cut: any, index: number) => {
        scenes.push({
          start: cut.start || index * 3,
          end: cut.end || (index + 1) * 3,
          score: cut.score || 0.7,
          label: detectSceneLabel(cut.description || ""),
          action: detectAction(cut.description || ""),
        });
      });
    }

    // Find best hook scene (highest score in first 5 seconds)
    const hookCandidates = scenes.filter(s => s.start < 5);
    const best_hook_scene = hookCandidates.length > 0
      ? hookCandidates.reduce((a, b) => (a.score > b.score ? a : b))
      : scenes[0];

    // Extract keywords from recommendations
    const keywords: string[] = [];
    if (result.color_grading) keywords.push("color_grading");
    if (result.transitions?.length > 0) keywords.push("transitions");
    if (result.text_overlays?.length > 0) keywords.push("overlays");
    if (result.speed_ramps?.length > 0) keywords.push("dynamic_pacing");

    return {
      scenes,
      transcript: existingTranscript,
      keywords,
      detected_vehicle: extractVehicle(existingTranscript || ""),
      wrap_color: extractWrapColor(existingTranscript || ""),
      shot_types: detectShotTypes(scenes),
      summary: result.summary || generateSummary(scenes),
      suggestions: result.recommendations || [],
      best_hook_scene,
      duration_seconds: duration,
      energy_level: calculateEnergyLevel(scenes),
      content_rating: calculateContentRating(scenes),
    };
  } catch (error) {
    console.error("Video analysis failed:", error);
    // Return minimal analysis on error
    return {
      scenes: [],
      keywords: [],
      shot_types: [],
      suggestions: ["Unable to analyze video - try again"],
    };
  }
}

/**
 * Detect scene label from description
 */
function detectSceneLabel(description: string): AnalyzedScene["label"] {
  const lower = description.toLowerCase();
  if (lower.includes("hook") || lower.includes("attention")) return "hook_action";
  if (lower.includes("reveal") || lower.includes("final")) return "reveal_shot";
  if (lower.includes("detail") || lower.includes("close")) return "detail";
  if (lower.includes("before")) return "before";
  if (lower.includes("after")) return "after";
  if (lower.includes("talking") || lower.includes("speaking")) return "talking_head";
  if (lower.includes("transition")) return "transition";
  return "b-roll";
}

/**
 * Detect installer action from description
 */
function detectAction(description: string): AnalyzedScene["action"] | undefined {
  const lower = description.toLowerCase();
  if (lower.includes("vinyl") || lower.includes("applying") || lower.includes("wrap")) return "applying_vinyl";
  if (lower.includes("squeegee")) return "squeegee";
  if (lower.includes("heat") || lower.includes("gun")) return "heat_gun";
  if (lower.includes("clean")) return "cleaning";
  if (lower.includes("reveal") || lower.includes("unwrap")) return "reveal";
  if (lower.includes("before") && lower.includes("after")) return "comparison";
  return undefined;
}

/**
 * Extract vehicle info from transcript
 */
function extractVehicle(transcript: string): string | undefined {
  const vehiclePatterns = [
    /(?:Tesla|Ford|Chevy|Chevrolet|BMW|Mercedes|Audi|Porsche|Lamborghini|Ferrari|McLaren|Corvette|Mustang|Camaro|Challenger|Charger|Bronco|F-?150|Silverado|Ram|Tacoma|Tundra|Model [SX3Y]|Cybertruck)/gi,
  ];
  
  for (const pattern of vehiclePatterns) {
    const match = transcript.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

/**
 * Extract wrap color from transcript
 */
function extractWrapColor(transcript: string): string | undefined {
  const colorPatterns = [
    /(?:satin|matte|gloss|metallic|chrome)?\s*(?:black|white|red|blue|green|yellow|orange|purple|pink|gray|grey|silver|gold|bronze|copper|teal|navy|midnight|arctic|desert|forest)/gi,
  ];
  
  for (const pattern of colorPatterns) {
    const match = transcript.match(pattern);
    if (match) return match[0].trim();
  }
  return undefined;
}

/**
 * Detect shot types from scenes
 */
function detectShotTypes(scenes: AnalyzedScene[]): string[] {
  const types = new Set<string>();
  scenes.forEach(scene => {
    if (scene.label) types.add(scene.label);
    if (scene.action) types.add(scene.action);
  });
  return Array.from(types);
}

/**
 * Generate summary from scenes
 */
function generateSummary(scenes: AnalyzedScene[]): string {
  if (scenes.length === 0) return "Video ready for analysis";
  const hasReveal = scenes.some(s => s.label === "reveal_shot");
  const hasBeforeAfter = scenes.some(s => s.label === "before" || s.label === "after");
  
  if (hasReveal && hasBeforeAfter) return "Transformation video with before/after reveal";
  if (hasReveal) return "Wrap reveal video";
  if (hasBeforeAfter) return "Before and after comparison";
  return `${scenes.length} scene video ready for editing`;
}

/**
 * Calculate energy level from scenes
 */
function calculateEnergyLevel(scenes: AnalyzedScene[]): "low" | "medium" | "high" {
  if (scenes.length === 0) return "medium";
  const avgDuration = scenes.reduce((sum, s) => sum + (s.end - s.start), 0) / scenes.length;
  if (avgDuration < 2) return "high";
  if (avgDuration < 4) return "medium";
  return "low";
}

/**
 * Calculate content rating (0-100)
 */
function calculateContentRating(scenes: AnalyzedScene[]): number {
  if (scenes.length === 0) return 50;
  const avgScore = scenes.reduce((sum, s) => sum + s.score, 0) / scenes.length;
  const hasHook = scenes.some(s => s.label === "hook_action");
  const hasReveal = scenes.some(s => s.label === "reveal_shot");
  
  let rating = avgScore * 60;
  if (hasHook) rating += 20;
  if (hasReveal) rating += 20;
  
  return Math.min(100, Math.round(rating));
}
