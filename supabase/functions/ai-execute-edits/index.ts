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

    if (fetchError) {
      console.error("[ai-execute-edits] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: `Video edit item not found: ${fetchError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    if (!editItem) {
      console.error("[ai-execute-edits] No edit item found for ID:", video_edit_id);
      return new Response(
        JSON.stringify({ success: false, error: "Video edit item not found" }),
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
    
    // Get the Mux asset ID from the content file or metadata
    let muxAssetId: string | null = null;
    let muxPlaybackId: string | null = null;
    
    // Try to get from content_files if we have a content_file_id
    if (editItem.content_file_id) {
      console.log("[ai-execute-edits] Looking up content_file:", editItem.content_file_id);
      
      const { data: contentFile, error: cfError } = await supabase
        .from("content_files")
        .select("mux_asset_id, mux_playback_id, file_url")
        .eq("id", editItem.content_file_id)
        .single();
      
      if (cfError) {
        console.log("[ai-execute-edits] Content file lookup error:", cfError);
      } else if (contentFile) {
        console.log("[ai-execute-edits] Content file found:", contentFile);
        muxAssetId = contentFile.mux_asset_id;
        muxPlaybackId = contentFile.mux_playback_id;
      }
    }
    
    // Fallback: check contentbox_assets
    if (!muxAssetId && editItem.source_url) {
      console.log("[ai-execute-edits] Checking contentbox_assets for source URL...");
      
      const { data: boxAsset, error: boxError } = await supabase
        .from("contentbox_assets")
        .select("id, file_url")
        .eq("file_url", editItem.source_url)
        .maybeSingle();
      
      if (boxError) {
        console.log("[ai-execute-edits] Contentbox lookup error:", boxError);
      } else if (boxAsset) {
        console.log("[ai-execute-edits] Found contentbox asset:", boxAsset.id);
      }
    }

    // If we still don't have a Mux asset ID, we need to upload to Mux first
    if (!muxAssetId && editItem.source_url) {
      console.log("[ai-execute-edits] No Mux asset found, uploading video to Mux...");
      console.log("[ai-execute-edits] Source URL:", editItem.source_url);
      
      try {
        const muxUploadRes = await supabase.functions.invoke("mux-upload", {
          body: { 
            file_url: editItem.source_url,
            content_file_id: editItem.content_file_id,
            organization_id: editItem.organization_id
          }
        });
        
        console.log("[ai-execute-edits] Mux upload response:", JSON.stringify(muxUploadRes.data));
        
        if (muxUploadRes.error) {
          console.error("[ai-execute-edits] Mux upload error:", muxUploadRes.error);
          
          // Update queue with failure
          await supabase
            .from("video_edit_queue")
            .update({ 
              render_status: "failed", 
              status: "error",
              updated_at: new Date().toISOString() 
            })
            .eq("id", video_edit_id);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Mux upload failed: ${muxUploadRes.error.message || 'Unknown error'}` 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
        
        if (muxUploadRes.data?.asset_id) {
          muxAssetId = muxUploadRes.data.asset_id;
          muxPlaybackId = muxUploadRes.data.playback_id;
          console.log("[ai-execute-edits] Uploaded to Mux successfully:", muxAssetId, muxPlaybackId);
          
          // Update content_files if we have one
          if (editItem.content_file_id) {
            await supabase
              .from("content_files")
              .update({ 
                mux_asset_id: muxAssetId, 
                mux_playback_id: muxPlaybackId 
              })
              .eq("id", editItem.content_file_id);
          }
        } else {
          console.error("[ai-execute-edits] Mux upload did not return asset_id:", muxUploadRes.data);
          
          // Update queue with failure
          await supabase
            .from("video_edit_queue")
            .update({ 
              render_status: "failed", 
              status: "error",
              updated_at: new Date().toISOString() 
            })
            .eq("id", video_edit_id);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Mux upload completed but no asset_id returned" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      } catch (e) {
        console.error("[ai-execute-edits] Mux upload exception:", e);
        
        // Update queue with failure
        await supabase
          .from("video_edit_queue")
          .update({ 
            render_status: "failed", 
            status: "error",
            updated_at: new Date().toISOString() 
          })
          .eq("id", video_edit_id);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Mux upload failed: ${e instanceof Error ? e.message : 'Unknown error'}` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    if (!muxAssetId) {
      console.error("[ai-execute-edits] No Mux asset ID available after all attempts");
      console.error("[ai-execute-edits] source_url:", editItem.source_url);
      console.error("[ai-execute-edits] content_file_id:", editItem.content_file_id);
      
      await supabase
        .from("video_edit_queue")
        .update({ 
          render_status: "failed", 
          status: "error",
          updated_at: new Date().toISOString() 
        })
        .eq("id", video_edit_id);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No video source URL available. Cannot upload to Mux." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("[ai-execute-edits] Using Mux asset:", muxAssetId);

    let renderResult = null;
    const shortsResults: any[] = [];
    const videoDuration = editItem.duration_seconds || 60;

    // FULL REEL: Create a single stitched video from AI-suggested segments
    if (render_type === "full" || render_type === "all") {
      console.log("[ai-execute-edits] Creating full reel from AI suggestions");
      
      // Build clips from AI suggestions or use full video if no suggestions
      const clips: ClipSegment[] = [];
      
      // Check for scenes/segments in AI suggestions
      const scenes = aiSuggestions.scenes || aiSuggestions.segments || aiSuggestions.broll_cues || [];
      
      if (scenes.length > 0) {
        console.log("[ai-execute-edits] Using AI-suggested scenes:", scenes.length);
        
        // Use AI-suggested scenes
        for (const scene of scenes.slice(0, 8)) { // Max 8 clips
          const startTime = parseFloat(scene.start_time || scene.timestamp || scene.start || 0);
          const endTime = parseFloat(scene.end_time || scene.end || (startTime + (scene.duration || 5)));
          
          if (endTime > startTime) {
            clips.push({
              asset_id: muxAssetId,
              start_time: startTime,
              end_time: Math.min(endTime, videoDuration),
              label: scene.label || scene.description || scene.suggestion || `Clip ${clips.length + 1}`
            });
          }
        }
      }
      
      // Fallback: if no AI clips, use the full video or smart segments
      if (clips.length === 0) {
        console.log("[ai-execute-edits] No AI clips, creating default segments");
        
        // Create 3-4 clips from the video
        const segmentDuration = Math.min(15, videoDuration / 4);
        const offsets = [0, videoDuration * 0.25, videoDuration * 0.5, videoDuration * 0.75];
        
        for (const offset of offsets) {
          if (offset + segmentDuration <= videoDuration) {
            clips.push({
              asset_id: muxAssetId,
              start_time: offset,
              end_time: offset + segmentDuration,
              label: `Segment ${clips.length + 1}`
            });
          }
        }
      }

      console.log("[ai-execute-edits] Stitching", clips.length, "clips");

      // Call mux-stitch-reel
      try {
        console.log("[ai-execute-edits] Invoking mux-stitch-reel...");
        
        const stitchRes = await supabase.functions.invoke("mux-stitch-reel", {
          body: {
            clips,
            music_url: editItem.selected_music_url,
            video_edit_id,
            organization_id: editItem.organization_id || organization_id,
            output_name: editItem.title || "AI Reel"
          }
        });
        
        console.log("[ai-execute-edits] Stitch result:", JSON.stringify(stitchRes.data));
        
        if (stitchRes.error) {
          console.error("[ai-execute-edits] Stitch error:", stitchRes.error);
        }
        
        renderResult = stitchRes.data;
      } catch (e) {
        console.error("[ai-execute-edits] Stitch exception:", e);
      }
    }

    // SHORTS: Create individual clips for each suggested short
    if (render_type === "shorts" || render_type === "all") {
      console.log("[ai-execute-edits] Extracting shorts from AI suggestions");
      
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
          
          console.log("[ai-execute-edits] Short clip result:", clipRes.data);
          
          if (clipRes.data?.success) {
            shortsResults.push({
              ...clipRes.data,
              label: short.title || short.suggestion,
              hook: short.hook,
              cta: short.cta
            });
          }
        } catch (e) {
          console.error("[ai-execute-edits] Short clip exception:", e);
        }
      }
    }

    // Update queue with render results
    console.log("[ai-execute-edits] Updating video_edit_queue with results...");
    
    const updateData: any = {
      render_status: renderResult?.success ? "processing" : (shortsResults.length > 0 ? "processing" : "failed"),
      updated_at: new Date().toISOString()
    };

    if (renderResult?.download_url) {
      updateData.final_render_url = renderResult.download_url;
      updateData.render_status = "complete";
      updateData.status = "complete";
    }

    if (shortsResults.length > 0) {
      updateData.shorts_extracted = shortsResults;
    }

    if (renderResult?.success || shortsResults.length > 0) {
      updateData.status = updateData.render_status === "complete" ? "complete" : "rendering";
    }

    console.log("[ai-execute-edits] Update data:", JSON.stringify(updateData));

    await supabase
      .from("video_edit_queue")
      .update(updateData)
      .eq("id", video_edit_id);

    const response = {
      success: true,
      video_edit_id,
      mux_asset_id: muxAssetId,
      render_result: renderResult,
      shorts_count: shortsResults.length,
      shorts: shortsResults
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
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
