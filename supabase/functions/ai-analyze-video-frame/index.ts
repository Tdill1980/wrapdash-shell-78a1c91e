import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisualTags {
  has_vehicle: boolean;
  has_wrap_install: boolean;
  has_finished_result: boolean;
  has_peel: boolean;
  has_logo: boolean;
  has_person: boolean;
  dominant_motion: "static" | "hand_install" | "peel_motion" | "camera_pan" | "unknown";
  environment: "shop" | "outdoor" | "studio" | "unknown";
  quality_score: number;
  analyzed_frames: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_id, mux_playback_id } = await req.json();

    if (!video_id) {
      return new Response(
        JSON.stringify({ error: "video_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get video info if mux_playback_id not provided
    let playbackId = mux_playback_id;
    if (!playbackId) {
      const { data: video, error: videoError } = await supabase
        .from("content_files")
        .select("mux_playback_id, visual_analyzed_at")
        .eq("id", video_id)
        .single();

      if (videoError || !video) {
        return new Response(
          JSON.stringify({ error: "Video not found", video_id }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Skip if already analyzed
      if (video.visual_analyzed_at) {
        console.log(`Video ${video_id} already analyzed, skipping`);
        return new Response(
          JSON.stringify({ skipped: true, reason: "already_analyzed", video_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      playbackId = video.mux_playback_id;
    }

    if (!playbackId) {
      return new Response(
        JSON.stringify({ error: "No mux_playback_id available", video_id }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract 3 frames: first (1s), middle, last
    // Using Mux Image API: https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg?time={seconds}
    const frameUrls = [
      `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`,
      `https://image.mux.com/${playbackId}/thumbnail.jpg?time=5`,
      `https://image.mux.com/${playbackId}/thumbnail.jpg?time=10`,
    ];

    console.log(`Analyzing video ${video_id} with frames:`, frameUrls);

    // Build vision prompt for factual analysis
    const systemPrompt = `You are a video content analyzer for a vehicle wrap business. 
Analyze the provided video frames and return ONLY factual observations as JSON.
Do NOT infer intent or marketing angles. Just describe what you see.`;

    const userContent = [
      {
        type: "text",
        text: `Analyze these 3 frames from a video. Return a JSON object with these boolean/string fields:
- has_vehicle: Is there a vehicle visible?
- has_wrap_install: Is someone actively installing a wrap?
- has_finished_result: Is there a completed wrapped vehicle?
- has_peel: Is there vinyl being peeled/revealed?
- has_logo: Is there visible branding/logo?
- has_person: Is there a person visible?
- dominant_motion: One of "static", "hand_install", "peel_motion", "camera_pan", "unknown"
- environment: One of "shop", "outdoor", "studio", "unknown"
- quality_score: 0-100 based on clarity, framing, lighting

Return ONLY valid JSON, no explanation.`
      },
      ...frameUrls.map(url => ({
        type: "image_url",
        image_url: { url }
      }))
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI raw response:", rawContent);

    // Parse JSON from response (handle markdown code blocks)
    let visualTags: VisualTags;
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        rawContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, rawContent];
      const jsonStr = jsonMatch[1] || rawContent;
      const parsed = JSON.parse(jsonStr.trim());
      
      visualTags = {
        has_vehicle: Boolean(parsed.has_vehicle),
        has_wrap_install: Boolean(parsed.has_wrap_install),
        has_finished_result: Boolean(parsed.has_finished_result),
        has_peel: Boolean(parsed.has_peel),
        has_logo: Boolean(parsed.has_logo),
        has_person: Boolean(parsed.has_person),
        dominant_motion: parsed.dominant_motion || "unknown",
        environment: parsed.environment || "unknown",
        quality_score: Math.min(100, Math.max(0, Number(parsed.quality_score) || 50)),
        analyzed_frames: 3,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return safe defaults on parse failure
      visualTags = {
        has_vehicle: false,
        has_wrap_install: false,
        has_finished_result: false,
        has_peel: false,
        has_logo: false,
        has_person: false,
        dominant_motion: "unknown",
        environment: "unknown",
        quality_score: 50,
        analyzed_frames: 3,
      };
    }

    // Update content_files with visual_tags
    const { error: updateError } = await supabase
      .from("content_files")
      .update({
        visual_tags: visualTags,
        visual_analyzed_at: new Date().toISOString(),
      })
      .eq("id", video_id);

    if (updateError) {
      console.error("Failed to update content_files:", updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`Successfully analyzed video ${video_id}:`, visualTags);

    return new Response(
      JSON.stringify({
        success: true,
        video_id,
        visual_tags: visualTags,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-analyze-video-frame error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
