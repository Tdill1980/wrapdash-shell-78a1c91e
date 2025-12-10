/**
 * Dara Denney's 10 High-Converting Ad Formats
 * Based on her proven viral reel strategies
 */

export type DaraFormat =
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

export interface DaraFormatConfig {
  id: DaraFormat;
  name: string;
  emoji: string;
  psychology: string;
  best_for: string[];
  structure: string;
  hooks: string[];
  messaging_tips: string[];
  visual_style: {
    text_position: "top" | "center" | "bottom" | "split";
    text_style: "bold-impact" | "handwritten" | "clean-minimal" | "ugc-raw";
    max_text_length: number;
    recommended_clips: number;
    clip_duration: string;
  };
}

export const DARA_FORMATS: Record<DaraFormat, DaraFormatConfig> = {
  grid_style: {
    id: "grid_style",
    name: "Grid Style",
    emoji: "📊",
    psychology: "Completes a subconscious loop - eyes trail left-to-right, top-to-bottom. Psychologically pleasing.",
    best_for: ["bundles", "multiple products", "different colors/SKUs", "collections"],
    structure: "2x2 or 3x3 grid of product shots with messaging overlay",
    hooks: ["The perfect set", "All you need", "Mix & match"],
    messaging_tips: [
      "Value-based messaging often wins",
      "Specific routines ('10-minute exercise') beat generic benefits",
      "Test multiple messaging variants"
    ],
    visual_style: {
      text_position: "center",
      text_style: "bold-impact",
      max_text_length: 15,
      recommended_clips: 4,
      clip_duration: "2-3s each"
    }
  },

  egc_warehouse: {
    id: "egc_warehouse",
    name: "EGC Warehouse",
    emoji: "📦",
    psychology: "Employee-generated content builds authenticity. Behind-scenes creates trust.",
    best_for: ["product packaging", "fulfillment reveals", "behind-the-scenes"],
    structure: "Employee in warehouse/workspace showing product or process",
    hooks: ["POV:", "Day in the life", "Watch me pack"],
    messaging_tips: [
      "Green screen works as well as physical location",
      "Works for both images and video",
      "Show the human behind the brand"
    ],
    visual_style: {
      text_position: "top",
      text_style: "ugc-raw",
      max_text_length: 12,
      recommended_clips: 3,
      clip_duration: "3-5s each"
    }
  },

  founders_objection: {
    id: "founders_objection",
    name: "Founders + Objection",
    emoji: "💬",
    psychology: "Founder credibility + directly addressing anxiety = trust builder",
    best_for: ["price objections", "FAQ handling", "building trust", "pre-purchase anxiety"],
    structure: "Lo-fi founder video with TikTok response bubble handling objection",
    hooks: ["Is it worth it?", "Why so expensive?", "Does this actually work?"],
    messaging_tips: [
      "Start with common objections: price, quality, timeline",
      "Speak directly to camera",
      "Authentic > polished"
    ],
    visual_style: {
      text_position: "top",
      text_style: "ugc-raw",
      max_text_length: 20,
      recommended_clips: 1,
      clip_duration: "15-30s"
    }
  },

  creator_testimonial: {
    id: "creator_testimonial",
    name: "Creator Testimonial",
    emoji: "⭐",
    psychology: "Social proof from real people. Single testimonial > compilations for scaling.",
    best_for: ["social proof", "product demos", "transformations", "reviews"],
    structure: "Single creator giving authentic testimonial with reaction hook",
    hooks: ["I can't believe...", "This changed...", "Watch what happens"],
    messaging_tips: [
      "Reaction opening hooks work best",
      "Trigger words in hooks: 'this', 'look', 'watch'",
      "Problem-solution format is bread & butter"
    ],
    visual_style: {
      text_position: "bottom",
      text_style: "clean-minimal",
      max_text_length: 18,
      recommended_clips: 1,
      clip_duration: "15-45s"
    }
  },

  ai_enhanced: {
    id: "ai_enhanced",
    name: "AI Enhanced",
    emoji: "🤖",
    psychology: "Speed + scale + testing. AI enables rapid iteration.",
    best_for: ["rapid testing", "voice-over content", "green screen", "deep-fake style"],
    structure: "AI-generated or enhanced content with human elements",
    hooks: ["You won't believe", "AI found this", "This is crazy"],
    messaging_tips: [
      "Use AI for voiceover to test new scripts fast",
      "Green screen + stock footage = instant content",
      "AI enables 100s of variations to find winners"
    ],
    visual_style: {
      text_position: "center",
      text_style: "bold-impact",
      max_text_length: 15,
      recommended_clips: 4,
      clip_duration: "2-4s each"
    }
  },

  text_heavy: {
    id: "text_heavy",
    name: "Text Heavy",
    emoji: "📝",
    psychology: "Text creates curiosity gaps. Works incredibly well during sales.",
    best_for: ["sales/promos", "announcements", "listicles", "educational"],
    structure: "Bold text overlays driving the narrative, video as background",
    hooks: ["3 things you need", "Don't miss this", "The truth about"],
    messaging_tips: [
      "Annihilates during Black Friday/Cyber Monday",
      "Works for both video and image",
      "Let text drive the story, video supports"
    ],
    visual_style: {
      text_position: "center",
      text_style: "bold-impact",
      max_text_length: 12,
      recommended_clips: 4,
      clip_duration: "2-3s each"
    }
  },

  dpa_catalog: {
    id: "dpa_catalog",
    name: "DPA / Catalog",
    emoji: "🛍️",
    psychology: "Runs on different algorithm. Often top performer for multi-SKU brands.",
    best_for: ["e-commerce", "multiple SKUs", "retargeting", "product discovery"],
    structure: "Dynamic product ads from catalog feed",
    hooks: ["Just for you", "Based on what you like", "Trending now"],
    messaging_tips: [
      "Catalog ads often outperform custom creative",
      "Different algorithm = different results",
      "Must-test for any brand with multiple products"
    ],
    visual_style: {
      text_position: "bottom",
      text_style: "clean-minimal",
      max_text_length: 20,
      recommended_clips: 1,
      clip_duration: "6-15s"
    }
  },

  negative_marketing: {
    id: "negative_marketing",
    name: "Negative Marketing",
    emoji: "😬",
    psychology: "Negative emotions are powerful. Trigger words create visceral reactions.",
    best_for: ["standing out", "addressing pain points", "creating urgency"],
    structure: "1-star reviews or negative hook that flips to positive",
    hooks: ["I regret...", "Don't make this mistake", "I was so embarrassed"],
    messaging_tips: [
      "Trigger words: regret, embarrassed, hate",
      "0 or 1 star review ads crushing for some brands",
      "Lean into negative messaging in creator variations"
    ],
    visual_style: {
      text_position: "center",
      text_style: "bold-impact",
      max_text_length: 15,
      recommended_clips: 3,
      clip_duration: "3-5s each"
    }
  },

  ugly_ads: {
    id: "ugly_ads",
    name: "Ugly Ads / Lo-Fi",
    emoji: "📱",
    psychology: "Authenticity > polish. Meta themselves recommend lo-fi for Reels.",
    best_for: ["authenticity", "quick production", "testing", "standing out"],
    structure: "Raw, unpolished content - post-it notes, one-take videos, POV shots",
    hooks: ["POV:", "Okay so", "Real talk"],
    messaging_tips: [
      "5-minute ad challenge: what can you make right now?",
      "One-shot, one-take = authentic energy",
      "Post-it note ads still crush",
      "Think: how would you explain this to a friend?"
    ],
    visual_style: {
      text_position: "center",
      text_style: "handwritten",
      max_text_length: 12,
      recommended_clips: 1,
      clip_duration: "10-30s"
    }
  },

  brandformance: {
    id: "brandformance",
    name: "Brandformance",
    emoji: "🚀",
    psychology: "Organic content that works gets amplified. Authenticity starts organic.",
    best_for: ["scaling organic wins", "brand building", "awareness + conversion"],
    structure: "Organic content that performed well, now with ad spend",
    hooks: ["Y'all loved this", "This went viral", "Had to share"],
    messaging_tips: [
      "Put ad spend behind organic content that's working",
      "Authenticity starts at organic level, scale with paid",
      "Don't over-edit organic winners"
    ],
    visual_style: {
      text_position: "bottom",
      text_style: "ugc-raw",
      max_text_length: 18,
      recommended_clips: 1,
      clip_duration: "15-60s"
    }
  }
};

export const FORMAT_OPTIONS = Object.values(DARA_FORMATS).map(f => ({
  id: f.id,
  name: f.name,
  emoji: f.emoji,
  description: f.psychology.substring(0, 60) + "..."
}));

/**
 * Get format-specific prompt instructions for AI
 */
export function getFormatPrompt(format: DaraFormat): string {
  const config = DARA_FORMATS[format];
  
  return `
═══════════════════════════════════════════════════════════════
🎯 SELECTED FORMAT: ${config.emoji} ${config.name.toUpperCase()}
═══════════════════════════════════════════════════════════════

PSYCHOLOGY: ${config.psychology}

BEST FOR: ${config.best_for.join(", ")}

STRUCTURE: ${config.structure}

HOOK EXAMPLES (use these styles):
${config.hooks.map(h => `  - "${h}"`).join("\n")}

MESSAGING TIPS:
${config.messaging_tips.map(t => `  • ${t}`).join("\n")}

VISUAL REQUIREMENTS:
- Text Position: ${config.visual_style.text_position}
- Text Style: ${config.visual_style.text_style}
- Max Text Length: ${config.visual_style.max_text_length} characters
- Recommended Clips: ${config.visual_style.recommended_clips}
- Clip Duration: ${config.visual_style.clip_duration}

CRITICAL: Generate content that MATCHES this specific format's style and energy.
`;
}

/**
 * Truncate text at word boundaries
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  // If there's a space, cut at the word boundary
  if (lastSpace > maxLength * 0.5) {
    return truncated.substring(0, lastSpace);
  }
  
  // Otherwise just truncate
  return truncated;
}

/**
 * Format text for safe zone display (max 3 words per line)
 */
export function formatForSafeZone(text: string): string {
  const words = text.trim().split(/\s+/);
  
  if (words.length <= 3) return words.join(" ");
  
  // Split into lines of max 3 words
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += 3) {
    lines.push(words.slice(i, i + 3).join(" "));
  }
  
  // Return max 2 lines
  return lines.slice(0, 2).join("\n");
}
