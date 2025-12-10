// Edge function to load voice profile for frontend consumption
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadVoiceProfile } from "../_shared/voice-engine-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId') || undefined;
    const subdomain = url.searchParams.get('subdomain') || undefined;

    console.log('[load-voice-profile] Loading for org:', organizationId, 'subdomain:', subdomain);

    const voiceProfile = await loadVoiceProfile(organizationId, subdomain);

    return new Response(
      JSON.stringify({
        success: true,
        profile: voiceProfile
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    console.error('[load-voice-profile] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
