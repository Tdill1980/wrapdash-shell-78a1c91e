/**
 * CREATIVE ASSEMBLY ENGINE (CAE)
 * 
 * Given video intelligence, this engine decides:
 * - Format (reel, story, ad, static, carousel)
 * - Hook text
 * - Pacing and sequence
 * - Overlay placements
 * - Captions and CTAs
 * - Template style
 * - Platform-specific adjustments
 */

import { VideoAnalysis, AnalyzedScene } from "./videoAnalyzer";

export type ContentFormat = "reel" | "story" | "ad" | "static" | "carousel";
export type EditorMode = "smart_assist" | "auto_create" | "autonomous";
export type Platform = "instagram" | "tiktok" | "youtube_shorts" | "facebook";

export interface CreativeOverlay {
  text: string;
  start: number;
  end: number;
  style: "bold" | "minimal" | "branded" | "caption" | "cta";
  position?: "top" | "center" | "bottom";
  animation?: "fade" | "slide" | "pop" | "typewriter";
}

export interface CreativeSequence {
  start: number;
  end: number;
  label?: string;
  transition?: "cut" | "fade" | "zoom" | "swipe" | "none";
  speed?: number;
}

export interface CreativeAssembly {
  format: ContentFormat;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  overlays: CreativeOverlay[];
  sequence: CreativeSequence[];
  template_style: string;
  music_suggestion?: string;
  music_energy?: "low" | "medium" | "high";
  duration_target?: number;
  platform_adjustments?: Record<Platform, Partial<CreativeAssembly>>;
  creative_rationale?: string;
}

export interface AssemblerOptions {
  analysis: VideoAnalysis;
  mode?: EditorMode;
  platform?: Platform;
  voiceProfile?: {
    tone?: string;
    vocabulary?: string[];
    cta_style?: string;
    brand_name?: string;
  };
  targetDuration?: number;
  includeHashtags?: boolean;
}

/**
 * Assembles a creative plan from video analysis
 */
export function assembleCreative(options: AssemblerOptions): CreativeAssembly {
  const {
    analysis,
    mode = "smart_assist",
    platform = "instagram",
    voiceProfile,
    targetDuration = 15,
    includeHashtags = true,
  } = options;

  // Choose best hook
  const hook = generateHook(analysis, voiceProfile);
  
  // Build caption
  const caption = generateCaption(analysis, voiceProfile);
  
  // Choose CTA
  const cta = generateCTA(analysis, voiceProfile);
  
  // Generate hashtags
  const hashtags = includeHashtags ? generateHashtags(analysis) : [];
  
  // Build sequence from best scenes
  const sequence = buildSequence(analysis, targetDuration);
  
  // Create overlays
  const overlays = buildOverlays(analysis, hook, cta, sequence);
  
  // Determine template style
  const template_style = determineTemplateStyle(mode, analysis);
  
  // Music suggestion
  const music_suggestion = suggestMusic(analysis);
  
  return {
    format: determineFormat(analysis, platform),
    hook,
    caption,
    cta,
    hashtags,
    overlays,
    sequence,
    template_style,
    music_suggestion,
    music_energy: analysis.energy_level,
    duration_target: targetDuration,
    creative_rationale: generateRationale(analysis, mode),
  };
}

/**
 * Generate hook text
 */
function generateHook(analysis: VideoAnalysis, voiceProfile?: AssemblerOptions["voiceProfile"]): string {
  const vehicle = analysis.detected_vehicle || "this ride";
  const color = analysis.wrap_color || "stunning finish";
  
  const hookTemplates = [
    `Watch this ${vehicle} transformation 🔥`,
    `${vehicle} gets a ${color} makeover`,
    `This ${color} wrap is INSANE`,
    `Before vs After: ${vehicle}`,
    `POV: Your ${vehicle} could look like this`,
    `Wait for the reveal... 👀`,
  ];
  
  // Pick based on content type
  if (analysis.shot_types.includes("before") || analysis.shot_types.includes("after")) {
    return `Before vs After: ${vehicle}`;
  }
  if (analysis.shot_types.includes("reveal_shot")) {
    return `Wait for the reveal... 👀`;
  }
  
  // Apply brand voice if available
  if (voiceProfile?.tone === "luxury") {
    return `Experience the transformation: ${vehicle}`;
  }
  if (voiceProfile?.tone === "street") {
    return `${vehicle} goes CRAZY in ${color} 🔥`;
  }
  
  return hookTemplates[Math.floor(Math.random() * hookTemplates.length)];
}

/**
 * Generate caption
 */
function generateCaption(analysis: VideoAnalysis, voiceProfile?: AssemblerOptions["voiceProfile"]): string {
  const vehicle = analysis.detected_vehicle || "this vehicle";
  const color = analysis.wrap_color || "a custom wrap";
  const brand = voiceProfile?.brand_name || "our shop";
  
  const captions = [
    `We transformed ${vehicle} with ${color}. The results speak for themselves. Ready to transform your ride? DM us for a quote.`,
    `Another day, another transformation. ${vehicle} looking fresh in ${color}. Tag someone who needs this.`,
    `${vehicle} owner came to us with a vision. We made it reality. This is what ${brand} does best.`,
  ];
  
  return captions[Math.floor(Math.random() * captions.length)];
}

/**
 * Generate CTA
 */
function generateCTA(analysis: VideoAnalysis, voiceProfile?: AssemblerOptions["voiceProfile"]): string {
  const ctaOptions = [
    "Tap link in bio for a quote",
    "DM us to get started",
    "Book your transformation today",
    "Get a free quote →",
    "Your ride deserves this. DM now.",
  ];
  
  if (voiceProfile?.cta_style === "soft") {
    return "Learn more about our services";
  }
  if (voiceProfile?.cta_style === "urgent") {
    return "Limited slots available - DM NOW";
  }
  
  return ctaOptions[Math.floor(Math.random() * ctaOptions.length)];
}

/**
 * Generate hashtags
 */
function generateHashtags(analysis: VideoAnalysis): string[] {
  const base = ["#wrap", "#vinylwrap", "#carwrap", "#transformation"];
  const extras: string[] = [];
  
  if (analysis.detected_vehicle) {
    extras.push(`#${analysis.detected_vehicle.toLowerCase().replace(/\s+/g, "")}`);
  }
  if (analysis.wrap_color) {
    extras.push(`#${analysis.wrap_color.toLowerCase().replace(/\s+/g, "")}wrap`);
  }
  if (analysis.shot_types.includes("reveal_shot")) {
    extras.push("#wrapreveal", "#beforeandafter");
  }
  
  return [...base, ...extras].slice(0, 15);
}

/**
 * Build sequence from scenes
 */
function buildSequence(analysis: VideoAnalysis, targetDuration: number): CreativeSequence[] {
  const scenes = analysis.scenes
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  
  if (scenes.length === 0) {
    return [{ start: 0, end: targetDuration, transition: "none" }];
  }
  
  return scenes.map((scene, index) => ({
    start: scene.start,
    end: scene.end,
    label: scene.label,
    transition: index === 0 ? "none" : "cut",
    speed: scene.label === "hook_action" ? 1.2 : 1.0,
  }));
}

/**
 * Build overlays
 */
function buildOverlays(
  analysis: VideoAnalysis,
  hook: string,
  cta: string,
  sequence: CreativeSequence[]
): CreativeOverlay[] {
  const overlays: CreativeOverlay[] = [];
  
  // Hook overlay at start
  overlays.push({
    text: hook,
    start: 0,
    end: 2.5,
    style: "bold",
    position: "center",
    animation: "pop",
  });
  
  // CTA at end
  const lastScene = sequence[sequence.length - 1];
  if (lastScene) {
    overlays.push({
      text: cta,
      start: lastScene.end - 3,
      end: lastScene.end,
      style: "cta",
      position: "bottom",
      animation: "slide",
    });
  }
  
  // Vehicle/color callout in middle
  if (analysis.detected_vehicle && sequence.length > 2) {
    const midScene = sequence[Math.floor(sequence.length / 2)];
    overlays.push({
      text: `${analysis.detected_vehicle} • ${analysis.wrap_color || "Custom Wrap"}`,
      start: midScene.start,
      end: midScene.start + 2,
      style: "minimal",
      position: "bottom",
      animation: "fade",
    });
  }
  
  return overlays;
}

/**
 * Determine template style
 */
function determineTemplateStyle(mode: EditorMode, analysis: VideoAnalysis): string {
  if (mode === "autonomous") return "cinematic-premium";
  if (analysis.energy_level === "high") return "dynamic-fast-cut";
  if (analysis.energy_level === "low") return "elegant-slow";
  return "balanced-standard";
}

/**
 * Determine content format
 */
function determineFormat(analysis: VideoAnalysis, platform: Platform): ContentFormat {
  if (platform === "instagram" || platform === "tiktok") return "reel";
  if (analysis.duration_seconds && analysis.duration_seconds < 10) return "story";
  return "reel";
}

/**
 * Suggest music
 */
function suggestMusic(analysis: VideoAnalysis): string {
  if (analysis.energy_level === "high") return "Upbeat trap / electronic";
  if (analysis.energy_level === "low") return "Chill ambient / lo-fi";
  return "Modern hip-hop / R&B";
}

/**
 * Generate creative rationale
 */
function generateRationale(analysis: VideoAnalysis, mode: EditorMode): string {
  const parts: string[] = [];
  
  parts.push(`Mode: ${mode.replace("_", " ")}`);
  parts.push(`Energy: ${analysis.energy_level || "medium"}`);
  parts.push(`Scenes: ${analysis.scenes.length} detected`);
  
  if (analysis.best_hook_scene) {
    parts.push(`Best hook: ${analysis.best_hook_scene.label || "action"} at ${analysis.best_hook_scene.start}s`);
  }
  
  if (analysis.content_rating) {
    parts.push(`Content quality: ${analysis.content_rating}/100`);
  }
  
  return parts.join(" • ");
}

/**
 * Generate multiple variants for A/B testing
 */
export function generateVariants(options: AssemblerOptions, count: number = 3): CreativeAssembly[] {
  const variants: CreativeAssembly[] = [];
  
  for (let i = 0; i < count; i++) {
    // Slightly randomize parameters for each variant
    const variant = assembleCreative({
      ...options,
      targetDuration: options.targetDuration ? options.targetDuration + (i - 1) * 2 : 15,
    });
    
    // Vary the hook
    if (i === 1 && variant.hook) {
      variant.hook = variant.hook.toUpperCase();
    }
    if (i === 2) {
      variant.template_style = "minimal-clean";
    }
    
    variants.push(variant);
  }
  
  return variants;
}
