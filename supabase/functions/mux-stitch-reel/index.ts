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

interface StitchRequest {
  clips: ClipSegment[];
  music_url?: string;
  music_start?: number;
  output_name?: string;
  video_edit_id?: string;
  organization_id?: string;
}

// Check if a Mux asset is ready
async function checkAssetReady(assetId: string, muxAuth: string): Promise<{ready: boolean, status: string}> {
  try {
    const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
      headers: { 'Authorization': `Basic ${muxAuth}` }
    });
    
    if (!res.ok) {
      return { ready: false, status: 'error' };
    }
    
    const data = await res.json();
    return { ready: data.data.status === 'ready', status: data.data.status };
  } catch (e) {
    return { ready: false, status: 'error' };
  }
}

// Wait for stitched asset to be ready
async function waitForAssetReady(assetId: string, muxAuth: string, maxWaitMs = 180000): Promise<{ready: boolean, asset: any}> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  console.log(`[mux-stitch-reel] Waiting for stitched asset ${assetId} to be ready...`);
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
        headers: { 'Authorization': `Basic ${muxAuth}` }
      });
      
      if (!res.ok) {
        await new Promise(r => setTimeout(r, pollInterval));
        continue;
      }
      
      const data = await res.json();
      const asset = data.data;
      
      console.log(`[mux-stitch-reel] Stitched asset status: ${asset.status} (${Math.round((Date.now() - startTime)/1000)}s)`);
      
      if (asset.status === 'ready') {
        return { ready: true, asset };
      }
      
      if (asset.status === 'errored') {
        return { ready: false, asset };
      }
      
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (e) {
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  
  return { ready: false, asset: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[mux-stitch-reel] ====== FUNCTION INVOKED ======");

  try {
    const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error("Mux credentials not configured");
    }

    const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: StitchRequest = await req.json();
    console.log("[mux-stitch-reel] Request body:", JSON.stringify(body));
    
    const { 
      clips, 
      music_url, 
      music_start = 0,
      output_name,
      video_edit_id,
      organization_id
    } = body;

    if (!clips || clips.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one clip is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[mux-stitch-reel] Stitching ${clips.length} clips into reel`);

    // Verify all source assets are ready before attempting to stitch
    for (const clip of clips) {
      const { ready, status } = await checkAssetReady(clip.asset_id, muxAuth);
      console.log(`[mux-stitch-reel] Clip ${clip.asset_id} status: ${status}`);
      
      if (!ready) {
        console.error(`[mux-stitch-reel] Source asset ${clip.asset_id} is not ready (status: ${status})`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Source video is still processing. Please wait and try again.`,
            asset_status: status
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }
    
    // Calculate total duration
    const totalDuration = clips.reduce((sum, clip) => sum + (clip.end_time - clip.start_time), 0);
    console.log(`[mux-stitch-reel] Total duration: ${totalDuration}s`);

    // Build input array for Mux
    const inputArray: any[] = clips.map((clip, index) => {
      console.log(`[mux-stitch-reel] Clip ${index + 1}: ${clip.asset_id} from ${clip.start_time}s to ${clip.end_time}s`);
      return {
        url: `mux://assets/${clip.asset_id}`,
        start_time: clip.start_time,
        end_time: clip.end_time
      };
    });

    // Add music track if provided
    if (music_url) {
      console.log(`[mux-stitch-reel] Adding music track: ${music_url}`);
      inputArray.push({
        url: music_url,
        start_time: music_start,
        end_time: music_start + totalDuration
      });
    }

    console.log("[mux-stitch-reel] Creating stitched asset via Mux API...");
    console.log("[mux-stitch-reel] Input array:", JSON.stringify(inputArray));

    // Helper function for readable Mux errors
    function muxReadableError(status: number, bodyText: string): string {
      if (bodyText.includes("mp4_support") && bodyText.includes("deprecated")) {
        return "Mux rejected: deprecated mp4_support parameter. Redeploy functions.";
      }
      if (bodyText.includes("invalid") || bodyText.includes("Invalid")) {
        return `Mux rejected request: invalid parameters - ${bodyText.substring(0, 200)}`;
      }
      return `Mux API error ${status}: ${bodyText.substring(0, 300)}`;
    }

    // Create stitched asset via Mux
    const createAssetResponse = await fetch("https://api.mux.com/video/v1/assets", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${muxAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: inputArray,
        playback_policy: ["public"]
        // Note: mp4_support removed - deprecated for basic assets
      })
    });

    if (!createAssetResponse.ok) {
      const errorText = await createAssetResponse.text();
      const readableError = muxReadableError(createAssetResponse.status, errorText);
      console.error(`[mux-stitch-reel] ${readableError}`);
      
      // Update video_edit_queue with error if ID provided
      if (video_edit_id) {
        await supabase
          .from("video_edit_queue")
          .update({
            render_status: "failed",
            error_message: readableError,
            updated_at: new Date().toISOString()
          })
          .eq("id", video_edit_id);
      }
      
      return new Response(
        JSON.stringify({ success: false, error: readableError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    const assetData = await createAssetResponse.json();
    let newAsset = assetData.data;
    let playbackId = newAsset.playback_ids?.[0]?.id;
    
    console.log(`[mux-stitch-reel] Created stitched asset: ${newAsset.id}, status: ${newAsset.status}`);

    // Wait for the stitched asset to be ready
    if (newAsset.status !== 'ready') {
      const { ready, asset: readyAsset } = await waitForAssetReady(newAsset.id, muxAuth);
      
      if (ready && readyAsset) {
        newAsset = readyAsset;
        playbackId = newAsset.playback_ids?.[0]?.id;
        console.log("[mux-stitch-reel] Stitched asset is now ready!");
      } else {
        console.warn("[mux-stitch-reel] Stitched asset not ready after waiting");
      }
    }

    const result = {
      success: true,
      asset_id: newAsset.id,
      playback_id: playbackId,
      playback_url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
      download_url: playbackId ? `https://stream.mux.com/${playbackId}/high.mp4` : null,
      thumbnail_url: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null,
      gif_url: playbackId ? `https://image.mux.com/${playbackId}/animated.gif?width=480` : null,
      status: newAsset.status,
      ready: newAsset.status === 'ready',
      duration: totalDuration,
      clips_count: clips.length,
      name: output_name || `Reel - ${clips.length} clips`
    };

    console.log("[mux-stitch-reel] Result:", JSON.stringify(result));

    // Update video_edit_queue if ID provided
    if (video_edit_id) {
      console.log(`[mux-stitch-reel] Updating video_edit_queue: ${video_edit_id}`);
      
      const updateData: any = {
        final_render_url: result.download_url,
        render_status: newAsset.status === "ready" ? "complete" : "processing",
        status: newAsset.status === "ready" ? "complete" : "rendering",
        shorts_extracted: [{
          asset_id: newAsset.id,
          playback_id: playbackId,
          playback_url: result.playback_url,
          download_url: result.download_url,
          thumbnail_url: result.thumbnail_url,
          duration: totalDuration,
          clips: clips.map(c => ({ label: c.label, start: c.start_time, end: c.end_time }))
        }],
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from("video_edit_queue")
        .update(updateData)
        .eq("id", video_edit_id);
      
      if (updateError) {
        console.error("[mux-stitch-reel] Update error:", updateError);
      } else {
        console.log("[mux-stitch-reel] Queue updated successfully");
      }
    }

    console.log("[mux-stitch-reel] ====== FUNCTION COMPLETE ======");

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[mux-stitch-reel] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
