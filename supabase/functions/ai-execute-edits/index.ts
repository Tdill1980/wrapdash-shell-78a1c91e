import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { video_edit_id, render_type = "full", organization_id } = await req.json();

    if (!video_edit_id) {
      return new Response(
        JSON.stringify({ error: "video_edit_id required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the video edit queue item
    const { data: editItem, error: fetchError } = await supabase
      .from("video_edit_queue")
      .select("*")
      .eq("id", video_edit_id)
      .single();

    if (fetchError || !editItem) {
      return new Response(
        JSON.stringify({ error: "Video edit item not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`Executing edits for video: ${editItem.title}`);

    // Update status to processing
    await supabase
      .from("video_edit_queue")
      .update({ render_status: "processing", status: "rendering" })
      .eq("id", video_edit_id);

    // Build render payload based on edit suggestions
    const textOverlays = editItem.text_overlays || [];
    const aiSuggestions = editItem.ai_edit_suggestions || {};

    // Convert text overlays to Creatomate format
    const overlayElements = textOverlays.map((overlay: any, index: number) => {
      const [minutes, seconds] = (overlay.timestamp || "00:00").split(":").map(Number);
      const startTime = (minutes * 60) + seconds;
      
      return {
        name: `Text-${index + 1}`,
        type: "text",
        text: overlay.text,
        time: startTime,
        duration: overlay.duration || 3,
        y: overlay.style === "hook" ? "15%" : overlay.style === "cta" ? "85%" : "50%",
        font_family: "Bebas Neue",
        font_size: overlay.style === "hook" ? "72 px" : "48 px",
        fill_color: "#FFFFFF",
        shadow_color: "rgba(0,0,0,0.8)",
        shadow_blur: "10 px"
      };
    });

    // Prepare render request
    const renderPayload = {
      video_url: editItem.source_url,
      headline: textOverlays[0]?.text || editItem.title,
      subtext: textOverlays[1]?.text || "",
      music_url: editItem.selected_music_url,
      organization_id: editItem.organization_id || organization_id,
      custom_elements: overlayElements,
      apply_captions: true,
      caption_style: "sabri"
    };

    // Call render-video-reel for full video
    let renderResult = null;
    if (render_type === "full" || render_type === "all") {
      try {
        const renderRes = await supabase.functions.invoke("render-video-reel", {
          body: renderPayload
        });
        renderResult = renderRes.data;
        console.log("Full video render initiated:", renderResult);
      } catch (e) {
        console.error("Render failed:", e);
      }
    }

    // Extract shorts if requested
    let shortsResults = [];
    if (render_type === "shorts" || render_type === "all") {
      const shorts = aiSuggestions.broll_cues || [];
      
      for (const short of shorts.slice(0, 5)) {
        try {
          const shortPayload = {
            video_url: editItem.source_url,
            headline: short.suggestion || "Check this out",
            trim_start: short.timestamp,
            trim_duration: short.duration || 15,
            organization_id: editItem.organization_id
          };

          const shortRes = await supabase.functions.invoke("render-video-reel", {
            body: shortPayload
          });
          shortsResults.push(shortRes.data);
        } catch (e) {
          console.error("Short render failed:", e);
        }
      }
    }

    // Update queue with render results
    const updateData: any = {
      render_status: renderResult?.render_id ? "rendering" : "failed",
      updated_at: new Date().toISOString()
    };

    if (shortsResults.length > 0) {
      updateData.shorts_extracted = shortsResults;
    }

    await supabase
      .from("video_edit_queue")
      .update(updateData)
      .eq("id", video_edit_id);

    return new Response(
      JSON.stringify({
        success: true,
        video_edit_id,
        render_result: renderResult,
        shorts_count: shortsResults.length,
        shorts: shortsResults
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("ai-execute-edits error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
