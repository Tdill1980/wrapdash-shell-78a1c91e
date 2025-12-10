// src/lib/meta-ads/metaPlacements.ts

export type MetaPlacement =
  | "ig_feed"
  | "ig_story"
  | "ig_reels"
  | "fb_feed"
  | "fb_story"
  | "fb_16x9";

export interface MetaPlacementFormat {
  id: MetaPlacement;
  label: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  platform: "instagram" | "facebook";
}

// ALL META AD FORMATS (FULL SET)
export const META_PLACEMENTS: Record<MetaPlacement, MetaPlacementFormat> = {
  ig_feed: {
    id: "ig_feed",
    label: "Instagram Feed Ad",
    description: "Standard IG feed placement (4:5). Best for ads with text.",
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    platform: "instagram",
  },

  ig_story: {
    id: "ig_story",
    label: "Instagram Story Ad",
    description: "Full-screen 9:16 vertical story format.",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    platform: "instagram",
  },

  ig_reels: {
    id: "ig_reels",
    label: "Instagram Reels Ad",
    description: "Vertical reels placement for maximum reach.",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    platform: "instagram",
  },

  fb_feed: {
    id: "fb_feed",
    label: "Facebook Feed Ad",
    description: "FB feed 1:1 squared format.",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    platform: "facebook",
  },

  fb_story: {
    id: "fb_story",
    label: "Facebook Story Ad",
    description: "Full-screen 9:16 Facebook Story.",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    platform: "facebook",
  },

  fb_16x9: {
    id: "fb_16x9",
    label: "Facebook Video Ad",
    description: "Landscape 16:9 video (great for cross-platform ads).",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    platform: "facebook",
  },
};

// Helper to get placement by ID
export function getPlacement(id: MetaPlacement): MetaPlacementFormat {
  return META_PLACEMENTS[id];
}

// Get all placements for a specific platform
export function getPlacementsByPlatform(platform: "instagram" | "facebook"): MetaPlacementFormat[] {
  return Object.values(META_PLACEMENTS).filter((p) => p.platform === platform);
}

// Get all placements as array
export function getAllPlacements(): MetaPlacementFormat[] {
  return Object.values(META_PLACEMENTS);
}
