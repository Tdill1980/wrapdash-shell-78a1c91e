import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("Creatomate webhook received:", JSON.stringify(payload))

    // Creatomate payload fields
    const providerRenderId = payload?.id
    const status = payload?.status
    const outputUrl = payload?.url || payload?.output_url
    const thumbnailUrl = payload?.snapshot_url || payload?.thumbnail_url

    if (!providerRenderId) {
      console.error("Missing render id in webhook payload")
      return new Response(
        JSON.stringify({ ok: false, error: "Missing render id" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find render job by provider_render_id
    const { data: job, error: jobErr } = await supabase
      .from("video_edit_queue")
      .select("id, ai_creative_id")
      .eq("creatomate_render_id", providerRenderId)
      .single()

    if (jobErr || !job) {
      console.error("Render job not found for provider id:", providerRenderId, jobErr)
      return new Response(
        JSON.stringify({ ok: false, error: "Render job not found" }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine final status
    let finalStatus: string
    if (status === "succeeded" || status === "completed") {
      finalStatus = "complete"
    } else if (status === "failed") {
      finalStatus = "failed"
    } else {
      finalStatus = "rendering"
    }

    console.log(`Updating render job ${job.id} to status: ${finalStatus}`)

    // Update video_edit_queue
    await supabase
      .from("video_edit_queue")
      .update({
        status: finalStatus,
        output_url: outputUrl ?? null,
        thumbnail_url: thumbnailUrl ?? null,
        completed_at: finalStatus === "complete" ? new Date().toISOString() : null,
        error_message: finalStatus === "failed" ? (payload?.error_message || "Render failed") : null
      })
      .eq("id", job.id)

    // Update ai_creatives if linked
    if (job.ai_creative_id) {
      console.log(`Updating ai_creative ${job.ai_creative_id} to status: ${finalStatus}`)
      
      await supabase
        .from("ai_creatives")
        .update({
          status: finalStatus,
          output_url: outputUrl ?? null,
          thumbnail_url: thumbnailUrl ?? null,
          updated_at: new Date().toISOString()
        })
        .eq("id", job.ai_creative_id)

      // Update status tag
      if (finalStatus === "complete" || finalStatus === "failed") {
        // Remove old status tags
        await supabase
          .from("creative_tag_map")
          .delete()
          .eq("creative_id", job.ai_creative_id)
          .like("tag_slug", "status:%")

        // Add new status tag
        await supabase
          .from("creative_tag_map")
          .insert({ creative_id: job.ai_creative_id, tag_slug: `status:${finalStatus}` })
      }
    }

    console.log("Webhook processed successfully")
    return new Response(
      JSON.stringify({ ok: true, status: finalStatus }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error("Webhook error:", err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
