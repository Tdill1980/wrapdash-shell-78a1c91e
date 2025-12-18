// Creatomate Video Render Edge Function - DISABLED
// This function is deprecated. Use MightyEdit / Content Factory instead.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.error('[render-video-reel] DEPRECATED: Creatomate is disabled. Use MightyEdit / Content Factory.');

  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Creatomate is disabled. Use MightyEdit / Content Factory instead.',
      migration_notice: 'This render pipeline has been replaced by Content Factory. Open MightyEdit to render videos.'
    }),
    { 
      status: 410, // Gone - indicates resource is no longer available
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
