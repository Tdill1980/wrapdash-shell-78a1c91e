/**
 * Creative Library Queries
 * Option 1 canonical queries for ads vs organic filtering
 */

import { supabase } from "@/integrations/supabase/client";

export type CreativeIntent = "paid" | "organic";
export type CreativeStatus = "draft" | "rendering" | "complete" | "failed";

export interface CreativeListItem {
  id: string;
  created_at: string;
  title: string | null;
  brand: string | null;
  platform: string | null;
  status: string;
  output_url: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, any> | null;
}

/**
 * List creatives by intent (paid vs organic)
 */
export async function listCreativesByIntent(intent: CreativeIntent): Promise<CreativeListItem[]> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      created_at,
      title,
      brand,
      platform,
      status,
      output_url,
      thumbnail_url,
      metadata
    `)
    .eq("metadata->>intent", intent)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CreativeListItem[];
}

/**
 * List creatives by status
 */
export async function listCreativesByStatus(status: CreativeStatus): Promise<CreativeListItem[]> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      created_at,
      title,
      brand,
      platform,
      status,
      output_url,
      thumbnail_url,
      metadata
    `)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CreativeListItem[];
}

/**
 * List creatives by source type (youtube, manual, noah, etc.)
 */
export async function listCreativesBySource(sourceType: string): Promise<CreativeListItem[]> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      created_at,
      title,
      brand,
      platform,
      status,
      output_url,
      thumbnail_url,
      metadata
    `)
    .eq("source_type", sourceType)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CreativeListItem[];
}

/**
 * List creatives by tool slug (youtube_editor, multi_clip_reel, etc.)
 */
export async function listCreativesByTool(toolSlug: string): Promise<CreativeListItem[]> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      created_at,
      title,
      brand,
      platform,
      status,
      output_url,
      thumbnail_url,
      metadata
    `)
    .eq("tool_slug", toolSlug)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CreativeListItem[];
}

/**
 * List draft creatives ready for bulk render
 */
export async function listDraftCreativesForRender(): Promise<CreativeListItem[]> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select(`
      id,
      created_at,
      title,
      brand,
      platform,
      status,
      output_url,
      thumbnail_url,
      metadata,
      blueprint
    `)
    .eq("status", "draft")
    .not("blueprint", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CreativeListItem[];
}

/**
 * Get single creative with full details
 */
export async function getCreativeById(id: string) {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
