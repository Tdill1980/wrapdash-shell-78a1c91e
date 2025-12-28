import { supabase } from "@/integrations/supabase/client";

export type ContentAsset = {
  id: string;
  title: string | null;
  created_at: string;
  metadata: {
    asset_url?: string;
    asset_tags?: string[];
    asset_analysis_meta?: {
      accepted_count?: number;
      ai_labels?: string[];
    };
  } | null;
};

/**
 * List all video/image assets uploaded via asset_upload tool
 */
export async function listContentBoxAssets(): Promise<ContentAsset[]> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      title,
      created_at,
      metadata
    `)
    .eq("tool_slug", "asset_upload")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContentAsset[];
}

/**
 * Get tags for a specific asset from creative_tag_map
 */
export async function getAssetTags(assetId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("creative_tag_map")
    .select("tag_slug")
    .eq("creative_id", assetId)
    .like("tag_slug", "asset:%");

  if (error) throw error;
  return (data ?? []).map((row) => row.tag_slug);
}

/**
 * Update asset tags - updates both metadata and creative_tag_map
 */
export async function updateAssetTags(assetId: string, tags: string[]): Promise<void> {
  // 1. Get current metadata
  const { data: row, error: fetchErr } = await supabase
    .from("ai_creatives")
    .select("metadata")
    .eq("id", assetId)
    .single();

  if (fetchErr) throw fetchErr;

  // 2. Update metadata with new tags
  const currentMeta = (row?.metadata as Record<string, unknown>) ?? {};
  const { error: updateErr } = await supabase
    .from("ai_creatives")
    .update({
      metadata: {
        ...currentMeta,
        asset_tags: tags,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (updateErr) throw updateErr;

  // 3. Sync creative_tag_map - delete old asset tags
  const { error: deleteErr } = await supabase
    .from("creative_tag_map")
    .delete()
    .eq("creative_id", assetId)
    .like("tag_slug", "asset:%");

  if (deleteErr) throw deleteErr;

  // 4. Insert new tags
  if (tags.length > 0) {
    const { error: insertErr } = await supabase.from("creative_tag_map").insert(
      tags.map((t) => ({
        creative_id: assetId,
        tag_slug: t,
      }))
    );

    if (insertErr) throw insertErr;
  }
}

/**
 * List assets filtered by tags
 */
export async function listAssetsByTags(tags: string[]): Promise<ContentAsset[]> {
  if (!tags.length) return [];

  // Get creative_ids that have these tags
  const { data: tagRows, error: tagErr } = await supabase
    .from("creative_tag_map")
    .select("creative_id")
    .in("tag_slug", tags);

  if (tagErr) throw tagErr;

  const creativeIds = [...new Set((tagRows ?? []).map((r) => r.creative_id))];
  if (creativeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      title,
      created_at,
      metadata
    `)
    .eq("tool_slug", "asset_upload")
    .in("id", creativeIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContentAsset[];
}
