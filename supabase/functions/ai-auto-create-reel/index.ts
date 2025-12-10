import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_KEY = Deno.env.get("LOVABLE_API_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, filter_category, max_videos, use_inspo } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Fetch user's inspiration files if use_inspo is true
    let inspoContext = "";
    let inspoHooks: string[] = [];
    
    if (use_inspo !== false) {
      const { data: inspoFiles } = await supabase
        .from("content_files")
        .select("id, original_filename, tags, ai_labels, metadata")
        .or("content_category.eq.inspiration,content_category.eq.raw,tags.cs.{inspo}")
        .order("created_at", { ascending: false })
        .limit(10);

      if (inspoFiles && inspoFiles.length > 0) {
        console.log(`Found ${inspoFiles.length} inspo files to learn from`);
        
        // Extract style patterns from inspo
        const inspoPatterns = inspoFiles.map(f => {
          const labels = f.ai_labels as Record<string, any> || {};
          return {
            name: f.original_filename,
            tags: f.tags || [],
            style: labels.style || labels.hook_style,
            hooks: labels.hooks || [],
          };
        });
        
        // Gather hook examples from inspo
        inspoFiles.forEach(f => {
          const labels = f.ai_labels as Record<string, any> || {};
          if (labels.hooks) inspoHooks.push(...labels.hooks);
          if (labels.text_overlays) {
            inspoHooks.push(...labels.text_overlays.map((o: any) => o.text || o));
          }
        });
        
        inspoContext = `
STYLE INSPIRATION FROM USER'S LIBRARY:
${JSON.stringify(inspoPatterns, null, 2)}

Use these patterns for text overlays and hook style. Match the energy, pacing, and overlay text style from their inspo.
${inspoHooks.length > 0 ? `Example hooks from their inspo: ${inspoHooks.slice(0, 5).join(", ")}` : ""}
`;
      }
    }

    // Step 2: Build dynamic system prompt based on inspo
    const systemPrompt = `You are an expert video content strategist for vehicle wrap shops.

CRITICAL RULES:
- NEVER select the same video twice
- NEVER select duplicate IDs
- Each video ID must be UNIQUE in your selection
- If a video has already been used or looks edited, skip it

${inspoContext}

Given a list of videos with metadata (filename, duration, tags, category), you must:
1. Select 3-5 DIFFERENT videos that would make an ENGAGING, VIRAL reel when combined
2. Prioritize: install reveals, satisfying peels, before/after, POV shots, transformations
3. Avoid videos with "edited", "reel", "final" in filename - prefer raw source clips
4. Order them for maximum hook → value → payoff structure
5. Suggest trim points (start/end) for each clip - aim for 4-8 seconds per clip
6. Total reel should be 15-30 seconds

For overlays, create punchy text that matches the user's inspo style:
${inspoHooks.length > 0 ? `- Match style of: ${inspoHooks.slice(0, 3).join(", ")}` : `- Hook overlay (clip 1): "WAIT FOR IT", "Watch this", "POV:"
- Value overlay (clips 2-3): "Satisfying", "Before vs After", specific callout
- CTA overlay (last clip): "Follow for more", "Link in bio"`}

Return JSON ONLY:
{
  "selected_videos": [
    {
      "id": "unique_video_id_here",
      "order": 1,
      "trim_start": 0,
      "trim_end": 5.5,
      "reason": "Strong hook - dramatic reveal",
      "suggested_overlay": "Text matching their inspo style"
    }
  ],
  "reel_concept": "Concept description",
  "suggested_hook": "Hook text matching their style",
  "suggested_cta": "CTA matching their brand",
  "music_vibe": "upbeat_energy",
  "estimated_virality": 85,
  "inspo_style_applied": true
}`;

    // Step 3: Fetch videos from media library
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

    console.log(`Found ${videos.length} videos, analyzing with AI${inspoContext ? " + inspo style" : ""}...`);

    // Filter out already-edited content
    const rawVideos = videos.filter(v => {
      const filename = (v.original_filename || "").toLowerCase();
      return !filename.includes("reel") && 
             !filename.includes("edited") && 
             !filename.includes("final") &&
             !filename.includes("ai-") &&
             !filename.includes("render");
    });

    const videoSummary = (rawVideos.length > 0 ? rawVideos : videos).map(v => ({
      id: v.id,
      filename: v.original_filename || "Untitled",
      duration: v.duration_seconds || 10,
      tags: v.tags || [],
      category: v.content_category || "raw",
    }));

    // Step 4: Call AI to select best videos with inspo context
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
      inspo_files_used: inspoContext ? true : false,
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
