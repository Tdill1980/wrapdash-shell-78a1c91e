// ColorPro is DISABLED in WrapCommandAI
// This function returns 410 Gone to signal deprecation
// ColorPro OS belongs to RestyleProAI only

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve((req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('[ColorPro] DEPRECATED: Attempted call to disabled function');
  
  return new Response(
    JSON.stringify({
      ok: false,
      error: "ColorPro is not available in WrapCommandAI",
      code: "COLORPRO_DISABLED",
    }),
    { 
      status: 410, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
