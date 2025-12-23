import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_KEY = Deno.env.get("LOVABLE_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, content_file_id, scan_all } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get videos from both content_files AND contentbox_assets
    let videos: any[] = [];
    
    // First try content_files
    let cfQuery = supabase
      .from("content_files")
      .select("*")
      .eq("file_type", "video");

    if (content_file_id) {
      cfQuery = cfQuery.eq("id", content_file_id);
    } else if (organization_id) {
      cfQuery = cfQuery.eq("organization_id", organization_id);
    }

    const { data: cfVideos, error: cfError } = await cfQuery;
    if (cfError) {
      console.error("content_files query error:", cfError);
    } else if (cfVideos) {
      videos = [...cfVideos];
    }
    
    // Also get from contentbox_assets (where agent chat videos go)
    let cbQuery = supabase
      .from("contentbox_assets")
      .select("*")
      .eq("asset_type", "video");

    if (content_file_id) {
      cbQuery = cbQuery.eq("id", content_file_id);
    } else if (organization_id) {
      cbQuery = cbQuery.eq("organization_id", organization_id);
    }

    const { data: cbVideos, error: cbError } = await cbQuery;
    if (cbError) {
      console.error("contentbox_assets query error:", cbError);
    } else if (cbVideos) {
      // Map contentbox_assets to match content_files structure
      const mappedCb = cbVideos.map(v => ({
        id: v.id,
        file_url: v.file_url,
        organization_id: v.organization_id,
        original_filename: v.original_name,
        duration_seconds: v.duration_seconds,
        transcript: null,
        mux_playback_id: null,
        mux_asset_id: null,
        source: 'contentbox'
      }));
      videos = [...videos, ...mappedCb];
    }

    console.log(`Found ${videos.length} videos to scan (${cfVideos?.length || 0} from content_files, ${cbVideos?.length || 0} from contentbox_assets)`);

    console.log(`Scanning ${videos.length} videos for AI editing`);

    const results = [];

    for (const video of videos || []) {
      // Check if already in queue
      const { data: existing } = await supabase
        .from("video_edit_queue")
        .select("id")
        .eq("content_file_id", video.id)
        .single();

      if (existing && !scan_all) {
        console.log(`Video ${video.id} already in queue, skipping`);
        continue;
      }

      // Get or generate transcript
      let transcript = video.transcript;
      
      if (!transcript && video.mux_playback_id) {
        // Call transcription service
        try {
          const transcribeRes = await supabase.functions.invoke("transcribe-audio", {
            body: { video_url: `https://stream.mux.com/${video.mux_playback_id}.m3u8` }
          });
          transcript = transcribeRes.data?.transcript || "";
        } catch (e) {
          console.error(`Transcription failed for ${video.id}:`, e);
        }
      }

      // Call yt-enhance-longform for AI edit suggestions
      let aiSuggestions = {};
      if (transcript) {
        try {
          const enhanceRes = await supabase.functions.invoke("yt-enhance-longform", {
            body: { 
              job_id: video.id,
              transcript 
            }
          });
          aiSuggestions = enhanceRes.data?.enhancements || {};
        } catch (e) {
          console.error(`Enhancement analysis failed for ${video.id}:`, e);
        }
      }

      // Generate text overlay suggestions using AI
      const overlayPrompt = `Analyze this video transcript and suggest 5-8 impactful text overlays for a social media video.
For each overlay, provide:
- timestamp (MM:SS format)
- text (max 6 words, punchy and engaging)
- style (title, stat, quote, cta, hook)
- duration (seconds to display)

Transcript:
${transcript?.slice(0, 3000) || "No transcript available"}

Return JSON array only:
[{"timestamp": "00:05", "text": "Your Hook Here", "style": "hook", "duration": 3}]`;

      let textOverlays = [];
      try {
        const overlayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "user", content: overlayPrompt }
            ]
          })
        });

        if (overlayRes.ok) {
          const overlayJson = await overlayRes.json();
          const content = overlayJson.choices?.[0]?.message?.content || "[]";
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            textOverlays = JSON.parse(match[0]);
          }
        }
      } catch (e) {
        console.error(`Text overlay generation failed for ${video.id}:`, e);
      }

      // Insert or update queue item
      const queueItem = {
        organization_id: video.organization_id,
        content_file_id: video.id,
        source_url: video.file_url,
        title: video.original_filename || `Video ${video.id.slice(0, 8)}`,
        transcript,
        duration_seconds: video.duration_seconds,
        ai_edit_suggestions: aiSuggestions,
        text_overlays: textOverlays,
        chapters: (aiSuggestions as any).chapters || [],
        status: "ready_for_review"
      };

      const { data: inserted, error: insertError } = await supabase
        .from("video_edit_queue")
        .upsert(queueItem, { onConflict: "content_file_id" })
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to insert queue item for ${video.id}:`, insertError);
      } else {
        results.push(inserted);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        scanned: results.length,
        items: results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("ai-scan-content-library error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
