/**
 * RENDER TRANSLATION LAYER (RTL)
 * 
 * Converts CreativeAssembly → Creatomate render JSON
 * Handles:
 * - Timeline structure
 * - Text overlays with timing
 * - Transitions and effects
 * - Multi-platform exports
 * - Brand color injection
 */

import { CreativeAssembly, CreativeOverlay, CreativeSequence, Platform } from "./creativeAssembler";

export interface CreatomateModifications {
  [key: string]: string | number | boolean | null;
}

export interface CreatomateTimeline {
  template_id?: string;
  modifications: CreatomateModifications;
  output_format?: "mp4" | "gif" | "png";
  width?: number;
  height?: number;
  frame_rate?: number;
}

export interface RenderJob {
  id?: string;
  platform: Platform;
  timeline: CreatomateTimeline;
  status?: "pending" | "rendering" | "complete" | "failed";
  output_url?: string;
}

export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
}

export interface TranslatorOptions {
  creative: CreativeAssembly;
  videoUrl: string;
  brandColors?: BrandColors;
  templateId?: string;
  musicUrl?: string;
  platforms?: Platform[];
  logoUrl?: string;
}

// Platform-specific dimensions
const PLATFORM_DIMENSIONS: Record<Platform, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1920 },
  tiktok: { width: 1080, height: 1920 },
  youtube_shorts: { width: 1080, height: 1920 },
  facebook: { width: 1080, height: 1080 },
};

/**
 * Translate creative assembly to Creatomate format
 */
export function translateToCreatomate(options: TranslatorOptions): CreatomateTimeline {
  const { creative, videoUrl, brandColors, templateId, musicUrl, logoUrl } = options;

  const modifications: CreatomateModifications = {
    // Video source
    "Video.source": videoUrl,
  };

  // Hook text overlay
  if (creative.hook) {
    modifications["Text-1.text"] = creative.hook;
    modifications["Text-1.time"] = 0;
    modifications["Text-1.duration"] = 2.5;
  }

  // CTA overlay
  if (creative.cta) {
    modifications["Text-2.text"] = creative.cta;
    // Position CTA near end
    const endTime = creative.sequence.length > 0
      ? Math.max(...creative.sequence.map(s => s.end))
      : 15;
    modifications["Text-2.time"] = Math.max(0, endTime - 3);
    modifications["Text-2.duration"] = 3;
  }

  // Brand colors
  if (brandColors?.primary) {
    modifications["Text-1.fill_color"] = brandColors.primary;
    modifications["Overlay.fill_color"] = brandColors.primary;
  }
  if (brandColors?.secondary) {
    modifications["Text-2.fill_color"] = brandColors.secondary;
  }

  // Music track
  if (musicUrl) {
    modifications["Audio.source"] = musicUrl;
  }

  // Logo overlay
  if (logoUrl) {
    modifications["Logo.source"] = logoUrl;
  }

  // Additional overlays
  creative.overlays.forEach((overlay, index) => {
    if (index > 1) { // Skip first 2 (hook and CTA already handled)
      const key = `Overlay-${index - 1}`;
      modifications[`${key}.text`] = overlay.text;
      modifications[`${key}.time`] = overlay.start;
      modifications[`${key}.duration`] = overlay.end - overlay.start;
    }
  });

  return {
    template_id: templateId || "b99d8a90-2a85-4ec7-83c4-dfe060ceeedd",
    modifications,
    output_format: "mp4",
    width: 1080,
    height: 1920,
    frame_rate: 30,
  };
}

/**
 * Create render jobs for multiple platforms
 */
export function createMultiPlatformRenderJobs(options: TranslatorOptions): RenderJob[] {
  const platforms = options.platforms || ["instagram"];
  
  return platforms.map(platform => {
    const dimensions = PLATFORM_DIMENSIONS[platform];
    const timeline = translateToCreatomate({
      ...options,
      platforms: [platform],
    });
    
    // Adjust dimensions for platform
    timeline.width = dimensions.width;
    timeline.height = dimensions.height;
    
    // Platform-specific adjustments
    if (platform === "facebook") {
      // Square format for Facebook
      timeline.modifications["Video.fit"] = "cover";
    }
    
    return {
      platform,
      timeline,
      status: "pending" as const,
    };
  });
}

/**
 * Build advanced timeline with transitions
 */
export function buildAdvancedTimeline(
  creative: CreativeAssembly,
  videoUrl: string,
  options?: {
    brandColors?: BrandColors;
    musicUrl?: string;
  }
): object {
  const timeline = {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    frame_rate: 30,
    elements: [] as object[],
  };

  // Add video track with clips
  const videoTrack = {
    type: "video",
    source: videoUrl,
    clips: creative.sequence.map(seq => ({
      time: seq.start,
      duration: seq.end - seq.start,
      transition: mapTransition(seq.transition),
      playback_rate: seq.speed || 1.0,
    })),
  };
  timeline.elements.push(videoTrack);

  // Add text overlays
  creative.overlays.forEach(overlay => {
    timeline.elements.push({
      type: "text",
      text: overlay.text,
      time: overlay.start,
      duration: overlay.end - overlay.start,
      y: mapPosition(overlay.position),
      font_family: "Montserrat",
      font_weight: overlay.style === "bold" ? 700 : 400,
      font_size: overlay.style === "bold" ? 72 : 48,
      fill_color: options?.brandColors?.primary || "#ffffff",
      stroke_color: "#000000",
      stroke_width: 2,
      animations: [
        {
          type: mapAnimation(overlay.animation),
          time: "start",
          duration: 0.3,
        },
      ],
    });
  });

  // Add music track
  if (options?.musicUrl) {
    timeline.elements.push({
      type: "audio",
      source: options.musicUrl,
      volume: 0.7,
    });
  }

  return timeline;
}

/**
 * Map transition type to Creatomate format
 */
function mapTransition(transition?: CreativeSequence["transition"]): string | null {
  switch (transition) {
    case "fade": return "fade";
    case "zoom": return "zoom";
    case "swipe": return "slide";
    case "cut":
    case "none":
    default: return null;
  }
}

/**
 * Map position to Y coordinate
 */
function mapPosition(position?: CreativeOverlay["position"]): string {
  switch (position) {
    case "top": return "15%";
    case "center": return "50%";
    case "bottom":
    default: return "85%";
  }
}

/**
 * Map animation type
 */
function mapAnimation(animation?: CreativeOverlay["animation"]): string {
  switch (animation) {
    case "slide": return "slide-in";
    case "pop": return "scale";
    case "typewriter": return "text-reveal";
    case "fade":
    default: return "fade";
  }
}

/**
 * Generate thumbnail from best frame
 */
export function generateThumbnailSpec(creative: CreativeAssembly): object {
  // Find the best scene for thumbnail (usually reveal or high-score scene)
  const bestScene = creative.sequence.find(s => s.label === "reveal_shot")
    || creative.sequence.sort((a, b) => (b.start > a.start ? -1 : 1))[0];
  
  return {
    output_format: "png",
    width: 1080,
    height: 1920,
    snapshot_time: bestScene?.start || 2,
  };
}

/**
 * Export creative as JSON for debugging/storage
 */
export function exportCreativeAsJSON(creative: CreativeAssembly): string {
  return JSON.stringify(creative, null, 2);
}

/**
 * Validate timeline before sending to Creatomate
 */
export function validateTimeline(timeline: CreatomateTimeline): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!timeline.modifications["Video.source"]) {
    errors.push("Missing video source");
  }

  if (!timeline.template_id && Object.keys(timeline.modifications).length === 0) {
    errors.push("No template or modifications provided");
  }

  if (timeline.width && (timeline.width < 100 || timeline.width > 4096)) {
    errors.push("Invalid width: must be between 100 and 4096");
  }

  if (timeline.height && (timeline.height < 100 || timeline.height > 4096)) {
    errors.push("Invalid height: must be between 100 and 4096");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
