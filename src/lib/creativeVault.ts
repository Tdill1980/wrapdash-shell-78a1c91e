import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type SourceType =
  | "mighty_task"
  | "content_calendar"
  | "noah_prompt"
  | "manual"
  | "youtube"
  | "inspiration"
  | "producer_job";

export type ToolSlug =
  | "multi_clip_reel"
  | "auto_split"
  | "static_creator"
  | "content_atomizer"
  | "youtube_editor"
  | "inspo_scrubber"
  | "mighty_edit";

export type FormatSlug = "reel" | "story" | "short" | "static" | "carousel";

export type CreativeStatus = "draft" | "rendering" | "complete" | "failed";

export interface CreativeCreateInput {
  title?: string;
  description?: string;
  sourceType: SourceType;
  sourceId?: string | null;
  toolSlug: ToolSlug;
  formatSlug: FormatSlug;
  brand?: string;
  channel?: string;
  platform?: string;
  createdBy?: "ai" | "user";
  createdByAgent?: string;
  organizationId?: string;
  metadata?: Json;
}

export interface Creative {
  id: string;
  created_at: string;
  updated_at: string;
  title: string | null;
  description: string | null;
  source_type: string;
  source_id: string | null;
  tool_slug: string | null;
  format_slug: string | null;
  brand: string | null;
  channel: string | null;
  platform: string | null;
  status: string;
  blueprint: Json | null;
  blueprint_id: string | null;
  latest_render_job_id: string | null;
  thumbnail_url: string | null;
  output_url: string | null;
  created_by: string | null;
  created_by_agent: string | null;
  organization_id: string | null;
  metadata: Json | null;
}

/**
 * Create a new creative in the vault
 */
export async function createCreative(input: CreativeCreateInput): Promise<Creative> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .insert({
      title: input.title ?? null,
      description: input.description ?? null,
      source_type: input.sourceType,
      source_id: input.sourceId ?? null,
      tool_slug: input.toolSlug,
      format_slug: input.formatSlug,
      brand: input.brand ?? null,
      channel: input.channel ?? null,
      platform: input.platform ?? null,
      created_by: input.createdBy ?? "ai",
      created_by_agent: input.createdByAgent ?? null,
      organization_id: input.organizationId ?? null,
      metadata: input.metadata ?? {},
      status: "draft"
    })
    .select()
    .single();

  if (error) throw error;
  return data as Creative;
}

/**
 * Add tags to a creative
 */
export async function addTags(creativeId: string, tags: string[]): Promise<void> {
  if (!tags.length) return;

  const rows = tags.map(tag => ({
    creative_id: creativeId,
    tag_slug: tag
  }));

  const { error } = await supabase.from("creative_tag_map").insert(rows);
  if (error) throw error;
}

/**
 * Save a blueprint snapshot and link it to the creative
 * Stores blueprint in ai_creatives.blueprint column (JSONB)
 */
export async function saveBlueprintSnapshot(
  creativeId: string,
  blueprint: Json
): Promise<void> {
  const { error } = await supabase
    .from("ai_creatives")
    .update({
      blueprint,
      updated_at: new Date().toISOString()
    })
    .eq("id", creativeId);

  if (error) throw error;
}

/**
 * Replace status tag on a creative (GAP 2 FIX)
 * Removes old status:* tags and adds new one
 */
export async function replaceStatusTag(
  creativeId: string,
  newStatus: CreativeStatus
): Promise<void> {
  // Remove old status tags
  const { data: existingTags } = await supabase
    .from("creative_tag_map")
    .select("tag_slug")
    .eq("creative_id", creativeId)
    .like("tag_slug", "status:%");

  if (existingTags && existingTags.length > 0) {
    await supabase
      .from("creative_tag_map")
      .delete()
      .eq("creative_id", creativeId)
      .like("tag_slug", "status:%");
  }

  // Add new status tag
  await addTags(creativeId, [`status:${newStatus}`]);
}

/**
 * Update a creative with partial data
 */
export async function updateCreative(
  creativeId: string,
  patch: Partial<{
    title: string;
    description: string;
    status: CreativeStatus;
    thumbnail_url: string;
    output_url: string;
    latest_render_job_id: string;
    blueprint: Json;
    metadata: Json;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("ai_creatives")
    .update({
      ...patch,
      updated_at: new Date().toISOString()
    })
    .eq("id", creativeId);

  if (error) throw error;
}

/**
 * List creatives with optional filters
 */
export async function listCreatives(filters?: {
  tool?: ToolSlug;
  format?: FormatSlug;
  source?: SourceType;
  brand?: string;
  status?: CreativeStatus;
  organizationId?: string;
  limit?: number;
}): Promise<Creative[]> {
  let query = supabase
    .from("ai_creatives")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.tool) query = query.eq("tool_slug", filters.tool);
  if (filters?.format) query = query.eq("format_slug", filters.format);
  if (filters?.source) query = query.eq("source_type", filters.source);
  if (filters?.brand) query = query.eq("brand", filters.brand);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Creative[];
}

/**
 * Get a single creative by ID
 */
export async function getCreative(creativeId: string): Promise<Creative | null> {
  const { data, error } = await supabase
    .from("ai_creatives")
    .select("*")
    .eq("id", creativeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data as Creative;
}

/**
 * Get tags for a creative
 */
export async function getCreativeTags(creativeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("creative_tag_map")
    .select("tag_slug")
    .eq("creative_id", creativeId);

  if (error) throw error;
  return (data ?? []).map(row => row.tag_slug);
}

/**
 * Helper to generate standard tags for a creative
 */
export function generateStandardTags(
  sourceType: SourceType,
  toolSlug: ToolSlug,
  formatSlug: FormatSlug,
  status: CreativeStatus = "draft"
): string[] {
  return [
    `source:${sourceType}`,
    `tool:${toolSlug}`,
    `format:${formatSlug}`,
    `status:${status}`
  ];
}

/**
 * Create a creative with standard tags in one call
 */
export async function createCreativeWithTags(
  input: CreativeCreateInput
): Promise<Creative> {
  const creative = await createCreative(input);
  
  const tags = generateStandardTags(
    input.sourceType,
    input.toolSlug,
    input.formatSlug,
    "draft"
  );
  
  await addTags(creative.id, tags);
  
  return creative;
}
