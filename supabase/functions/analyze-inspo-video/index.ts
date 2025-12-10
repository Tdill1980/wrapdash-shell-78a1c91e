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
    const { videoUrl, platform, organizationId } = await req.json();

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "videoUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing video from ${platform}: ${videoUrl}`);

    const systemPrompt = `You are an expert video content analyst specializing in social media reels, TikToks, and short-form video content. Analyze the provided video URL and extract detailed style information.

Return a JSON object with the following structure:
{
  "pacing": {
    "cutsPerSecond": number (0.5-3),
    "averageClipLength": number (seconds),
    "rhythm": "slow" | "medium" | "fast" | "variable"
  },
  "color": {
    "palette": string[] (3-5 hex colors),
    "mood": string,
    "saturation": "muted" | "balanced" | "vibrant",
    "contrast": "low" | "medium" | "high"
  },
  "structure": {
    "hook": { "duration": number, "style": string },
    "body": { "duration": number, "style": string },
    "cta": { "duration": number, "style": string }
  },
  "overlays": {
    "textStyle": string,
    "fontSize": "small" | "medium" | "large",
    "fontWeight": "light" | "regular" | "bold",
    "position": "top" | "center" | "bottom",
    "animation": string
  },
  "hooks": string[] (3-5 hook phrases detected or suggested),
  "cta": string (call to action text),
  "music": {
    "genre": string,
    "energy": "low" | "medium" | "high",
    "bpm": number
  },
  "transitions": string[] (transition types used)
}

Be specific and actionable. This analysis will be used to recreate the style in new videos.`;

    const userPrompt = `Analyze this ${platform || "social media"} video: ${videoUrl}

Based on the URL and platform, provide a detailed style breakdown that could be applied to vehicle wrap industry content. Focus on what makes this content engaging and how the style elements could be adapted for automotive/wrap shop marketing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a default analysis structure
      analysis = {
        pacing: { cutsPerSecond: 1, averageClipLength: 3, rhythm: "medium" },
        color: { palette: ["#FF6B35", "#2E2E2E", "#FFFFFF"], mood: "energetic", saturation: "vibrant", contrast: "high" },
        structure: {
          hook: { duration: 3, style: "Problem statement" },
          body: { duration: 12, style: "Process showcase" },
          cta: { duration: 3, style: "Direct ask" }
        },
        overlays: { textStyle: "Bold sans-serif", fontSize: "large", fontWeight: "bold", position: "center", animation: "pop-in" },
        hooks: ["Watch this transformation", "You won't believe this", "Before vs After"],
        cta: "DM us for a quote",
        music: { genre: "Hip-hop/Electronic", energy: "high", bpm: 120 },
        transitions: ["Cut", "Zoom", "Whip pan"]
      };
    }

    // Store in database if organizationId provided
    if (organizationId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("inspo_analyses").insert({
        organization_id: organizationId,
        source_url: videoUrl,
        platform: platform || "unknown",
        analysis_data: analysis,
        title: `${platform || "Video"} Analysis - ${new Date().toLocaleDateString()}`,
      });
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-inspo-video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});