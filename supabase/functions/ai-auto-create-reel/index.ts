import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const systemPrompt = `You are an expert video content strategist for vehicle wrap shops.

Given a list of videos with metadata (filename, duration, tags, category), you must:
1. Select 3-5 videos that would make an ENGAGING, VIRAL reel when combined
2. Prioritize: install reveals, satisfying peels, before/after, POV shots, transformations
3. Order them for maximum hook → value → payoff structure
4. Suggest trim points (start/end) for each clip to keep total reel under 30 seconds

Return JSON ONLY:
{
  "selected_videos": [
    {
      "id": "video_id",
      "order": 1,
      "trim_start": 0,
      "trim_end": 5.5,
      "reason": "Strong hook - dramatic reveal",
      "suggested_overlay": "WAIT FOR IT"
    }
  ],
  "reel_concept": "Satisfying install compilation with dramatic reveal ending",
  "suggested_hook": "You won't believe this transformation",
  "suggested_cta": "Follow for more installs",
  "music_vibe": "upbeat_energy",
  "estimated_virality": 85
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, filter_category, max_videos } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch videos from media library
    let query = supabase
      .from("content_files")
      .select("id, file_url, original_filename, duration_seconds, tags, content_category, thumbnail_url, created_at")
      .eq("file_type", "video")
      .order("created_at", { ascending: false })
      .limit(max_videos || 50);

    if (organization_id) {
      query = query.eq("organization_id", organization_id);
    }

    if (filter_category && filter_category !== "all") {
      query = query.eq("content_category", filter_category);
    }

    const { data: videos, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching videos:", fetchError);
      throw new Error("Failed to fetch videos");
    }

    if (!videos || videos.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No videos found in library",
        selected_videos: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Found ${videos.length} videos, analyzing with AI...`);

    // Prepare video list for AI
    const videoSummary = videos.map(v => ({
      id: v.id,
      filename: v.original_filename || "Untitled",
      duration: v.duration_seconds || 10,
      tags: v.tags || [],
      category: v.content_category || "raw",
    }));

    // Call AI to select best videos
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
          {
            role: "user",
            content: `Analyze these videos and select the best ones for a viral reel:\n\n${JSON.stringify(videoSummary, null, 2)}`
          }
        ],
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI error: ${errorText}`);
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || "{}";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      console.error("Failed to parse AI response:", content);
      result = { selected_videos: [], error: "Failed to parse AI response" };
    }

    // Enrich selected videos with full data
    const enrichedVideos = (result.selected_videos || []).map((selected: any) => {
      const original = videos.find(v => v.id === selected.id);
      return {
        ...selected,
        file_url: original?.file_url,
        thumbnail_url: original?.thumbnail_url,
        original_filename: original?.original_filename,
        duration_seconds: original?.duration_seconds,
      };
    });

    return new Response(JSON.stringify({
      ...result,
      selected_videos: enrichedVideos,
      total_analyzed: videos.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ai-auto-create-reel error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Unknown error",
      selected_videos: []
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
