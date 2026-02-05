import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get("SUPABASE_URL")!,
  Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// Normalize Creatomate status to our system statuses
function normalizeStatus(status: string): "rendering" | "complete" | "failed" {
  if (status === "succeeded" || status === "completed") return "complete"
  if (status === "failed") return "failed"
  return "rendering"
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("[creatomate-webhook] Received:", JSON.stringify(payload))

    // Creatomate payload fields
    const providerRenderId = payload?.id
    const rawStatus = payload?.status
    const outputUrl = payload?.url || payload?.output_url
    const thumbnailUrl = payload?.snapshot_url || payload?.thumbnail_url
    const errorMessage = payload?.error_message || payload?.error || null

    if (!providerRenderId) {
      console.error("[creatomate-webhook] Missing render id")
      return new Response(
        JSON.stringify({ ok: false, error: "Missing render id" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize status (handles queued, rendering, succeeded, failed, etc.)
    const finalStatus = normalizeStatus(rawStatus)
    console.log(`[creatomate-webhook] Provider ID: ${providerRenderId}, Raw: ${rawStatus}, Normalized: ${finalStatus}`)

    // Find render job by creatomate_render_id in debug_payload
    // Since we don't have a dedicated column, we match via JSONB
    const { data: jobs, error: queryErr } = await supabase
      .from("video_edit_queue")
      .select("id, ai_creative_id, debug_payload")
      .filter("debug_payload->creatomate_render_id", "eq", providerRenderId)
      .limit(1)

    if (queryErr) {
      console.error("[creatomate-webhook] Query error:", queryErr)
      return new Response(
        JSON.stringify({ ok: false, error: "Database query failed" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!jobs || jobs.length === 0) {
      console.warn("[creatomate-webhook] No matching job for render id:", providerRenderId)
      // Return 200 to prevent Creatomate retries for orphan callbacks
      return new Response(
        JSON.stringify({ ok: true, warning: "No matching job found, skipping" }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const job = jobs[0]
    console.log(`[creatomate-webhook] Found job: ${job.id}, creative: ${job.ai_creative_id}`)

    // ============ UPDATE RENDER JOB (video_edit_queue) ============
    const { error: updateJobErr } = await supabase
      .from("video_edit_queue")
      .update({
        render_status: finalStatus,
        final_render_url: finalStatus === "complete" ? outputUrl : null,
        error_message: finalStatus === "failed" ? (errorMessage || "Render failed") : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id)

    if (updateJobErr) {
      console.error("[creatomate-webhook] Failed to update job:", updateJobErr)
    }

    // ============ UPDATE AI CREATIVE (if linked) ============
    if (job.ai_creative_id) {
      console.log(`[creatomate-webhook] Updating creative: ${job.ai_creative_id}`)
      
      const { error: updateCreativeErr } = await supabase
        .from("ai_creatives")
        .update({
          status: finalStatus,
          output_url: finalStatus === "complete" ? outputUrl : null,
          thumbnail_url: thumbnailUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", job.ai_creative_id)

      if (updateCreativeErr) {
        console.error("[creatomate-webhook] Failed to update creative:", updateCreativeErr)
      }

      // ============ UPDATE STATUS TAGS (ALWAYS, not just on complete/failed) ============
      // Remove old status tags
      const { error: deleteTagErr } = await supabase
        .from("creative_tag_map")
        .delete()
        .eq("creative_id", job.ai_creative_id)
        .like("tag_slug", "status:%")

      if (deleteTagErr) {
        console.warn("[creatomate-webhook] Failed to delete old tags:", deleteTagErr)
      }

      // Add new status tag
      const { error: insertTagErr } = await supabase
        .from("creative_tag_map")
        .insert({ 
          creative_id: job.ai_creative_id, 
          tag_slug: `status:${finalStatus}` 
        })

      if (insertTagErr) {
        console.warn("[creatomate-webhook] Failed to insert new tag:", insertTagErr)
      }

      console.log(`[creatomate-webhook] Status tag updated to: status:${finalStatus}`)
    }

    console.log("[creatomate-webhook] ✓ Webhook processed successfully")
    return new Response(
      JSON.stringify({ 
        ok: true, 
        status: finalStatus,
        job_id: job.id,
        creative_id: job.ai_creative_id 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error("[creatomate-webhook] Fatal error:", err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
