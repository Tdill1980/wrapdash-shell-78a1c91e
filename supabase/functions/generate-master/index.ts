import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { width, height, style, subStyle, intensity } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    console.log("Generating master canvas:", {
      width,
      height,
      style,
      subStyle,
      intensity
    });

    // Style Routing
    let stylePrompt = "";
    if (style === "commercial") {
      const styles = {
        clean: "minimalist, clean color blocking, pro commercial branding",
        bold: "high contrast, thick geometric shapes, vivid commercial graphics",
        patterned: "pattern-based commercial layout with texture",
        premium: "luxury metallic fades, elegant sweeping curves"
      };
      stylePrompt = styles[subStyle as keyof typeof styles] ?? styles.clean;
    } else if (style === "restyle") {
      stylePrompt = "wild artistic wraps, splatter, honeycomb, flames, glitch";
    } else if (style === "anime") {
      stylePrompt = "cel-shaded anime style, manga linework, halftones";
    } else if (style === "livery") {
      stylePrompt = "motorsport livery, angular cuts, speed geometry";
    } else if (style === "racing") {
      stylePrompt = "aggressive racing stripes, diagonal shapes, motion blur style";
    } else if (style === "offroad") {
      stylePrompt = "camo, rugged terrain, cracked textures, outdoors energy";
    } else if (style === "highend") {
      stylePrompt = "luxury satin gradients, metallic accents, minimal premium design";
    }

    const intensityPrompt =
      intensity === "extreme"
        ? "maximum aggression, bold shapes"
        : intensity === "soft"
        ? "subtle, smooth, elegant"
        : "balanced intensity";

    const prompt = `Generate a FLAT vehicle wrap panel.

Requirements:
- Style: ${stylePrompt}
- Intensity: ${intensityPrompt}
- Print format rectangle
- Edge-to-edge artwork
- NO 3D, NO perspective
- High detail, clean vector-like look
Panel size: ${width}" x ${height}"`;

    const ai = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
      }
    );

    if (!ai.ok) {
      const errorText = await ai.text();
      console.error("AI API error:", ai.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const json = await ai.json();
    const preview = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!preview) throw new Error("No image returned from AI");

    return new Response(JSON.stringify({ preview }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("generate-master error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
