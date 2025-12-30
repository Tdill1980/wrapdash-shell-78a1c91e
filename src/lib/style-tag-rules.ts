/**
 * Style-to-Tag Rules Engine
 * 
 * This module defines the mapping between content styles and required tags.
 * When a user selects a style (e.g., "Ugly Ads / Lo-Fi"), the system will
 * filter clips to only include those with matching tags.
 */

// Standardized tag vocabulary - must match edge function
export const VALID_STYLE_TAGS = [
  "ugly_ads", "lo_fi", "raw", "behind_the_scenes", "authentic",
  "grid_style", "clean", "polished", "studio", "cinematic",
  "testimonial", "talking_head", "face_cam",
  "negative_marketing", "harsh", "aggressive",
  "before_after", "transformation",
  "b_roll", "process", "installation", "detail_shot",
  "product_focus", "hero_shot",
] as const;

export const VALID_VISUAL_TAGS = [
  "handheld", "shaky", "phone_video", "vertical", "horizontal",
  "low_light", "natural_light", "studio_light",
  "no_color_grade", "color_graded", "high_contrast",
  "shop_environment", "garage", "outdoor", "indoor",
  "close_up", "wide_shot", "medium_shot",
  "motion", "static", "slow_motion",
  "vehicle", "wrap", "vinyl", "ppf", "tint",
] as const;

export const VALID_QUALITY_TAGS = [
  "professional", "amateur", "unpolished", "imperfect",
  "high_resolution", "low_resolution",
  "good_audio", "no_audio", "poor_audio",
] as const;

export type StyleTag = typeof VALID_STYLE_TAGS[number];
export type VisualTag = typeof VALID_VISUAL_TAGS[number];
export type QualityTag = typeof VALID_QUALITY_TAGS[number];
export type AnyTag = StyleTag | VisualTag | QualityTag;

// Content style definitions
export type ContentStyle = 
  | "ugly_ads"
  | "grid_style"
  | "testimonial"
  | "negative_marketing"
  | "before_after"
  | "b_roll"
  | "product_hero"
  | "any"; // Default - no filter

export interface StyleTagRule {
  name: string;
  description: string;
  mustHaveAny: AnyTag[];      // Clip must have at least ONE of these
  mustHaveAll?: AnyTag[];     // Clip must have ALL of these
  mustNotHave?: AnyTag[];     // Clip must NOT have any of these
  preferredTags?: AnyTag[];   // Nice to have - for ranking
}

/**
 * Master style-to-tag mapping
 * This is the source of truth for what each style means
 */
export const STYLE_TAG_RULES: Record<ContentStyle, StyleTagRule> = {
  ugly_ads: {
    name: "Ugly Ads / Lo-Fi",
    description: "Raw, authentic, unpolished content that feels real",
    mustHaveAny: [
      "ugly_ads",
      "lo_fi",
      "raw",
      "behind_the_scenes",
      "authentic",
      "handheld",
      "phone_video",
      "unpolished",
      "imperfect",
      "no_color_grade",
      "amateur",
    ],
    mustNotHave: [
      "studio",
      "cinematic",
      "polished",
      "professional",
      "color_graded",
    ],
    preferredTags: [
      "shop_environment",
      "garage",
      "process",
      "installation",
    ],
  },

  grid_style: {
    name: "Grid Style / Clean",
    description: "Professional, symmetrical, studio-quality content",
    mustHaveAny: [
      "grid_style",
      "clean",
      "polished",
      "studio",
      "cinematic",
      "professional",
      "color_graded",
      "studio_light",
    ],
    mustNotHave: [
      "ugly_ads",
      "lo_fi",
      "raw",
      "handheld",
      "shaky",
      "unpolished",
      "amateur",
    ],
    preferredTags: [
      "high_resolution",
      "hero_shot",
      "product_focus",
    ],
  },

  testimonial: {
    name: "Testimonial / Talking Head",
    description: "Person speaking to camera, face-focused content",
    mustHaveAny: [
      "testimonial",
      "talking_head",
      "face_cam",
    ],
    preferredTags: [
      "good_audio",
      "close_up",
      "medium_shot",
    ],
  },

  negative_marketing: {
    name: "Negative Marketing",
    description: "Hard-hitting, aggressive, pain-point focused",
    mustHaveAny: [
      "negative_marketing",
      "harsh",
      "aggressive",
      "raw",
      "ugly_ads",
    ],
    preferredTags: [
      "high_contrast",
      "handheld",
    ],
  },

  before_after: {
    name: "Before/After",
    description: "Transformation and comparison content",
    mustHaveAny: [
      "before_after",
      "transformation",
    ],
    preferredTags: [
      "vehicle",
      "wrap",
      "process",
    ],
  },

  b_roll: {
    name: "B-Roll / Support Footage",
    description: "Supplementary footage for transitions and texture",
    mustHaveAny: [
      "b_roll",
      "process",
      "installation",
      "detail_shot",
    ],
    preferredTags: [
      "motion",
      "close_up",
      "vehicle",
      "wrap",
    ],
  },

  product_hero: {
    name: "Product Hero Shot",
    description: "Glamour shots of finished products",
    mustHaveAny: [
      "product_focus",
      "hero_shot",
      "polished",
      "cinematic",
    ],
    preferredTags: [
      "studio_light",
      "high_resolution",
      "color_graded",
    ],
  },

  any: {
    name: "Any Style",
    description: "No style filter - use all available content",
    mustHaveAny: [], // No requirements
  },
};

/**
 * Get clips that match a given style
 * @param clips - Array of clips with tags
 * @param style - The content style to filter by
 * @returns Filtered and ranked clips
 */
export function filterClipsByStyle<T extends { tags?: string[] | null }>(
  clips: T[],
  style: ContentStyle
): T[] {
  const rules = STYLE_TAG_RULES[style];
  
  // "any" style = no filtering
  if (style === "any" || !rules.mustHaveAny.length) {
    return clips;
  }

  return clips.filter(clip => {
    const clipTags = clip.tags || [];
    
    // Must have at least one required tag
    const hasRequired = rules.mustHaveAny.some(tag => clipTags.includes(tag));
    if (!hasRequired) return false;

    // Must have ALL of mustHaveAll (if specified)
    if (rules.mustHaveAll?.length) {
      const hasAll = rules.mustHaveAll.every(tag => clipTags.includes(tag));
      if (!hasAll) return false;
    }

    // Must NOT have any excluded tags
    if (rules.mustNotHave?.length) {
      const hasExcluded = rules.mustNotHave.some(tag => clipTags.includes(tag));
      if (hasExcluded) return false;
    }

    return true;
  });
}

/**
 * Rank clips by how well they match a style
 * @param clips - Array of clips with tags
 * @param style - The content style to rank by
 * @returns Clips sorted by match score (highest first)
 */
export function rankClipsByStyle<T extends { tags?: string[] | null }>(
  clips: T[],
  style: ContentStyle
): T[] {
  const rules = STYLE_TAG_RULES[style];
  
  if (style === "any" || !rules.mustHaveAny.length) {
    return clips;
  }

  return [...clips].sort((a, b) => {
    const aTags = a.tags || [];
    const bTags = b.tags || [];

    // Count matching required tags
    const aRequiredCount = rules.mustHaveAny.filter(t => aTags.includes(t)).length;
    const bRequiredCount = rules.mustHaveAny.filter(t => bTags.includes(t)).length;

    // Count matching preferred tags
    const aPreferredCount = (rules.preferredTags || []).filter(t => aTags.includes(t)).length;
    const bPreferredCount = (rules.preferredTags || []).filter(t => bTags.includes(t)).length;

    // Score = required matches * 2 + preferred matches
    const aScore = aRequiredCount * 2 + aPreferredCount;
    const bScore = bRequiredCount * 2 + bPreferredCount;

    return bScore - aScore; // Descending
  });
}

/**
 * Check if a clip matches a style
 */
export function clipMatchesStyle(
  clipTags: string[] | null | undefined,
  style: ContentStyle
): boolean {
  const rules = STYLE_TAG_RULES[style];
  
  if (style === "any" || !rules.mustHaveAny.length) {
    return true;
  }

  const tags = clipTags || [];
  
  const hasRequired = rules.mustHaveAny.some(tag => tags.includes(tag));
  const hasExcluded = (rules.mustNotHave || []).some(tag => tags.includes(tag));
  
  return hasRequired && !hasExcluded;
}

/**
 * Get human-readable tag labels
 */
export const TAG_LABELS: Record<string, string> = {
  ugly_ads: "Ugly Ads",
  lo_fi: "Lo-Fi",
  raw: "Raw",
  behind_the_scenes: "BTS",
  authentic: "Authentic",
  grid_style: "Grid",
  clean: "Clean",
  polished: "Polished",
  studio: "Studio",
  cinematic: "Cinematic",
  testimonial: "Testimonial",
  talking_head: "Talking Head",
  face_cam: "Face Cam",
  negative_marketing: "Negative",
  harsh: "Harsh",
  before_after: "Before/After",
  transformation: "Transformation",
  b_roll: "B-Roll",
  process: "Process",
  installation: "Install",
  detail_shot: "Detail",
  product_focus: "Product",
  hero_shot: "Hero",
  handheld: "Handheld",
  phone_video: "Phone",
  vertical: "Vertical",
  shop_environment: "Shop",
  vehicle: "Vehicle",
  wrap: "Wrap",
  vinyl: "Vinyl",
};

/**
 * Get style options for UI dropdowns
 */
export function getStyleOptions() {
  return Object.entries(STYLE_TAG_RULES).map(([key, rule]) => ({
    value: key as ContentStyle,
    label: rule.name,
    description: rule.description,
  }));
}
