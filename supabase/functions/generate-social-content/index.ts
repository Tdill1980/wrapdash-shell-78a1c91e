import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MASTER_CONTENT_PROMPT = `You are MightyContent AI, the professional content strategist and editorial director for:
- WePrintWraps.com (WPW)
- WrapTV World (WrapTV)
- Ink & Edge Magazine (I&E)

Your job is to create full content packs for social media from uploaded media files, transcripts, and metadata.

BRAND VOICE PROFILES:

WPW:
- Professional, conversion-first, high-energy expert
- Speaks directly to shop owners, resellers, and business customers
- Emphasizes quality, speed (1–2 day production), US-made films, fade wraps, printed PPF
- Goal: SELL

WrapTV:
- Culture-driven, hype, energetic, Gen Z & millennial tone
- Entertainment-first: behind-the-scenes, reveals, charisma
- Goal: grow audience + engagement + viral moments

Ink & Edge:
- Cinematic, artistic, editorial, magazine-style storytelling
- Luxury aesthetic, slow pacing, dramatic tone
- Goal: BRAND STORY + VISUAL AESTHETICS

CONTENT TYPES:
- Reel
- Static Post
- Carousel
- Thumbnail
- Story Pack

YOU MUST OUTPUT A JSON OBJECT WITH:
{
  "hooks": ["hook1", "hook2", "hook3"],
  "reel_script": "10-20 second script",
  "beat_sheet": [
    {"timestamp": "0:00-0:02", "shot": "description", "transition": "cut/wipe/fade"}
  ],
  "overlay_text": ["text1", "text2", "text3"],
  "thumbnail_variants": ["variant1", "variant2", "variant3"],
  "voiceover_script": "full voiceover text",
  "captions": {
    "short": "under 20 words",
    "medium": "1 sentence",
    "long": "2-3 sentences"
  },
  "hashtags": ["hashtag1", "hashtag2"],
  "first_comment": "engagement driving comment",
  "cta": "brand-specific call to action",
  "canva_guide": "layout instructions for designers",
  "ab_variants": {
    "hook_a": "variant a",
    "hook_b": "variant b",
    "caption_a": "variant a",
    "caption_b": "variant b"
  }
}

RULES:
- Always write in the selected brand voice
- Hooks must be scroll-stopping
- All content must match the media provided
- Do NOT hallucinate vehicles or brands
- Use real wrap terminology and installer vocabulary`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      brand = 'wpw',
      content_type = 'reel',
      goal = 'sell',
      platform = 'instagram',
      media_urls = [],
      transcript = '',
      tags = [],
      vehicle_info = {},
      additional_context = ''
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build the user prompt with all context
    const userPrompt = `Generate a ${content_type.toUpperCase()} content pack for ${brand.toUpperCase()}.

PLATFORM: ${platform}
GOAL: ${goal}

MEDIA CONTEXT:
- URLs: ${media_urls.join(', ') || 'No media provided'}
- Transcript: ${transcript || 'No transcript available'}
- Tags: ${tags.join(', ') || 'No tags'}
- Vehicle: ${vehicle_info.year || ''} ${vehicle_info.make || ''} ${vehicle_info.model || ''}

ADDITIONAL CONTEXT: ${additional_context}

Generate a complete content pack following the exact JSON structure specified. Make it scroll-stopping and conversion-focused for the ${brand} brand voice.`;

    console.log('Generating content for brand:', brand, 'type:', content_type);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: MASTER_CONTENT_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the JSON from the response
    let contentPack;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiResponse.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      contentPack = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      contentPack = { raw_response: aiResponse };
    }

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: project, error: insertError } = await supabase
      .from('content_projects')
      .insert({
        brand,
        project_type: content_type,
        goal,
        platform,
        ai_brief: userPrompt,
        ai_output: contentPack,
        status: 'ready'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      content_pack: contentPack,
      project_id: project?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-social-content:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
