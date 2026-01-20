import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaticRequest {
  template: string;
  headline: string;
  bodyText?: string;
  ctaText?: string;
  brand?: string;
  platform?: string;
  contentPurpose?: string;
  slideCount?: number; // For carousels
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: StaticRequest = await req.json();
    const { template, headline, bodyText, ctaText, brand, platform, contentPurpose, slideCount } = body;

    if (!headline) {
      return new Response(
        JSON.stringify({ error: "headline is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating static content: template=${template}, headline=${headline}`);

    // For carousels, we generate multiple slides
    const isCarousel = slideCount && slideCount > 1;
    
    const systemPrompt = `You are an expert social media graphic designer specializing in ${brand || "vehicle wrap"} industry content.
Create ${isCarousel ? `a ${slideCount}-slide carousel` : "a single static post"} design specification that is visually compelling and optimized for ${platform || "Instagram"}.

Return a JSON object with:
{
  ${isCarousel ? `"slides": [` : ""}
  {
    "layout": {
      "background_type": "gradient" | "solid" | "image",
      "background_value": string (gradient CSS or hex color),
      "elements": [
        {
          "type": "text" | "shape" | "icon",
          "content": string,
          "position": { "x": number (0-100%), "y": number (0-100%) },
          "style": {
            "fontSize": number,
            "fontWeight": "400" | "600" | "700" | "800",
            "color": string (hex),
            "textAlign": "left" | "center" | "right"
          }
        }
      ]
    },
    "dimensions": { "width": 1080, "height": 1080 },
    "colorPalette": string[] (3-5 hex colors used),
    "caption": string (Instagram caption for this slide/post),
    "hashtags": string[] (5-10 relevant hashtags)
  }
  ${isCarousel ? `]` : ""}
}

For ${brand || "vehicle wrap"} content:
- Use bold, high-contrast typography
- Include strong visual hierarchy
- Colors should match industry aesthetic (blacks, metallic accents, vibrant brand colors)
- Make text punchy and scannable`;

    const userPrompt = `Create a ${isCarousel ? `${slideCount}-slide carousel` : "static post"} design for:

Template Style: ${template}
Headline: ${headline}
${bodyText ? `Body Text: ${bodyText}` : ""}
${ctaText ? `CTA: ${ctaText}` : ""}
Brand: ${brand || "WPW"}
Platform: ${platform || "Instagram"}
Purpose: ${contentPurpose || "organic"}

Make it visually striking and optimized for engagement.`;

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
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON from response
    let design;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        design = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback design
      design = {
        layout: {
          background_type: "gradient",
          background_value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          elements: [
            {
              type: "text",
              content: headline,
              position: { x: 50, y: 35 },
              style: { fontSize: 48, fontWeight: "800", color: "#FFFFFF", textAlign: "center" }
            },
            {
              type: "text", 
              content: bodyText || "",
              position: { x: 50, y: 55 },
              style: { fontSize: 24, fontWeight: "400", color: "#E0E0E0", textAlign: "center" }
            },
            {
              type: "text",
              content: ctaText || "Learn More",
              position: { x: 50, y: 80 },
              style: { fontSize: 28, fontWeight: "700", color: "#FF6B35", textAlign: "center" }
            }
          ]
        },
        dimensions: { width: 1080, height: 1080 },
        colorPalette: ["#1a1a2e", "#16213e", "#0f3460", "#FF6B35", "#FFFFFF"],
        caption: headline + (bodyText ? `\n\n${bodyText}` : ""),
        hashtags: ["#vehiclewrap", "#carwrap", "#vinylwrap", "#transformation", "#automotive"]
      };
    }

    // Now generate actual image using Gemini image generation
    const imagePrompt = `Create a professional social media graphic for a vehicle wrap business:
- Style: ${template}
- Headline text: "${headline}"
${bodyText ? `- Subtext: "${bodyText}"` : ""}
${ctaText ? `- Call to action: "${ctaText}"` : ""}
- Brand: ${brand || "WPW"}
- Colors: Dark professional theme with orange/red accents
- Make it bold, modern, and suitable for Instagram
- 1:1 square aspect ratio
- High contrast text that's easy to read
- Professional automotive industry aesthetic
Ultra high resolution.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: imagePrompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    let imageUrl: string | null = null;

    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (generatedImage) {
        imageUrl = generatedImage;
        console.log("Image generated successfully");
      }
    } else {
      console.warn("Image generation failed, returning design only");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        design,
        imageUrl,
        caption: design.caption,
        hashtags: design.hashtags
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-generate-static:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
