import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const systemPrompt = `
You analyze YouTube-style long-form content and detect scene segments.

For each segment, identify:
- Hook moments (attention-grabbing openings)
- Teaching/value moments (educational content)
- Reveal moments (transformations, before/after)
- CTA moments (calls to action)
- Testimonial moments (social proof)
- Filler/dead air (low-value segments)
- High emotional/energy points

Return JSON only:
{
  "duration_estimate": number,
  "scenes": [
    {
      "id": number,
      "start": "MM:SS",
      "end": "MM:SS",
      "type": "hook" | "value" | "reveal" | "cta" | "testimonial" | "filler",
      "score": number (0-100),
      "text": "brief description",
      "energy_level": "low" | "medium" | "high"
    }
  ],
  "hook_score": number (0-100),
  "value_segments": number,
  "energy_spikes": number,
  "product_mentions": number,
  "chapters": [
    { "time": "MM:SS", "title": "Chapter title" }
  ]
}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_id, transcript } = await req.json();

    if (!job_id || !transcript) {
      return new Response(
        JSON.stringify({ error: "job_id and transcript required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Detecting scenes for job ${job_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Call AI for scene detection
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this transcript and detect all scenes:\n\n${transcript}` }
        ]
      })
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI error: ${errorText}`);
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || "{}";

    let analysisData = { scenes: [], hook_score: 0, value_segments: 0, chapters: [] };
    try {
      const parsed = JSON.parse(content.match(/({[\s\S]*})/)?.[1] ?? "{}");
      analysisData = parsed;
    } catch {
      console.error("Failed to parse AI response");
    }

    console.log(`Detected ${analysisData.scenes?.length || 0} scenes for job ${job_id}`);

    // Update job with analysis data
    await supabase
      .from("youtube_editor_jobs")
      .update({
        analysis_data: analysisData,
        processing_status: "generating_shorts"
      })
      .eq("id", job_id);

    // Trigger shorts generation
    await supabase.functions.invoke("yt-generate-shorts", {
      body: { 
        job_id, 
        scenes: analysisData.scenes || [], 
        transcript 
      }
    });

    return new Response(
      JSON.stringify({ success: true, analysis: analysisData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("yt-scene-detect error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
