import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log('MUX webhook received:', payload.type);

    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, data } = payload;

    if (type === 'video.asset.ready') {
      const assetId = data.id;
      const playbackId = data.playback_ids?.[0]?.id;
      const duration = data.duration;
      const aspectRatio = data.aspect_ratio;
      
      // Parse passthrough data
      let contentFileId = null;
      try {
        if (data.passthrough) {
          const passthrough = JSON.parse(data.passthrough);
          contentFileId = passthrough.content_file_id;
        }
      } catch (e) {
        console.log('No passthrough data or invalid JSON');
      }

      console.log('Asset ready:', { assetId, playbackId, contentFileId });

      // Update content_files with playback ID and status
      if (contentFileId) {
        await supabase
          .from('content_files')
          .update({
            mux_playback_id: playbackId,
            processing_status: 'ready',
            duration_seconds: Math.round(duration || 0),
            thumbnail_url: `https://image.mux.com/${playbackId}/thumbnail.png?time=0`,
          })
          .eq('id', contentFileId);
      } else {
        // Try to find by asset ID
        await supabase
          .from('content_files')
          .update({
            mux_playback_id: playbackId,
            processing_status: 'ready',
            duration_seconds: Math.round(duration || 0),
            thumbnail_url: `https://image.mux.com/${playbackId}/thumbnail.png?time=0`,
          })
          .eq('mux_asset_id', assetId);
      }

      console.log('Updated content_files with playback ID:', playbackId);

    } else if (type === 'video.asset.errored') {
      const assetId = data.id;
      const errorMessage = data.errors?.messages?.join(', ') || 'Unknown error';
      
      console.error('MUX asset error:', errorMessage);

      // Try to find by asset ID and update
      await supabase
        .from('content_files')
        .update({
          processing_status: 'error',
          metadata: { mux_error: errorMessage },
        })
        .eq('mux_asset_id', assetId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in mux-webhook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
