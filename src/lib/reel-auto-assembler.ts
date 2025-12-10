/**
 * Reel Auto-Assembler
 * Converts Hybrid Output JSON → Creatomate Modifications
 */

interface HybridOutput {
  script?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  overlays?: Array<{ text: string; time: string; style: string }>;
  media_plan?: {
    cuts?: Array<{ description?: string; duration?: string; start?: number; end?: number }>;
    music_suggestion?: string;
    music_url?: string;
    color_palette?: string[];
    layout_template?: string;
  };
}

interface CreatomateModifications {
  [key: string]: string | number | boolean;
}

export function buildCreatomateModifications(
  hybridOutput: HybridOutput,
  videoUrl: string,
  brandColors?: { primary?: string; secondary?: string }
): CreatomateModifications {
  const mods: CreatomateModifications = {
    "Video.source": videoUrl,
  };

  // Hook → Text-1
  if (hybridOutput.hook) {
    mods["Text-1.text"] = hybridOutput.hook;
  }

  // CTA → Text-2
  if (hybridOutput.cta) {
    mods["Text-2.text"] = hybridOutput.cta;
  }

  // Apply brand colors if provided
  if (brandColors?.primary) {
    mods["Text-1.fill_color"] = brandColors.primary;
  }
  if (brandColors?.secondary) {
    mods["Text-2.fill_color"] = brandColors.secondary;
  }

  // Apply colors from media plan
  if (hybridOutput.media_plan?.color_palette && hybridOutput.media_plan.color_palette.length > 0) {
    mods["Text-1.fill_color"] = hybridOutput.media_plan.color_palette[0];
    if (hybridOutput.media_plan.color_palette.length > 1) {
      mods["Text-2.fill_color"] = hybridOutput.media_plan.color_palette[1];
    }
  }

  // Overlays → Additional text layers
  if (hybridOutput.overlays && hybridOutput.overlays.length > 0) {
    hybridOutput.overlays.forEach((overlay, index) => {
      mods[`Overlay-${index + 1}.text`] = overlay.text;
    });
  }

  // Music
  if (hybridOutput.media_plan?.music_url) {
    mods["Audio.source"] = hybridOutput.media_plan.music_url;
  }

  return mods;
}

export function parseOverlayTimings(
  overlays: Array<{ text: string; time: string; style: string }>
): Array<{ text: string; startTime: number; endTime: number; style: string }> {
  return overlays.map((overlay) => {
    const timeParts = overlay.time.split("-").map((t) => parseFloat(t.trim()));
    return {
      text: overlay.text,
      startTime: timeParts[0] || 0,
      endTime: timeParts[1] || timeParts[0] + 2,
      style: overlay.style,
    };
  });
}
