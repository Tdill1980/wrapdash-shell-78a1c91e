import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClipSegment {
  asset_id: string;
  start_time: number;
  end_time: number;
  label?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[ai-execute-edits] ====== FUNCTION INVOKED ======");

  try {
    // Validate Mux credentials first
    const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");
    
    console.log("[ai-execute-edits] MUX_TOKEN_ID present:", !!MUX_TOKEN_ID);
    console.log("[ai-execute-edits] MUX_TOKEN_SECRET present:", !!MUX_TOKEN_SECRET);
    
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      console.error("[ai-execute-edits] FATAL: Mux credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Mux credentials not configured. Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET secrets." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const body = await req.json();
    console.log("[ai-execute-edits] Request body:", JSON.stringify(body));
    
    const { video_edit_id, render_type = "full", organization_id } = body;

    if (!video_edit_id) {
      console.error("[ai-execute-edits] Missing video_edit_id");
      return new Response(
        JSON.stringify({ success: false, error: "video_edit_id required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[ai-execute-edits] FATAL: Supabase credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Supabase credentials not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the video edit queue item
    console.log("[ai-execute-edits] Fetching video edit item:", video_edit_id);
    
    const { data: editItem, error: fetchError } = await supabase
      .from("video_edit_queue")
      .select("*")
      .eq("id", video_edit_id)
      .single();

    if (fetchError || !editItem) {
      console.error("[ai-execute-edits] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: `Video edit item not found: ${fetchError?.message || 'No data'}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("[ai-execute-edits] Found video edit item:", {
      id: editItem.id,
      title: editItem.title,
      source_url: editItem.source_url,
      content_file_id: editItem.content_file_id,
      duration: editItem.duration_seconds
    });

    // Update status to processing
    console.log("[ai-execute-edits] Updating status to processing...");
    await supabase
      .from("video_edit_queue")
      .update({ render_status: "processing", status: "rendering" })
      .eq("id", video_edit_id);

    const aiSuggestions = editItem.ai_edit_suggestions || {};
    
    // Get the Mux asset ID
    let muxAssetId: string | null = null;
    let muxPlaybackId: string | null = null;
    
    // Try to get from content_files
    if (editItem.content_file_id) {
      console.log("[ai-execute-edits] Looking up content_file:", editItem.content_file_id);
      
      const { data: contentFile } = await supabase
        .from("content_files")
        .select("mux_asset_id, mux_playback_id, file_url")
        .eq("id", editItem.content_file_id)
        .single();
      
      if (contentFile) {
        console.log("[ai-execute-edits] Content file found:", contentFile);
        muxAssetId = contentFile.mux_asset_id;
        muxPlaybackId = contentFile.mux_playback_id;
      }
    }

    // If no Mux asset yet, upload to Mux (this will wait for it to be ready)
    if (!muxAssetId && editItem.source_url) {
      console.log("[ai-execute-edits] No Mux asset found, uploading to Mux...");
      console.log("[ai-execute-edits] Source URL:", editItem.source_url);
      
      try {
        const muxUploadRes = await supabase.functions.invoke("mux-upload", {
          body: { 
            file_url: editItem.source_url,
            content_file_id: editItem.content_file_id,
            organization_id: editItem.organization_id,
            wait_for_ready: true // Wait for asset to be ready before returning
          }
        });
        
        console.log("[ai-execute-edits] Mux upload response:", JSON.stringify(muxUploadRes.data));
        
        if (muxUploadRes.error) {
          console.error("[ai-execute-edits] Mux upload error:", muxUploadRes.error);
          await updateQueueFailed(supabase, video_edit_id, `Mux upload failed: ${muxUploadRes.error.message}`);
          return new Response(
            JSON.stringify({ success: false, error: `Mux upload failed: ${muxUploadRes.error.message}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
        
        if (!muxUploadRes.data?.asset_id) {
          console.error("[ai-execute-edits] Mux upload did not return asset_id");
          await updateQueueFailed(supabase, video_edit_id, "Mux upload completed but no asset_id returned");
          return new Response(
            JSON.stringify({ success: false, error: "Mux upload completed but no asset_id returned" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
        
        muxAssetId = muxUploadRes.data.asset_id;
        muxPlaybackId = muxUploadRes.data.playback_id;
        
        // Check if asset is ready
        if (!muxUploadRes.data.ready) {
          console.warn("[ai-execute-edits] Asset uploaded but not ready yet - stitch may fail");
        }
        
        console.log("[ai-execute-edits] Mux upload complete:", muxAssetId, "ready:", muxUploadRes.data.ready);
        
        // Update content_files if we have one
        if (editItem.content_file_id) {
          await supabase
            .from("content_files")
            .update({ mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId })
            .eq("id", editItem.content_file_id);
        }
      } catch (e) {
        console.error("[ai-execute-edits] Mux upload exception:", e);
        await updateQueueFailed(supabase, video_edit_id, `Mux upload failed: ${e instanceof Error ? e.message : 'Unknown'}`);
        return new Response(
          JSON.stringify({ success: false, error: `Mux upload failed: ${e instanceof Error ? e.message : 'Unknown'}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    if (!muxAssetId) {
      console.error("[ai-execute-edits] No Mux asset ID available");
      await updateQueueFailed(supabase, video_edit_id, "No video source URL available");
      return new Response(
        JSON.stringify({ success: false, error: "No video source URL available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("[ai-execute-edits] Using Mux asset:", muxAssetId);

    let renderResult = null;
    const shortsResults: any[] = [];
    const videoDuration = editItem.duration_seconds || 60;

    // FULL REEL: Use Creatomate renderer (render-reel)
    if (render_type === "full" || render_type === "all") {
      console.log("[ai-execute-edits] Creating full reel via Creatomate...");
      
      // AUTHORITY CHECK: Blueprint scenes are REQUIRED
      const scenes = aiSuggestions.scenes || [];
      const blueprintId = aiSuggestions.blueprint_id;
      const blueprintSource = aiSuggestions.blueprint_source;
      
      console.log("[ai-execute-edits] Blueprint check:", {
        blueprint_id: blueprintId,
        blueprint_source: blueprintSource,
        scenes_count: scenes.length,
      });
      
      // HARD STOP: No blueprint = No render
      if (!blueprintId || scenes.length === 0) {
        console.error("[ai-execute-edits] AUTHORITY VIOLATION: No valid blueprint provided");
        await updateQueueFailed(supabase, video_edit_id, "Render blocked: No scene blueprint provided. Authority required.");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Render blocked: No scene blueprint provided.",
            authority_check: "FAILED",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      console.log("[ai-execute-edits] AUTHORITY PASSED: Using blueprint", blueprintId, "with", scenes.length, "scenes");
      
      // Build clips array for render-reel (Creatomate expects HTTP URLs, not mux:// refs)
      const clips: { url: string; trimStart: number; trimEnd: number }[] = [];
      const overlays: { text: string; start: number; end: number; position?: string }[] = [];
      
      let cursor = 0;
      for (const scene of scenes.slice(0, 8)) {
        const startTime = Number(scene.start_time);
        const endTime = Number(scene.end_time);
        
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
          console.error("[ai-execute-edits] Scene missing start_time/end_time:", scene);
          continue;
        }
        
        if (endTime > startTime) {
          // Use the clip_url from blueprint, falling back to source_url
          const clipUrl = scene.clip_url || editItem.source_url;
          
          clips.push({
            url: clipUrl,
            trimStart: startTime,
            trimEnd: Math.min(endTime, videoDuration),
          });
          
          // Add text overlay if present
          if (scene.text) {
            const duration = endTime - startTime;
            overlays.push({
              text: scene.text,
              start: cursor,
              end: cursor + Math.min(duration, 3), // overlay max 3s
              position: scene.text_position || 'center',
            });
          }
          
          cursor += (endTime - startTime);
        }
      }
      
      if (clips.length === 0) {
        console.error("[ai-execute-edits] Blueprint had scenes but none were valid");
        await updateQueueFailed(supabase, video_edit_id, "Blueprint scenes were invalid (no valid time ranges)");
        return new Response(
          JSON.stringify({ success: false, error: "No valid clips in blueprint" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      console.log("[ai-execute-edits] Calling render-reel with", clips.length, "clips");

      try {
        const renderRes = await supabase.functions.invoke("render-reel", {
          body: {
            job_id: video_edit_id,
            clips,
            overlays,
            music_url: editItem.selected_music_url,
            width: 1080,
            height: 1920,
            fps: 30,
          }
        });
        
        console.log("[ai-execute-edits] render-reel response:", JSON.stringify(renderRes.data));
        
        if (renderRes.error) {
          console.error("[ai-execute-edits] render-reel error:", renderRes.error);
          renderResult = { success: false, error: renderRes.error.message };
        } else if (renderRes.data?.ok === false) {
          console.error("[ai-execute-edits] render-reel returned failure:", renderRes.data.error);
          renderResult = { success: false, ...renderRes.data };
        } else {
          renderResult = { 
            success: true, 
            download_url: renderRes.data?.final_url,
            ready: true,
            ...renderRes.data 
          };
        }
      } catch (e) {
        console.error("[ai-execute-edits] render-reel exception:", e);
        renderResult = { success: false, error: e instanceof Error ? e.message : 'Unknown' };
      }
    }

    // SHORTS: Extract individual clips
    if (render_type === "shorts" || render_type === "all") {
      console.log("[ai-execute-edits] Extracting shorts...");
      
      const shorts = aiSuggestions.shorts || aiSuggestions.broll_cues || aiSuggestions.viral_moments || [];
      console.log("[ai-execute-edits] Found", shorts.length, "shorts to extract");
      
      for (const short of shorts.slice(0, 5)) {
        try {
          const startTime = parseFloat(short.start_time || short.timestamp || short.start || 0);
          const duration = parseFloat(short.duration || 15);
          const endTime = parseFloat(short.end_time || short.end || (startTime + duration));
          
          console.log("[ai-execute-edits] Creating short:", startTime, "to", endTime);
          
          const clipRes = await supabase.functions.invoke("mux-create-clip", {
            body: {
              asset_id: muxAssetId,
              playback_id: muxPlaybackId,
              start_time: startTime,
              end_time: Math.min(endTime, videoDuration),
              output_name: short.title || short.suggestion || `Short ${shortsResults.length + 1}`,
              create_permanent: true
            }
          });
          
          if (clipRes.data?.success) {
            shortsResults.push({
              ...clipRes.data,
              label: short.title || short.suggestion,
              hook: short.hook,
              cta: short.cta
            });
          }
        } catch (e) {
          console.error("[ai-execute-edits] Short clip error:", e);
        }
      }
    }

    // Update queue with results
    console.log("[ai-execute-edits] Updating queue with results...");
    
    const isSuccess = renderResult?.success || shortsResults.length > 0;
    const isComplete = renderResult?.ready === true;
    
    const updateData: any = {
      render_status: isComplete ? "complete" : (isSuccess ? "processing" : "failed"),
      status: isComplete ? "complete" : (isSuccess ? "rendering" : "error"),
      updated_at: new Date().toISOString()
    };

    if (renderResult?.download_url) {
      updateData.final_render_url = renderResult.download_url;
    }

    if (shortsResults.length > 0) {
      updateData.shorts_extracted = shortsResults;
    }

    console.log("[ai-execute-edits] Update data:", JSON.stringify(updateData));

    await supabase
      .from("video_edit_queue")
      .update(updateData)
      .eq("id", video_edit_id);

    const response = {
      success: isSuccess,
      video_edit_id,
      mux_asset_id: muxAssetId,
      render_result: renderResult,
      shorts_count: shortsResults.length,
      shorts: shortsResults,
      download_url: renderResult?.download_url || null,
      ready: isComplete
    };

    console.log("[ai-execute-edits] ====== FUNCTION COMPLETE ======");
    console.log("[ai-execute-edits] Response:", JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[ai-execute-edits] FATAL ERROR:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper to update queue with failure
async function updateQueueFailed(supabase: any, videoEditId: string, error: string) {
  await supabase
    .from("video_edit_queue")
    .update({ 
      render_status: "failed", 
      status: "error",
      updated_at: new Date().toISOString() 
    })
    .eq("id", videoEditId);
}
