import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Poll Mux for asset readiness - assets need time to process
async function waitForAssetReady(assetId: string, muxAuth: string, maxWaitMs = 120000): Promise<{ready: boolean, asset: any}> {
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds
  
  console.log(`[mux-upload] Waiting for asset ${assetId} to be ready (max ${maxWaitMs/1000}s)...`);
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
        headers: { 'Authorization': `Basic ${muxAuth}` }
      });
      
      if (!res.ok) {
        console.error(`[mux-upload] Status check failed: ${res.status}`);
        await new Promise(r => setTimeout(r, pollInterval));
        continue;
      }
      
      const data = await res.json();
      const asset = data.data;
      
      console.log(`[mux-upload] Asset status: ${asset.status} (${Math.round((Date.now() - startTime)/1000)}s elapsed)`);
      
      if (asset.status === 'ready') {
        return { ready: true, asset };
      }
      
      if (asset.status === 'errored') {
        console.error(`[mux-upload] Asset errored:`, asset.errors);
        return { ready: false, asset };
      }
      
      // Still preparing, wait and retry
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (e) {
      console.error(`[mux-upload] Poll error:`, e);
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  
  console.log(`[mux-upload] Timeout waiting for asset readiness`);
  return { ready: false, asset: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MUX_TOKEN_ID = Deno.env.get('MUX_TOKEN_ID');
    const MUX_TOKEN_SECRET = Deno.env.get('MUX_TOKEN_SECRET');
    
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error('MUX credentials not configured');
    }

    const body = await req.json();
    console.log('[mux-upload] Received body:', JSON.stringify(body));
    
    const { file_url, content_file_id, organization_id, wait_for_ready = true } = body;
    
    if (!file_url) {
      console.error('[mux-upload] No file_url in body. Keys received:', Object.keys(body));
      throw new Error('file_url is required');
    }

    console.log('[mux-upload] Creating MUX asset from URL:', file_url);

    const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
    
    const muxResponse = await fetch('https://api.mux.com/video/v1/assets', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${muxAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [{ url: file_url }],
        playback_policy: ['public'],
        mp4_support: 'standard', // Enable MP4 downloads
        passthrough: JSON.stringify({ content_file_id, organization_id }),
      }),
    });

    if (!muxResponse.ok) {
      const errorText = await muxResponse.text();
      console.error('[mux-upload] MUX API error:', errorText);
      throw new Error(`MUX API error: ${muxResponse.status} - ${errorText}`);
    }

    const muxData = await muxResponse.json();
    let asset = muxData.data;

    console.log('[mux-upload] MUX asset created:', asset.id, 'status:', asset.status);

    // Wait for asset to be ready if requested (default: yes)
    if (wait_for_ready && asset.status !== 'ready') {
      const { ready, asset: readyAsset } = await waitForAssetReady(asset.id, muxAuth);
      
      if (ready && readyAsset) {
        asset = readyAsset;
        console.log('[mux-upload] Asset is now ready!');
      } else {
        console.warn('[mux-upload] Asset not ready after waiting, returning current state');
      }
    }

    // Update content_files with MUX asset ID
    if (content_file_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('content_files')
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: asset.playback_ids?.[0]?.id || null,
          processing_status: asset.status === 'ready' ? 'ready' : 'processing',
        })
        .eq('id', content_file_id);
      
      console.log('[mux-upload] Updated content_files:', content_file_id);
    }

    const playbackId = asset.playback_ids?.[0]?.id || null;
    
    console.log('[mux-upload] Complete - Asset:', asset.id, 'Playback:', playbackId, 'Status:', asset.status);

    return new Response(JSON.stringify({
      success: true,
      asset_id: asset.id,
      playback_id: playbackId,
      status: asset.status,
      duration: asset.duration || null,
      ready: asset.status === 'ready',
      download_url: playbackId ? `https://stream.mux.com/${playbackId}/high.mp4` : null,
      thumbnail_url: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[mux-upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
