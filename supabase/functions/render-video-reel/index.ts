// Creatomate Video Render Edge Function
// Renders videos using Creatomate API with brand-specific overlays

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadVoiceProfile } from "../_shared/voice-engine-loader.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CREATOMATE_API_URL = 'https://api.creatomate.com/v2/renders';
const DEFAULT_TEMPLATE_ID = 'b99d8a90-2a85-4ec7-83c4-dfe060ceeedd';

interface OverlayItem {
  text: string;
  time: number;
  duration: number;
}

interface InspoStyle {
  font_style?: string;
  font_weight?: string;
  text_color?: string;
  text_shadow?: boolean;
  text_position?: string;
  background_style?: string;
  accent_color?: string;
  text_animation?: string;
  hook_format?: string;
  emoji_usage?: boolean;
}

interface RenderRequest {
  action: 'start' | 'status';
  // For 'start' action
  video_url?: string;
  additional_clips?: string[];
  headline?: string;
  subtext?: string;
  template_id?: string;
  organization_id?: string;
  music_url?: string;
  overlays?: OverlayItem[];
  inspo_style?: InspoStyle;
  // For 'status' action
  render_id?: string;
}

interface CreatomateRenderResponse {
  id: string;
  status: 'planned' | 'waiting' | 'transcribing' | 'rendering' | 'succeeded' | 'failed';
  url?: string;
  error_message?: string;
  progress?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const CREATOMATE_API_KEY = Deno.env.get('CREATOMATE_API_KEY');
  if (!CREATOMATE_API_KEY) {
    console.error('[render-video-reel] CREATOMATE_API_KEY not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Creatomate API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: RenderRequest = await req.json();
    const { action } = body;

    // ============ CHECK RENDER STATUS ============
    if (action === 'status') {
      const { render_id } = body;
      if (!render_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'render_id required for status check' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[render-video-reel] Checking status for render:', render_id);

      const statusResponse = await fetch(`${CREATOMATE_API_URL}/${render_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('[render-video-reel] Status check failed:', errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to check render status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const renderStatus: CreatomateRenderResponse = await statusResponse.json();
      console.log('[render-video-reel] Render status:', renderStatus.status, 'progress:', renderStatus.progress);

      return new Response(
        JSON.stringify({
          success: true,
          render_id: renderStatus.id,
          status: renderStatus.status,
          progress: renderStatus.progress || 0,
          url: renderStatus.url,
          error_message: renderStatus.error_message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ START NEW RENDER ============
    if (action === 'start') {
      const { 
        video_url, 
        additional_clips,
        headline, 
        subtext, 
        template_id, 
        organization_id,
        music_url,
        overlays: requestOverlays,
        inspo_style
      } = body;

      if (!video_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'video_url is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Load voice profile for brand-specific styling
      let voiceProfile = null;
      if (organization_id) {
        try {
          voiceProfile = await loadVoiceProfile(organization_id);
          console.log('[render-video-reel] Loaded voice profile for org:', organization_id);
        } catch (e) {
          console.warn('[render-video-reel] Could not load voice profile:', e);
        }
      }

      // Build modifications object
      const modifications: Record<string, string | number | boolean> = {
        'Video.source': video_url,
      };

      // Add additional clips if provided (for multi-clip templates)
      if (additional_clips && additional_clips.length > 0) {
        additional_clips.forEach((clipUrl, idx) => {
          modifications[`Video-${idx + 2}.source`] = clipUrl;
        });
      }

      // Add text overlays
      if (headline) {
        modifications['Text-1.text'] = headline;
      }
      if (subtext) {
        modifications['Text-2.text'] = subtext;
      }

      // Add dynamic overlays from request (AI-generated)
      if (requestOverlays && requestOverlays.length > 0) {
        requestOverlays.forEach((overlay, idx) => {
          modifications[`Overlay-${idx + 1}.text`] = overlay.text;
          modifications[`Overlay-${idx + 1}.time`] = overlay.time;
          modifications[`Overlay-${idx + 1}.duration`] = overlay.duration;
        });
      }

      // Add music if provided
      if (music_url) {
        modifications['Audio.source'] = music_url;
      }

      // APPLY INSPO STYLE - Use extracted visual style from user's inspo images
      if (inspo_style) {
        console.log('[render-video-reel] Applying inspo style:', inspo_style);
        
        // Apply text color from inspo
        if (inspo_style.text_color) {
          modifications['Text-1.fill_color'] = inspo_style.text_color;
          modifications['Overlay-1.fill_color'] = inspo_style.text_color;
          modifications['Overlay-2.fill_color'] = inspo_style.text_color;
        }
        
        // Apply accent color
        if (inspo_style.accent_color) {
          modifications['Text-2.fill_color'] = inspo_style.accent_color;
        }
        
        // Apply text shadow if detected in inspo
        if (inspo_style.text_shadow) {
          modifications['Text-1.shadow_blur'] = 8;
          modifications['Text-1.shadow_color'] = 'rgba(0,0,0,0.7)';
          modifications['Text-2.shadow_blur'] = 8;
          modifications['Text-2.shadow_color'] = 'rgba(0,0,0,0.7)';
        }
        
        // Apply font weight
        if (inspo_style.font_weight === 'black' || inspo_style.font_weight === 'bold') {
          modifications['Text-1.font_weight'] = '900';
          modifications['Text-2.font_weight'] = '700';
        }
      } else {
        // Fallback: Apply brand colors if available from merged overlays OR brand_defaults
        const overlays = voiceProfile?.merged?.overlays || voiceProfile?.brand_defaults?.brand_overlays;
        if (overlays) {
          if (overlays.primary_color) {
            modifications['Text-1.fill_color'] = overlays.primary_color;
          }
          if (overlays.secondary_color) {
            modifications['Text-2.fill_color'] = overlays.secondary_color;
          }
        }
      }

      console.log('[render-video-reel] Starting render with template:', template_id || DEFAULT_TEMPLATE_ID);
      console.log('[render-video-reel] Modifications:', JSON.stringify(modifications, null, 2));

      const renderResponse = await fetch(CREATOMATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template_id || DEFAULT_TEMPLATE_ID,
          modifications,
        }),
      });

      if (!renderResponse.ok) {
        const errorText = await renderResponse.text();
        console.error('[render-video-reel] Creatomate API error:', renderResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Creatomate API error: ${renderResponse.status}`,
            details: errorText 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const renderResult = await renderResponse.json();
      
      // Creatomate returns an array of renders
      const render = Array.isArray(renderResult) ? renderResult[0] : renderResult;
      
      console.log('[render-video-reel] Render started:', render.id, 'status:', render.status);

      // Log to database for tracking
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        await supabase.from('content_generation_queue').insert({
          brand: 'wpw',
          organization_id: organization_id || null,
          generation_type: 'video_render',
          status: 'processing',
          content_file_id: null, // Would link to content_files if we have one
        });
      } catch (dbError) {
        console.warn('[render-video-reel] Could not log to database:', dbError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          render_id: render.id,
          status: render.status,
          message: 'Render started successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action. Use "start" or "status".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[render-video-reel] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
