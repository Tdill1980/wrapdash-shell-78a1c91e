// ColorPro OS - Render Edge Function
// Guards against non-catalog films, uses canonical identifiers only

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ManufacturerKey = '3m' | 'avery';

interface FilmPayload {
  manufacturer: ManufacturerKey;
  series: string;
  official_code: string;
}

interface VehiclePayload {
  year?: number;
  make: string;
  model: string;
  type: string;
  trim?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // OS identity check
    if (body?.toolKey !== 'colorpro') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid toolKey. Expected "colorpro".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const film = body?.film as FilmPayload;
    const vehicle = body?.vehicle as VehiclePayload;
    const angle = body?.angle || 'hero';

    // Validate required film identifiers
    if (!film?.manufacturer || !film?.series || !film?.official_code) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing film identifiers (manufacturer, series, official_code).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required vehicle info
    if (!vehicle?.make || !vehicle?.model || !vehicle?.type) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing vehicle info (make, model, type).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ============================================
    // OS GUARD: Film must exist in official catalog
    // ============================================
    const { data: catalogRow, error: catalogErr } = await supabase
      .from('film_catalog')
      .select('id, manufacturer, series, official_code, official_name, finish, swatch_hex, needs_review, is_active')
      .eq('manufacturer', film.manufacturer)
      .eq('series', film.series)
      .eq('official_code', film.official_code)
      .eq('is_active', true)
      .maybeSingle();

    if (catalogErr) {
      console.error('[ColorPro] Catalog lookup failed:', catalogErr);
      return new Response(
        JSON.stringify({ ok: false, error: 'Catalog lookup failed.', details: catalogErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!catalogRow) {
      // HARD FAIL — no guessing, no fallback
      console.error('[ColorPro] Film not found in catalog:', film);
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Selected film is not in the official catalog.',
          code: 'FILM_NOT_FOUND',
          film,
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build deterministic film label (name is now from catalog, not user input)
    const filmLabel = `${catalogRow.manufacturer.toUpperCase()} ${catalogRow.series.toUpperCase()} ${catalogRow.official_code} — ${catalogRow.official_name}`;

    console.log(`[ColorPro] Rendering ${angle} for ${vehicle.year || ''} ${vehicle.make} ${vehicle.model} with ${filmLabel}`);

    // Build the rendering prompt using catalog data
    const vehicleDesc = `${vehicle.year || ''} ${vehicle.make} ${vehicle.model} ${vehicle.type}`.trim();
    const finishDesc = catalogRow.finish ? `${catalogRow.finish} finish` : '';
    const colorDesc = catalogRow.swatch_hex ? `(approximate hex: ${catalogRow.swatch_hex})` : '';

    const angleDetails: Record<string, string> = {
      hero: 'Front 3/4 view in a modern showroom with professional studio lighting. Dramatic shadows and highlights showcase the wrap perfectly.',
      side: 'Perfect side profile view on a reflective surface with soft studio lighting that emphasizes the wrap texture and color depth.',
      rear: 'Rear 3/4 view with backlit atmosphere, highlighting the wrap coverage and color consistency across all panels.',
      detail: 'Close-up detail shot focusing on body panel with the vinyl wrap, showing texture, finish quality, and color accuracy under natural lighting.',
    };

    const prompt = `Ultra photorealistic 3D render: ${vehicleDesc} with professional automotive vinyl wrap in ${catalogRow.official_name} ${colorDesc}. ${finishDesc}. ${angleDetails[angle] || angleDetails.hero} Professional automotive photography, 8K resolution, ray-traced reflections, highly detailed.`;

    // Call AI gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[ColorPro] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ ok: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert automotive visualization AI specialized in creating photorealistic 3D renders of vehicles with custom vinyl wraps. Generate images that look like professional automotive photography.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ColorPro] AI gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ ok: false, error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to generate render' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('[ColorPro] No image in AI response');
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ColorPro] ${angle} render generated successfully for ${filmLabel}`);

    return new Response(
      JSON.stringify({
        ok: true,
        film: {
          manufacturer: catalogRow.manufacturer,
          series: catalogRow.series,
          official_code: catalogRow.official_code,
          official_name: catalogRow.official_name,
          finish: catalogRow.finish,
        },
        filmLabel,
        imageUrl,
        angle,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ColorPro] Unexpected error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
