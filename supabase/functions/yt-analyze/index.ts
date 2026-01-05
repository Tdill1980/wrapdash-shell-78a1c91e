import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_url, organization_id } = await req.json();

    if (!file_url) {
      return new Response(
        JSON.stringify({ error: "file_url is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Starting YouTube analysis for file: ${file_url}`);

    // 1. Create job entry
    const { data: job, error: jobErr } = await supabase
      .from("youtube_editor_jobs")
      .insert({
        organization_id,
        source_file_url: file_url,
        processing_status: "uploading",
      })
      .select()
      .single();

    if (jobErr) {
      console.error("Failed to create job:", jobErr);
      throw jobErr;
    }

    const job_id = job.id;
    console.log(`Created job ${job_id}`);

    // 2. Trigger MUX upload
    const { error: muxError } = await supabase.functions.invoke("mux-upload", {
      body: {
        file_url,
        content_file_id: job_id,
        organization_id
      }
    });

    if (muxError) {
      console.error("MUX upload failed:", muxError);
      await supabase
        .from("youtube_editor_jobs")
        .update({ processing_status: "failed" })
        .eq("id", job_id);
      throw muxError;
    }

    // Update status to transcribing (MUX webhook will continue the pipeline)
    await supabase
      .from("youtube_editor_jobs")
      .update({ processing_status: "transcribing" })
      .eq("id", job_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id,
        status: "uploading",
        message: "Video upload started. Poll for status updates."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("yt-analyze error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
