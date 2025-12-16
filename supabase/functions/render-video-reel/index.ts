// Creatomate Video Render Edge Function
// Renders videos using Creatomate API with organization's extracted style from uploaded templates

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadVoiceProfile } from "../_shared/voice-engine-loader.ts";
import { loadOrganizationStyle, OrganizationStyleProfile } from "../_shared/style-profile-loader.ts";

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

      // LOAD ORGANIZATION STYLE PROFILE (extracted from uploaded Canva templates)
      let orgStyle: OrganizationStyleProfile | null = null;
      if (organization_id) {
        try {
          orgStyle = await loadOrganizationStyle(organization_id);
          console.log('[render-video-reel] Loaded org style profile:', orgStyle.style_name || 'Custom Style');
        } catch (e) {
          console.warn('[render-video-reel] Could not load org style:', e);
        }
      }

      // Load voice profile for additional brand context
      let voiceProfile = null;
      if (organization_id) {
        try {
          voiceProfile = await loadVoiceProfile(organization_id);
          console.log('[render-video-reel] Loaded voice profile for org:', organization_id);
        } catch (e) {
          console.warn('[render-video-reel] Could not load voice profile:', e);
        }
      }

      // Helper: Truncate text at word boundaries (never cut mid-word)
      const truncateAtWord = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > maxLength * 0.4) {
          return truncated.substring(0, lastSpace);
        }
        return truncated;
      };

      // Build modifications object
      const modifications: Record<string, string | number | boolean> = {
        'Video.source': video_url,
      };

      // Add additional clips if provided
      if (additional_clips && additional_clips.length > 0) {
        additional_clips.forEach((clipUrl, idx) => {
          modifications[`Video-${idx + 2}.source`] = clipUrl;
        });
      }

      // ============ APPLY ORGANIZATION STYLE (from uploaded templates) ============
      // This is the key fix - use extracted style from user's Canva templates
      const style = orgStyle || {
        safe_zone_width: '70%',
        hook_position: '18%',
        body_position: '50%',
        cta_position: '82%',
        text_alignment: 'center',
        font_headline: 'Bebas Neue',
        font_body: 'Poppins',
        font_weight: 'bold',
        text_case: 'uppercase',
        primary_text_color: '#FFFFFF',
        secondary_text_color: '#FFFFFF',
        accent_color: '#FF6B35',
        text_shadow_enabled: true,
        shadow_blur: 10,
        shadow_color: 'rgba(0,0,0,0.8)',
        text_outline_enabled: false,
        outline_width: 2,
      };

      console.log('[render-video-reel] Using style:', {
        font: style.font_headline,
        hookPos: style.hook_position,
        color: style.primary_text_color,
        shadow: style.text_shadow_enabled,
      });

      // Text settings from ORG STYLE
      const textSettings = {
        width: style.safe_zone_width,
        x: '50%',
        x_alignment: '50%',
        font_size_hook: '64',
        font_size_body: '48',
        font_size_cta: '40',
        line_height: '110%',
      };

      // Add headline with ORG STYLE positioning and formatting
      if (headline) {
        const shortHeadline = truncateAtWord(headline, 12);
        const formattedHeadline = style.text_case === 'uppercase' 
          ? shortHeadline.toUpperCase() 
          : style.text_case === 'lowercase' 
            ? shortHeadline.toLowerCase() 
            : shortHeadline;
        
        modifications['Text-1.text'] = formattedHeadline;
        modifications['Text-1.width'] = textSettings.width;
        modifications['Text-1.x'] = textSettings.x;
        modifications['Text-1.x_alignment'] = textSettings.x_alignment;
        modifications['Text-1.font_size'] = textSettings.font_size_hook;
        modifications['Text-1.y'] = style.hook_position;
        modifications['Text-1.line_height'] = textSettings.line_height;
        modifications['Text-1.font_family'] = style.font_headline;
        modifications['Text-1.font_weight'] = style.font_weight === 'black' ? '900' : style.font_weight === 'bold' ? '700' : '400';
        modifications['Text-1.fill_color'] = style.primary_text_color;
        
        // Apply shadow from org style
        if (style.text_shadow_enabled) {
          modifications['Text-1.shadow_blur'] = style.shadow_blur;
          modifications['Text-1.shadow_color'] = style.shadow_color;
          modifications['Text-1.shadow_x'] = 2;
          modifications['Text-1.shadow_y'] = 2;
        }
      }

      // Add subtext/CTA with ORG STYLE
      if (subtext) {
        const shortSubtext = truncateAtWord(subtext, 15);
        modifications['Text-2.text'] = shortSubtext;
        modifications['Text-2.width'] = textSettings.width;
        modifications['Text-2.x'] = textSettings.x;
        modifications['Text-2.x_alignment'] = textSettings.x_alignment;
        modifications['Text-2.font_size'] = textSettings.font_size_cta;
        modifications['Text-2.y'] = style.cta_position;
        modifications['Text-2.line_height'] = textSettings.line_height;
        modifications['Text-2.font_family'] = style.font_body;
        modifications['Text-2.fill_color'] = style.accent_color || style.secondary_text_color;
        
        if (style.text_shadow_enabled) {
          modifications['Text-2.shadow_blur'] = Math.max(style.shadow_blur - 2, 6);
          modifications['Text-2.shadow_color'] = style.shadow_color;
        }
      }

      // Add dynamic overlays with ORG STYLE
      if (requestOverlays && requestOverlays.length > 0) {
        const yPositions = [style.hook_position, style.body_position, style.cta_position];
        
        requestOverlays.forEach((overlay, idx) => {
          const shortText = truncateAtWord(overlay.text, 15);
          const formattedText = style.text_case === 'uppercase' ? shortText.toUpperCase() : shortText;
          
          modifications[`Overlay-${idx + 1}.text`] = formattedText;
          modifications[`Overlay-${idx + 1}.time`] = overlay.time;
          modifications[`Overlay-${idx + 1}.duration`] = overlay.duration;
          modifications[`Overlay-${idx + 1}.width`] = textSettings.width;
          modifications[`Overlay-${idx + 1}.x`] = textSettings.x;
          modifications[`Overlay-${idx + 1}.x_alignment`] = textSettings.x_alignment;
          modifications[`Overlay-${idx + 1}.font_size`] = textSettings.font_size_body;
          modifications[`Overlay-${idx + 1}.line_height`] = textSettings.line_height;
          modifications[`Overlay-${idx + 1}.y`] = yPositions[idx % 3];
          modifications[`Overlay-${idx + 1}.font_family`] = style.font_headline;
          modifications[`Overlay-${idx + 1}.fill_color`] = style.primary_text_color;
          
          if (style.text_shadow_enabled) {
            modifications[`Overlay-${idx + 1}.shadow_blur`] = style.shadow_blur;
            modifications[`Overlay-${idx + 1}.shadow_color`] = style.shadow_color;
          }
        });
      }

      // Add music if provided
      if (music_url) {
        modifications['Audio.source'] = music_url;
      }

      // LEGACY: Apply inspo_style if passed directly (backwards compatibility)
      if (inspo_style && !orgStyle) {
        console.log('[render-video-reel] Applying legacy inspo_style:', inspo_style);
        
        if (inspo_style.text_color) {
          modifications['Text-1.fill_color'] = inspo_style.text_color;
          modifications['Text-2.fill_color'] = inspo_style.text_color;
        }
        
        if (inspo_style.accent_color) {
          modifications['Text-2.fill_color'] = inspo_style.accent_color;
        }
        
        if (inspo_style.text_shadow) {
          modifications['Text-1.shadow_blur'] = 12;
          modifications['Text-1.shadow_color'] = 'rgba(0,0,0,0.9)';
        }
        
        if (inspo_style.font_weight === 'black' || inspo_style.font_weight === 'bold') {
          modifications['Text-1.font_weight'] = '900';
        }
      }

      // Fallback to voice profile colors if no org style
      if (!orgStyle && !inspo_style) {
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
      console.log('[render-video-reel] Key modifications:', {
        video: video_url.substring(0, 50) + '...',
        headline: modifications['Text-1.text'],
        font: modifications['Text-1.font_family'],
        hookPosition: modifications['Text-1.y'],
        textColor: modifications['Text-1.fill_color'],
        hasShadow: !!modifications['Text-1.shadow_blur'],
      });

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
      const render = Array.isArray(renderResult) ? renderResult[0] : renderResult;
      
      console.log('[render-video-reel] Render started:', render.id, 'status:', render.status);

      // Log to database
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
          style_applied: orgStyle ? 'organization_style' : inspo_style ? 'inspo_style' : 'defaults',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
