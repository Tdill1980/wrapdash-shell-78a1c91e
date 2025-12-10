// Hybrid Content Generation Edge Function
// Generates content using Auto/Hybrid/Exact modes with Voice Engine integration

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadVoiceProfile } from "../_shared/voice-engine-loader.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      organization_id,
      mode = 'auto',
      content_type = 'reel',
      hybrid_brief = '',
      references = '',
      assets = '',
      media_url = '',
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load TradeDNA + brand voice
    let voiceProfile = null;
    let brandContext = "";
    
    try {
      if (organization_id) {
        voiceProfile = await loadVoiceProfile(organization_id);
        
        const merged = voiceProfile?.merged || {};
        const overlays = merged.overlays || voiceProfile?.brand_defaults?.brand_overlays || {};
        
        brandContext = `
BRAND VOICE PROFILE:
- Tone: ${merged.tone || 'professional, confident'}
- Energy: ${merged.energy || 'high-performance'}
- Persona: ${merged.persona || 'industry expert'}
- CTA Style: ${merged.cta_style || 'action-driven'}
- Humor Level: ${merged.humor_level || 0.2}
- Primary Color: ${overlays.primary_color || '#00AFFF'}
- Secondary Color: ${overlays.secondary_color || '#4EEAFF'}
`;
      }
    } catch (err) {
      console.warn("[hybrid-generate-content] Could not load voice profile:", err);
    }

    // Build system prompt based on mode
    const systemPrompt = `You are the HYBRID CONTENT ENGINE for a vehicle wrap industry creative platform.
${brandContext}

You create content packages that include scripts, hooks, captions, hashtags, and CTAs.
Always output valid JSON only, no markdown or explanations.

Content should match the brand voice and be optimized for the target platform.
For wrap shops: focus on transformation, quality, turnaround time, and visual impact.`;

    // Build user prompt
    const userPrompt = `
MODE: ${mode.toUpperCase()}
CONTENT TYPE: ${content_type}

${mode === 'auto' ? `
AUTO MODE INSTRUCTIONS:
- Generate a complete creative package based on the media provided
- Choose the best hook, storyline, and pacing
- Optimize for engagement and conversions
` : ''}

${mode === 'hybrid' ? `
HYBRID MODE INSTRUCTIONS:
- Follow the BRIEF exactly
- Use references for style/tone inspiration
- Use assets for visual planning
- Stay on brand with the voice profile
` : ''}

${mode === 'exact' ? `
EXACT MODE INSTRUCTIONS:
- Follow user instructions precisely
- Only enhance and optimize, don't change core message
- Focus on polishing and rendering quality
` : ''}

BRIEF/INSTRUCTIONS:
${hybrid_brief || "(No brief provided - use best judgment for auto mode)"}

REFERENCE URLS:
${references || "(None provided)"}

ASSETS:
${assets || "(None provided)"}

MEDIA URL:
${media_url || "(None provided)"}

OUTPUT REQUIREMENTS:
Return a JSON object with these keys:
{
  "hook": "Opening hook text (first 1-3 seconds)",
  "script": "Full script or frame descriptions",
  "caption": "Social media caption",
  "hashtags": ["array", "of", "hashtags"],
  "cta": "Call to action text",
  "overlays": [
    { "text": "Overlay text", "time": "0-2s", "style": "bold" }
  ],
  "media_plan": {
    "cuts": [{ "description": "Scene 1", "duration": "0-3s" }],
    "color_palette": ["#000000", "#FFFFFF"],
    "layout_template": "vertical_reel",
    "music_suggestion": "upbeat, energetic"
  }
}
`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    let output = aiResult.choices?.[0]?.message?.content || "";

    // Clean up output - remove markdown code blocks if present
    output = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Save to content_queue
    try {
      await supabase.from("content_queue").insert({
        organization_id,
        content_type,
        mode,
        ai_prompt: hybrid_brief,
        ai_metadata: { references, assets, media_url },
        script: output,
        status: "draft",
      });
    } catch (dbErr) {
      console.error("[hybrid-generate-content] Failed to save to queue:", dbErr);
      // Don't fail the request if DB insert fails
    }

    return new Response(
      JSON.stringify({ success: true, output }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[hybrid-generate-content] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
