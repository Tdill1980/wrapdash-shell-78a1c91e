import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { width, height, style, subStyle, intensity } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log("Generating master canvas:", { width, height, style, subStyle, intensity });

    // Build style-specific prompt
    let stylePrompt = "";
    
    if (style === "commercial") {
      const subStyles = {
        clean: "minimalist, professional, solid colors with subtle gradients",
        bold: "high contrast, vibrant colors, strong geometric patterns",
        patterned: "repeating patterns, textures, professional branding elements",
        premium: "metallic finishes, luxury gradients, sophisticated color palette"
      };
      stylePrompt = subStyles[subStyle as keyof typeof subStyles] || subStyles.clean;
    } else if (style === "restyle") {
      stylePrompt = "carbon fiber texture, racing stripes, performance aesthetic";
    } else if (style === "anime") {
      stylePrompt = "anime character art, vibrant colors, Japanese graphic style";
    } else if (style === "livery") {
      stylePrompt = "racing livery, sponsor logos, competition graphics";
    } else if (style === "racing") {
      stylePrompt = "aggressive racing graphics, speed lines, performance branding";
    } else if (style === "offroad") {
      stylePrompt = "rugged terrain patterns, adventure graphics, outdoor aesthetic";
    } else if (style === "highend") {
      stylePrompt = "luxury design, premium materials, sophisticated patterns";
    }

    const intensityModifier = intensity === "extreme" 
      ? "very bold and dramatic" 
      : intensity === "soft" 
      ? "subtle and understated" 
      : "balanced";

    const prompt = `Generate a professional vehicle wrap panel design for printing.
Style: ${style} - ${stylePrompt}
Intensity: ${intensityModifier}
Panel dimensions: ${width}" x ${height}"

Requirements:
- High resolution, print-ready quality
- Seamless repeating pattern if applicable
- Professional automotive wrap aesthetic
- ${intensityModifier} visual impact
- Suitable for vehicle body panels

Output a flat 2D design panel optimized for wrap printing.`;

    console.log("Generating master canvas with prompt:", prompt);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image"]
      })
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("AI API error:", aiRes.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiRes.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({
      preview: imageUrl
    }), { 
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      }
    });

  } catch (error) {
    console.error('Error in generate-master:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  }
});
