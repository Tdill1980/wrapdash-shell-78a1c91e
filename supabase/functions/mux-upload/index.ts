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
    const MUX_TOKEN_ID = Deno.env.get('MUX_TOKEN_ID');
    const MUX_TOKEN_SECRET = Deno.env.get('MUX_TOKEN_SECRET');
    
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error('MUX credentials not configured');
    }

    const { file_url, content_file_id, organization_id } = await req.json();
    
    if (!file_url) {
      throw new Error('file_url is required');
    }

    console.log('Creating MUX asset from URL:', file_url);

    // Create MUX asset from URL
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
        passthrough: JSON.stringify({ content_file_id, organization_id }),
      }),
    });

    if (!muxResponse.ok) {
      const errorText = await muxResponse.text();
      console.error('MUX API error:', errorText);
      throw new Error(`MUX API error: ${muxResponse.status} - ${errorText}`);
    }

    const muxData = await muxResponse.json();
    const asset = muxData.data;

    console.log('MUX asset created:', asset.id);

    // Update content_files with MUX asset ID
    if (content_file_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('content_files')
        .update({
          mux_asset_id: asset.id,
          processing_status: 'processing',
        })
        .eq('id', content_file_id);
    }

    return new Response(JSON.stringify({
      success: true,
      asset_id: asset.id,
      status: asset.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in mux-upload:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
