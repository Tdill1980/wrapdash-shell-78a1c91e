import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, organizationId, contentFileId } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI Vision prompt for style analysis
    const systemPrompt = `You are an expert visual designer and marketing strategist specializing in social media ad analysis.
Analyze this image and extract its visual style, design elements, and marketing approach.

Return a JSON object with these fields:
{
  "styleName": "Descriptive name for this style (e.g., 'Bold Minimal', 'Vintage Aesthetic')",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"] // Extract 4-6 dominant colors,
  "colorMood": "Description of color mood (e.g., 'dark and moody', 'bright and energetic')",
  "typography": {
    "style": "Description of font style used",
    "weight": "light" | "regular" | "bold" | "black",
    "case": "uppercase" | "lowercase" | "mixed",
    "position": "top" | "center" | "bottom" | "overlay"
  },
  "layout": {
    "type": "minimal" | "busy" | "balanced" | "asymmetric",
    "focusPoint": "Description of where eye is drawn",
    "whitespace": "generous" | "moderate" | "tight"
  },
  "hooks": ["List of text hooks/headlines visible"],
  "cta": "Call-to-action text if visible",
  "visualElements": ["List of key visual elements: shapes, icons, overlays"],
  "marketingAngle": "Description of the marketing approach/angle",
  "targetEmotion": "Primary emotion being targeted",
  "brandVoice": "Description of brand voice/tone",
  "recommendations": ["3-5 suggestions for recreating this style"]
}

Be specific about colors (use actual hex codes), fonts, and positioning.`;

    console.log("Analyzing image:", imageUrl);

    // Call Lovable AI with image
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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and extract its visual style for recreation. Return valid JSON only.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Return a default structure if parsing fails
      analysis = {
        styleName: "Analyzed Style",
        colorPalette: ["#000000", "#FFFFFF", "#FF6B35", "#4EEAFF"],
        colorMood: "Unable to determine",
        typography: { style: "Modern", weight: "bold", case: "mixed", position: "center" },
        layout: { type: "balanced", focusPoint: "center", whitespace: "moderate" },
        hooks: [],
        cta: "",
        visualElements: [],
        marketingAngle: "General marketing",
        targetEmotion: "Interest",
        brandVoice: "Professional",
        recommendations: ["Use similar color scheme", "Match typography style", "Follow layout pattern"],
        rawResponse: content,
      };
    }

    // Save to inspo_analyses table
    if (organizationId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: insertError } = await supabase
        .from("inspo_analyses")
        .insert({
          organization_id: organizationId,
          source_url: imageUrl,
          platform: "upload",
          analysis_data: analysis,
          title: analysis.styleName || "Analyzed Style",
        });

      if (insertError) {
        console.error("Failed to save analysis:", insertError);
      }
    }

    console.log("Analysis complete:", analysis.styleName);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
