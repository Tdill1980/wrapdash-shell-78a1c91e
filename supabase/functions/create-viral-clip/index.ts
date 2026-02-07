// =====================================================
// CREATE VIRAL CLIP — Meta Ads with Creatomate
// Style: Dara Denney, Sabri Suby, Gary Vee
// Uses existing render-reel function
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Viral hook templates - Dara/Sabri/Gary style
const HOOK_TEMPLATES = [
  "Stop scrolling if you {action}",
  "The #1 mistake {audience} make",
  "Nobody talks about this...",
  "Here's why your {thing} isn't working",
  "I wish someone told me this sooner",
  "This changed everything",
  "Most {audience} get this wrong",
  "Watch this before you {action}",
  "If you're a {audience}, save this",
  "POV: You finally get it",
  "Hot take on {topic}",
  "The truth about {topic}",
];

interface ViralClipRequest {
  video_url: string;              // Source video URL
  hook_text?: string;             // Custom hook or auto-generate
  start_time?: number;            // Clip start (seconds)
  duration?: number;              // Total duration (30-60 sec)
  style?: 'dara' | 'sabri' | 'gary'; // Visual style
  topic?: string;                 // For auto-generating hooks
  audience?: string;              // Target audience
  cta_text?: string;              // End card CTA
  cta_url?: string;               // CTA link
  captions?: boolean;             // Add auto-captions
  aspect_ratio?: '9:16' | '1:1' | '16:9';
}

// Style presets
const STYLE_PRESETS = {
  dara: {
    font: 'Montserrat',
    hook_animation: 'pop',
    hook_position: 'center',
    text_style: 'bold',
    colors: { text: '#FFFFFF', stroke: '#000000' }
  },
  sabri: {
    font: 'Impact',
    hook_animation: 'punch',
    hook_position: 'center',
    text_style: 'bold',
    colors: { text: '#FFFFFF', stroke: '#FF0000' }
  },
  gary: {
    font: 'Bebas Neue',
    hook_animation: 'typewriter',
    hook_position: 'top',
    text_style: 'bold',
    colors: { text: '#FFFF00', stroke: '#000000' }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ViralClipRequest = await req.json();
    const {
      video_url,
      hook_text,
      start_time = 0,
      duration = 45,
      style = 'sabri',
      topic = 'vehicle wraps',
      audience = 'wrap shop owners',
      cta_text = 'Learn More',
      cta_url = 'weprintwraps.com',
      captions = true,
      aspect_ratio = '9:16'
    } = request;

    if (!video_url) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'video_url is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[ViralClip] Creating viral clip from:', video_url);
    console.log('[ViralClip] Style:', style, '| Duration:', duration, '| Aspect:', aspect_ratio);

    // Generate hook if not provided
    let finalHook = hook_text;
    if (!finalHook && anthropicKey) {
      console.log('[ViralClip] Generating hook with AI...');
      try {
        const hookRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 100,
            messages: [{
              role: 'user',
              content: `Generate ONE viral META AD hook for a ${duration} second video about "${topic}" targeting "${audience}". 

Style: ${style === 'sabri' ? 'Sabri Suby - bold, confrontational, pattern interrupt' : 
         style === 'dara' ? 'Dara Denney - educational, punchy, value-first' :
         'Gary Vee - raw, authentic, no BS'}

Return ONLY the hook text. Max 8 words. No quotes.`
            }]
          })
        });
        const hookData = await hookRes.json();
        finalHook = hookData.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '');
        console.log('[ViralClip] Generated hook:', finalHook);
      } catch (e) {
        console.log('[ViralClip] AI hook generation failed:', e);
      }
    }

    // Fallback to template
    if (!finalHook) {
      const template = HOOK_TEMPLATES[Math.floor(Math.random() * HOOK_TEMPLATES.length)];
      finalHook = template
        .replace('{action}', 'want better results')
        .replace('{audience}', audience)
        .replace('{thing}', topic)
        .replace('{topic}', topic);
    }

    const stylePreset = STYLE_PRESETS[style];
    const hookDuration = 3; // Hook text visible for 3 seconds
    const contentDuration = duration - hookDuration - 3; // Reserve 3 sec for end card
    const endCardDuration = 3;

    // Build blueprint for render-reel
    const blueprint = {
      id: `viral_${Date.now()}`,
      platform: 'meta_ads',
      format: 'reel',
      aspectRatio: aspect_ratio,
      font: stylePreset.font,
      textStyle: stylePreset.text_style,
      totalDuration: duration,
      scenes: [
        // Scene 1: Hook text overlay
        {
          sceneId: 'hook',
          clipId: 'hook_clip',
          clipUrl: video_url,
          start: start_time,
          end: start_time + hookDuration,
          purpose: 'hook',
          text: finalHook.toUpperCase(),
          textPosition: stylePreset.hook_position,
          animation: stylePreset.hook_animation
        },
        // Scene 2: Main content
        {
          sceneId: 'content',
          clipId: 'content_clip',
          clipUrl: video_url,
          start: start_time + hookDuration,
          end: start_time + hookDuration + contentDuration,
          purpose: 'content'
        }
      ],
      endCard: {
        duration: endCardDuration,
        text: cta_text.toUpperCase(),
        cta: cta_url
      }
    };

    // Create job in video_edit_queue
    const { data: job, error: jobError } = await supabase
      .from('video_edit_queue')
      .insert({
        organization_id: '51aa96db-c06d-41ae-b3cb-25b045c75caf',
        source_type: 'viral_clip',
        source_url: video_url,
        render_status: 'pending',
        scene_blueprint: blueprint,
        debug_payload: {
          style,
          hook: finalHook,
          topic,
          audience,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error('Failed to create render job: ' + (jobError?.message || 'Unknown error'));
    }

    console.log('[ViralClip] Created job:', job.id);

    // Call render-reel to start the render
    const renderPayload = {
      job_id: job.id,
      blueprint,
      captions: captions ? [
        // Add hook as caption too for accessibility
        {
          text: finalHook,
          time: 0,
          duration: hookDuration,
          style: style,
          animation: 'pop',
          position: 'bottom',
          fontSize: 'large'
        }
      ] : []
    };

    console.log('[ViralClip] Calling render-reel...');
    
    const renderRes = await fetch(`${supabaseUrl}/functions/v1/render-reel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(renderPayload)
    });

    const renderResult = await renderRes.json();

    if (!renderResult.ok) {
      console.error('[ViralClip] Render failed:', renderResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: renderResult.error,
        job_id: job.id,
        hook: finalHook,
        blueprint
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[ViralClip] Render complete:', renderResult.final_url);

    return new Response(JSON.stringify({
      success: true,
      job_id: job.id,
      render_id: renderResult.render_id,
      video_url: renderResult.final_url,
      hook: finalHook,
      style,
      duration,
      aspect_ratio,
      blueprint
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[ViralClip] Error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
