import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface InspoStyle {
  font_style: string;
  font_weight: string;
  text_color: string;
  text_shadow: boolean;
  text_position: string;
  background_style: string;
  accent_color: string;
  text_animation: string;
  hook_format: string;
  emoji_usage: boolean;
}

// Dara Denney Format Configurations
const DARA_FORMAT_PROMPTS: Record<string, string> = {
  grid_style: `
FORMAT: 📊 GRID STYLE AD
- Psychology: Completes subconscious loop - eyes trail left-to-right, top-to-bottom
- Select 4 product shots that work in a 2x2 grid
- Overlay: Value-based messaging OR specific routine/outcome
- Example hooks: "The perfect set", "All you need", "Mix & match"
- Clip duration: 2-3s each, total 8-12s`,

  egc_warehouse: `
FORMAT: 📦 EGC WAREHOUSE CONTENT  
- Psychology: Employee-generated content builds authenticity
- Show behind-the-scenes: packing, workspace, production
- POV shots work great
- Example hooks: "POV:", "Day in the life", "Watch me pack"
- Clip duration: 3-5s each, raw authentic energy`,

  founders_objection: `
FORMAT: 💬 FOUNDERS + OBJECTION HANDLER
- Psychology: Founder credibility + addressing anxiety = trust
- Structure: Lo-fi founder video handling common objection
- Address: price, quality, timeline objections directly
- Example hooks: "Is it worth it?", "Why so expensive?", "Does this work?"
- One longer clip, 15-30s, authentic energy`,

  creator_testimonial: `
FORMAT: ⭐ CREATOR TESTIMONIAL
- Psychology: Social proof from real people. Single > compilations
- Structure: One creator giving authentic testimonial
- Use reaction opening hooks
- Trigger words: "this", "look", "watch"
- Example hooks: "I can't believe...", "This changed...", "Watch what happens"
- One clip, 15-45s`,

  text_heavy: `
FORMAT: 📝 TEXT HEAVY AD
- Psychology: Text creates curiosity gaps. Crushes during sales
- Bold text overlays drive narrative, video supports
- Example hooks: "3 things you need", "Don't miss this", "The truth about"
- Clip duration: 2-3s each, 4 clips total
- TEXT IS THE STAR - video is background`,

  negative_marketing: `
FORMAT: 😬 NEGATIVE MARKETING
- Psychology: Negative emotions are powerful triggers
- Use trigger words: regret, embarrassed, hate
- 1-star review style or negative hook that flips positive
- Example hooks: "I regret...", "Don't make this mistake", "I was so embarrassed"
- 3 clips, 3-5s each`,

  ugly_ads: `
FORMAT: 📱 UGLY ADS / LO-FI
- Psychology: Authenticity > polish. Meta recommends this for Reels
- Raw, unpolished: post-it notes, one-take videos, POV shots
- Think: how would you explain this to a friend?
- Example hooks: "POV:", "Okay so", "Real talk"
- One clip, 10-30s, ZERO polish`,

  brandformance: `
FORMAT: 🚀 BRANDFORMANCE
- Psychology: Organic content that works gets amplified
- Select content that feels organic/authentic
- Don't over-edit - keep the original energy
- Example hooks: "Y'all loved this", "This went viral", "Had to share"
- One clip, 15-60s`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, filter_category, max_videos, use_inspo, dara_format } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Fetch user's inspiration files and analyze visual styles
    let inspoContext = "";
    let inspoHooks: string[] = [];
    let extractedStyle: InspoStyle | null = null;
    
    if (use_inspo !== false) {
      const { data: inspoFiles } = await supabase
        .from("content_files")
        .select("id, file_url, original_filename, tags, ai_labels, metadata, file_type")
        .or("content_category.eq.inspiration,content_category.eq.raw,tags.cs.{inspo}")
        .order("created_at", { ascending: false })
        .limit(10);

      if (inspoFiles && inspoFiles.length > 0) {
        console.log(`Found ${inspoFiles.length} inspo files to learn from`);
        
        // Find image inspo files to analyze visually
        const imageInspoFiles = inspoFiles.filter(f => 
          f.file_type === 'image' || 
          f.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        );
        
        // VISION ANALYSIS: Analyze actual inspo images to extract visual styles
        if (imageInspoFiles.length > 0) {
          console.log(`Analyzing ${imageInspoFiles.length} inspo images with AI vision...`);
          
          const imageUrls = imageInspoFiles.slice(0, 3).map(f => f.file_url).filter(Boolean);
          
          if (imageUrls.length > 0) {
            try {
              const visionRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${AI_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: `Analyze these social media content images and extract the EXACT visual style for text overlays. Return JSON ONLY with these fields:
{
  "font_style": "bold-condensed" | "script" | "sans-serif" | "impact" | "modern-thin" | "handwritten",
  "font_weight": "bold" | "black" | "regular" | "light",
  "text_color": "#HEXCODE of main text color",
  "text_shadow": true/false (if text has shadow/glow),
  "text_position": "center" | "top" | "bottom" | "split-top-bottom",
  "background_style": "none" | "solid-box" | "gradient-box" | "outline-only",
  "accent_color": "#HEXCODE of accent/highlight color",
  "text_animation": "none" | "pop-in" | "slide-up" | "scale-bounce",
  "hook_format": "all-caps" | "mixed-case" | "sentence-case",
  "emoji_usage": true/false
}

Look at: font family used, text weight, colors, shadows, positioning, any boxes behind text. Be precise about hex colors.`
                        },
                        ...imageUrls.map(url => ({
                          type: "image_url",
                          image_url: { url }
                        }))
                      ]
                    }
                  ],
                }),
              });

              if (visionRes.ok) {
                const visionJson = await visionRes.json();
                const styleContent = visionJson.choices?.[0]?.message?.content || "{}";
                const jsonMatch = styleContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  extractedStyle = JSON.parse(jsonMatch[0]);
                  console.log("Extracted inspo style:", extractedStyle);
                }
              }
            } catch (visionErr) {
              console.warn("Vision analysis failed:", visionErr);
            }
          }
        }
        
        // Extract text patterns from inspo
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

${extractedStyle ? `VISUAL STYLE EXTRACTED FROM THEIR IMAGES:
- Font: ${extractedStyle.font_style} ${extractedStyle.font_weight}
- Text Color: ${extractedStyle.text_color}
- Accent Color: ${extractedStyle.accent_color}
- Text Has Shadow: ${extractedStyle.text_shadow}
- Text Position: ${extractedStyle.text_position}
- Hook Format: ${extractedStyle.hook_format}
- Uses Emojis: ${extractedStyle.emoji_usage}

MATCH THIS STYLE EXACTLY for all overlays and hooks!` : ''}

Use these patterns for text overlays and hook style. Match the energy, pacing, and overlay text style from their inspo.
${inspoHooks.length > 0 ? `Example hooks from their inspo: ${inspoHooks.slice(0, 5).join(", ")}` : ""}
`;
      }
    }

    // Get format-specific prompt if a Dara format is selected
    const formatPrompt = dara_format && DARA_FORMAT_PROMPTS[dara_format] 
      ? DARA_FORMAT_PROMPTS[dara_format] 
      : "";

    // Step 2: Build dynamic system prompt based on inspo + DARA DENNEY RULES
    const systemPrompt = `You are Dara Denney - the world's best performance creative strategist. You create scroll-stopping reels that CONVERT.

${formatPrompt ? `
═══════════════════════════════════════════════════════════════
🎬 SELECTED AD FORMAT:
═══════════════════════════════════════════════════════════════
${formatPrompt}
` : ''}

═══════════════════════════════════════════════════════════════
🎯 DARA DENNEY'S IRON RULES FOR VIRAL REELS:
═══════════════════════════════════════════════════════════════

1. HOOK = 2-4 WORDS MAX. Never more. Examples:
   - "Wait for it..."
   - "POV:"
   - "This hits different"
   - "Game changer"
   - "Watch this"
   - "Before → After"

2. TEXT MUST FIT ON SCREEN - TRUNCATE AT WORD BOUNDARIES
   - Max 12 characters for hooks
   - Max 15 characters for other overlays
   - If text is too long, CUT WORDS not letters
   - NEVER cut a word in the middle

3. SCROLL-STOPPING STRUCTURE:
   - Clip 1 (0-3s): HOOK - create curiosity gap
   - Clip 2-3 (3-12s): PAYOFF - deliver the satisfying moment
   - Clip 4 (12-15s): CTA - "Follow for more" or "Link in bio"

4. UGC ENERGY, NOT POLISHED ADS:
   - Raw, authentic clips
   - Quick cuts (2-5 sec each)
   - No corporate vibes

5. PATTERN INTERRUPT:
   - Start mid-action
   - Show the reveal FAST
   - Don't make them wait

═══════════════════════════════════════════════════════════════
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
5. Suggest trim points (start/end) for each clip - aim for 2-5 seconds per clip
6. Total reel should be 12-20 seconds (shorter = better engagement)

═══════════════════════════════════════════════════════════════
TEXT OVERLAY RULES (CRITICAL - TEXT MUST FIT):
═══════════════════════════════════════════════════════════════
${extractedStyle ? `- Use ${extractedStyle.hook_format} format
- ${extractedStyle.emoji_usage ? 'Use 1 emoji max' : 'No emojis - keep it clean'}
- Position: ${extractedStyle.text_position}` : ''}

OVERLAY FORMAT - FOLLOW EXACTLY:
- Hook: MAX 12 CHARS (e.g., "Wait for it", "POV:", "Watch this")  
- Value: MAX 15 CHARS (e.g., "So satisfying", "The reveal")
- CTA: MAX 15 CHARS (e.g., "Follow for more")

EXAMPLES OF GOOD SHORT HOOKS:
- "POV:"
- "Wait for it"
- "The reveal"
- "Before → After"
- "Game changer"
- "Watch this"
- "So satisfying"

${inspoHooks.length > 0 ? `Style reference from their inspo (but keep text SHORT): ${inspoHooks.slice(0, 3).join(", ")}` : ''}

Return JSON ONLY:
{
  "selected_videos": [
    {
      "id": "unique_video_id_here",
      "order": 1,
      "trim_start": 0,
      "trim_end": 4,
      "reason": "Strong hook - dramatic reveal",
      "suggested_overlay": "Wait for it"
    }
  ],
  "reel_concept": "One sentence concept",
  "suggested_hook": "2-4 words ONLY - MAX 12 CHARS",
  "suggested_cta": "Follow for more",
  "music_vibe": "upbeat_energy",
  "estimated_virality": 85,
  "inspo_style_applied": true,
  "format_used": "${dara_format || 'auto'}"
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
      // Include extracted style for render function to use
      extracted_style: extractedStyle,
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
