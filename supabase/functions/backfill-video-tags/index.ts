import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 5;
const DELAY_MS = 1200;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[backfill-video-tags] ====== FUNCTION INVOKED ======");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { limit = 100, dry_run = false, organization_id } = body;

    console.log("[backfill-video-tags] Options:", { limit, dry_run, organization_id });

    // Find untagged videos
    let query = supabase
      .from("content_files")
      .select("id, file_url, thumbnail_url, tags, file_type, organization_id")
      .eq("file_type", "video")
      .or("tags.is.null,tags.eq.{}");

    if (organization_id) {
      query = query.eq("organization_id", organization_id);
    }

    const { data: untaggedVideos, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      console.error("[backfill-video-tags] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch untagged videos", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalUntagged = untaggedVideos?.length || 0;
    console.log(`[backfill-video-tags] Found ${totalUntagged} untagged videos`);

    if (dry_run) {
      return new Response(
        JSON.stringify({
          dry_run: true,
          total_untagged: totalUntagged,
          videos: untaggedVideos?.map(v => ({
            id: v.id,
            has_thumbnail: !!v.thumbnail_url,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (totalUntagged === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No untagged videos found", processed: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process in batches
    let processed = 0;
    let failed = 0;
    const errors: { id: string; error: string }[] = [];

    for (let i = 0; i < untaggedVideos!.length; i += BATCH_SIZE) {
      const batch = untaggedVideos!.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (file) => {
          try {
            const response = await supabase.functions.invoke("ai-tag-video", {
              body: {
                content_file_id: file.id,
                video_url: file.file_url,
                thumbnail_url: file.thumbnail_url,
                existing_tags: file.tags || [],
              },
            });

            if (response.error) {
              throw new Error(response.error.message || "Tagging failed");
            }

            console.log(`[backfill-video-tags] ✅ Tagged: ${file.id}`);
            return { success: true, id: file.id };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            console.error(`[backfill-video-tags] ❌ Failed: ${file.id} - ${errorMsg}`);
            return { success: false, id: file.id, error: errorMsg };
          }
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            processed++;
          } else {
            failed++;
            errors.push({ id: result.value.id, error: result.value.error || "Unknown" });
          }
        } else {
          failed++;
        }
      }

      // Rate limit delay between batches
      if (i + BATCH_SIZE < untaggedVideos!.length) {
        await sleep(DELAY_MS);
      }
    }

    console.log(`[backfill-video-tags] 🎉 Complete: ${processed} tagged, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total_found: totalUntagged,
        processed,
        failed,
        errors: errors.slice(0, 10), // Limit error details
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[backfill-video-tags] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
