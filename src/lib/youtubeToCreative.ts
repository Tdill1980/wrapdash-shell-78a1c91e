import {
  createCreativeWithTags,
  saveBlueprintSnapshot,
  type Creative
} from "@/lib/creativeVault";
import type { Json } from "@/integrations/supabase/types";

export interface YouTubeShortInput {
  blueprint: Json;
  youtubeUrl: string;
  brand: string;
  channel?: string;
  title?: string;
}

/**
 * Create a YouTube Short creative in the vault
 * Used by YouTube AI Editor when generating shorts from long-form content
 */
export async function createYouTubeShort({
  blueprint,
  youtubeUrl,
  brand,
  channel,
  title
}: YouTubeShortInput): Promise<Creative> {
  const creative = await createCreativeWithTags({
    title: title || "YouTube Short",
    description: youtubeUrl,
    sourceType: "youtube",
    toolSlug: "youtube_editor",
    formatSlug: "short",
    brand,
    channel,
    platform: "youtube",
    createdBy: "ai",
    metadata: {
      youtubeUrl,
      intent: "organic"
    }
  });

  await saveBlueprintSnapshot(creative.id, blueprint);

  return creative;
}

/**
 * Create multiple YouTube Shorts from a batch of blueprints
 */
export async function createYouTubeShortsBatch({
  blueprints,
  youtubeUrl,
  brand,
  channel
}: {
  blueprints: Json[];
  youtubeUrl: string;
  brand: string;
  channel?: string;
}): Promise<Creative[]> {
  const creatives: Creative[] = [];

  for (let i = 0; i < blueprints.length; i++) {
    const creative = await createYouTubeShort({
      blueprint: blueprints[i],
      youtubeUrl,
      brand,
      channel,
      title: `YouTube Short #${i + 1}`
    });
    creatives.push(creative);
  }

  return creatives;
}
