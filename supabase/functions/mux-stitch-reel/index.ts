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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error("Mux credentials not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { 
      clips, 
      music_url, 
      music_start = 0,
      output_name,
      video_edit_id,
      organization_id
    }: StitchRequest = await req.json();

    if (!clips || clips.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one clip is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[mux-stitch-reel] Stitching ${clips.length} clips into reel`);
    
    // Calculate total duration
    const totalDuration = clips.reduce((sum, clip) => sum + (clip.end_time - clip.start_time), 0);
    console.log(`[mux-stitch-reel] Total duration: ${totalDuration}s`);

    const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    // Build input array for Mux - each clip becomes an input segment
    const inputArray = clips.map((clip, index) => {
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

    // Create stitched asset via Mux
    const createAssetResponse = await fetch("https://api.mux.com/video/v1/assets", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${muxAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: inputArray,
        playback_policy: ["public"],
        mp4_support: "standard"
      })
    });

    if (!createAssetResponse.ok) {
      const errorText = await createAssetResponse.text();
      console.error(`[mux-stitch-reel] Mux API error:`, errorText);
      throw new Error(`Mux API error: ${createAssetResponse.status} - ${errorText}`);
    }

    const assetData = await createAssetResponse.json();
    const newAsset = assetData.data;
    const playbackId = newAsset.playback_ids?.[0]?.id;
    
    console.log(`[mux-stitch-reel] Created stitched asset: ${newAsset.id}, playback: ${playbackId}`);

    const result = {
      success: true,
      asset_id: newAsset.id,
      playback_id: playbackId,
      playback_url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
      download_url: playbackId ? `https://stream.mux.com/${playbackId}/high.mp4` : null,
      thumbnail_url: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null,
      gif_url: playbackId ? `https://image.mux.com/${playbackId}/animated.gif?width=480` : null,
      status: newAsset.status,
      duration: totalDuration,
      clips_count: clips.length,
      name: output_name || `Reel - ${clips.length} clips`
    };

    // Update video_edit_queue if ID provided
    if (video_edit_id) {
      console.log(`[mux-stitch-reel] Updating video_edit_queue: ${video_edit_id}`);
      
      await supabase
        .from("video_edit_queue")
        .update({
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
        })
        .eq("id", video_edit_id);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[mux-stitch-reel] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
