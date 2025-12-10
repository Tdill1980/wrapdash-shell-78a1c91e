/**
 * Platform preview presets
 * These define the viewport size, UI chrome overlay, and scaling
 * for each platform preview in the Content Planner.
 */

export interface PlatformPreset {
  width: number;
  height: number;
  label: string;
  chrome: string;
  aspectRatio: string;
}

export const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  instagram_feed: {
    width: 1080,
    height: 1350,
    label: "Instagram Feed",
    chrome: "ig_feed",
    aspectRatio: "4:5",
  },

  instagram_reel: {
    width: 1080,
    height: 1920,
    label: "Instagram Reel",
    chrome: "ig_reel",
    aspectRatio: "9:16",
  },

  instagram_story: {
    width: 1080,
    height: 1920,
    label: "Instagram Story",
    chrome: "ig_story",
    aspectRatio: "9:16",
  },

  tiktok: {
    width: 1080,
    height: 1920,
    label: "TikTok",
    chrome: "tiktok",
    aspectRatio: "9:16",
  },

  facebook_post: {
    width: 1200,
    height: 630,
    label: "Facebook Feed",
    chrome: "facebook",
    aspectRatio: "1.91:1",
  },

  linkedin_post: {
    width: 1200,
    height: 627,
    label: "LinkedIn Post",
    chrome: "linkedin",
    aspectRatio: "1.91:1",
  },

  youtube_shorts: {
    width: 1080,
    height: 1920,
    label: "YouTube Shorts",
    chrome: "youtube_shorts",
    aspectRatio: "9:16",
  },

  meta_ad: {
    width: 1200,
    height: 628,
    label: "Meta Ad",
    chrome: "meta_ads",
    aspectRatio: "1.91:1",
  },

  google_ad: {
    width: 1200,
    height: 600,
    label: "Google Ads",
    chrome: "google_ads",
    aspectRatio: "2:1",
  },
};

/**
 * All available platforms for the preview selector
 */
export const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "meta_ads", label: "Meta Ads", icon: "📢" },
  { value: "google_ads", label: "Google Ads", icon: "🔍" },
] as const;

/**
 * Returns the correct preview preset based on platform and content type.
 */
export function getPreviewPreset(platform: string, contentType: string): PlatformPreset {
  switch (platform) {
    case "instagram":
      if (contentType === "reel") return PLATFORM_PRESETS.instagram_reel;
      if (contentType === "story") return PLATFORM_PRESETS.instagram_story;
      return PLATFORM_PRESETS.instagram_feed;

    case "tiktok":
      return PLATFORM_PRESETS.tiktok;

    case "facebook":
      return PLATFORM_PRESETS.facebook_post;

    case "linkedin":
      return PLATFORM_PRESETS.linkedin_post;

    case "youtube":
      return PLATFORM_PRESETS.youtube_shorts;

    case "meta_ads":
      return PLATFORM_PRESETS.meta_ad;

    case "google_ads":
      return PLATFORM_PRESETS.google_ad;

    default:
      return PLATFORM_PRESETS.instagram_feed;
  }
}

/**
 * Get scaled dimensions for preview rendering
 */
export function getScaledDimensions(preset: PlatformPreset, maxHeight: number = 600) {
  const scale = maxHeight / preset.height;
  return {
    width: Math.round(preset.width * scale),
    height: Math.round(preset.height * scale),
    scale,
  };
}
