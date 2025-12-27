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

  console.log("[mux-stitch-reel] ====== FUNCTION INVOKED (DEPRECATED) ======");
  console.error("[mux-stitch-reel] This function is deprecated. Mux cannot concatenate multiple video segments.");
  console.error("[mux-stitch-reel] Use render-reel (Creatomate) instead.");

  try {
    const body: StitchRequest = await req.json();
    const { video_edit_id } = body;

    // If we have a video_edit_id, update it with a helpful error
    if (video_edit_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase
        .from("video_edit_queue")
        .update({
          render_status: "failed",
          error_message: "Mux cannot concatenate multiple video segments via /video/v1/assets. Additional inputs are treated as overlays/audio, not video clips. Use the Creatomate renderer (render-reel function) instead.",
          updated_at: new Date().toISOString()
        })
        .eq("id", video_edit_id);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "mux_cannot_stitch",
        message: "Mux cannot concatenate multiple video segments. Use render-reel (Creatomate) instead.",
        migration_notice: "This function is deprecated. Call 'render-reel' for multi-clip stitching with Creatomate."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (err) {
    console.error("[mux-stitch-reel] Error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err instanceof Error ? err.message : "Unknown error",
        migration_notice: "This function is deprecated. Use render-reel instead."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
