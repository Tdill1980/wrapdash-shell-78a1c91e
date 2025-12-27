import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Clip {
  url: string;
  trimStart?: number;
  trimEnd?: number;
}

interface TextOverlay {
  text: string;
  start: number;
  end: number;
  x?: number;
  y?: number;
  size?: number;
  position?: string;
}

interface RenderRequest {
  job_id: string;
  clips: Clip[];
  overlays?: TextOverlay[];
  music_url?: string | null;
  width?: number;
  height?: number;
  fps?: number;
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function creatomateFetch(path: string, init: RequestInit) {
  const key = Deno.env.get("CREATOMATE_API_KEY");
  if (!key) throw new Error("Missing CREATOMATE_API_KEY");
  return fetch(`https://api.creatomate.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function mapPositionToXY(position?: string): { x: number; y: number } {
  switch (position) {
    case 'top':
    case 'top-center':
      return { x: 0.5, y: 0.12 };
    case 'bottom':
    case 'bottom-center':
      return { x: 0.5, y: 0.88 };
    case 'center':
    default:
      return { x: 0.5, y: 0.5 };
  }
}

function buildTimeline(req: RenderRequest) {
  const width = req.width ?? 1080;
  const height = req.height ?? 1920;
  const fps = req.fps ?? 30;

  let cursor = 0;
  const elements: any[] = [];

  // Build video elements sequentially
  for (const clip of req.clips) {
    const start = cursor;
    const trimStart = clip.trimStart ?? 0;
    const trimEnd = clip.trimEnd ?? 0;
    const duration = Math.max(0.5, trimEnd - trimStart);

    elements.push({
      type: "video",
      source: clip.url,
      time: start,
      duration: duration,
      trim_start: trimStart,
      trim_duration: duration,
    });

    cursor += duration;
  }

  const totalDuration = cursor;

  // Add text overlays
  if (req.overlays?.length) {
    for (const o of req.overlays) {
      const { x, y } = mapPositionToXY(o.position);
      const duration = Math.max(0.5, o.end - o.start);
      
      elements.push({
        type: "text",
        text: o.text,
        time: o.start,
        duration: duration,
        x: `${(o.x ?? x) * 100}%`,
        y: `${(o.y ?? y) * 100}%`,
        width: "90%",
        x_alignment: "50%",
        y_alignment: "50%",
        font_family: "Montserrat",
        font_weight: "800",
        font_size: o.size ? `${o.size} px` : "7 vh",
        fill_color: "#ffffff",
        stroke_color: "#000000",
        stroke_width: "1.5 vh",
        text_transform: "uppercase",
        enter: {
          type: "scale",
          duration: "0.3 s",
          easing: "back-out"
        },
        exit: {
          type: "fade",
          duration: "0.2 s"
        }
      });
    }
  }

  // Add audio track
  if (req.music_url) {
    elements.push({
      type: "audio",
      source: req.music_url,
      time: 0,
      duration: totalDuration,
      audio_fade_out: "1 s",
      volume: "60%",
    });
  }

  return {
    output_format: "mp4",
    width,
    height,
    frame_rate: fps,
    duration: totalDuration,
    elements,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[render-reel] ====== FUNCTION INVOKED ======");

  try {
    const body = (await req.json()) as RenderRequest;
    console.log("[render-reel] Request:", JSON.stringify(body, null, 2));

    if (!body.job_id) return json({ ok: false, error: "Missing job_id" }, 400);
    if (!body.clips?.length) return json({ ok: false, error: "No clips provided" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const timeline = buildTimeline(body);
    console.log("[render-reel] Timeline built:", JSON.stringify(timeline, null, 2));

    // Persist debug payload
    await supabase
      .from("video_edit_queue")
      .update({
        render_status: "rendering",
        error_message: null,
        debug_payload: {
          renderer: "creatomate",
          request: body,
          timeline,
          started_at: new Date().toISOString(),
        },
      })
      .eq("id", body.job_id);

    // Start Creatomate render
    console.log("[render-reel] Starting Creatomate render...");
    const startRes = await creatomateFetch("renders", {
      method: "POST",
      body: JSON.stringify(timeline),
    });

    const startJson = await startRes.json();
    console.log("[render-reel] Creatomate start response:", JSON.stringify(startJson));

    if (!startRes.ok) {
      const msg = `Creatomate start failed: ${startRes.status} - ${JSON.stringify(startJson)}`;
      console.error("[render-reel]", msg);
      await supabase
        .from("video_edit_queue")
        .update({ 
          render_status: "failed", 
          error_message: msg,
          debug_payload: { renderer: "creatomate", request: body, timeline, error: startJson }
        })
        .eq("id", body.job_id);
      return json({ ok: false, error: msg }, 500);
    }

    // Creatomate returns an array
    const renderJob = Array.isArray(startJson) ? startJson[0] : startJson;
    const renderId = renderJob?.id;
    
    if (!renderId) {
      const msg = "Creatomate did not return render id";
      console.error("[render-reel]", msg);
      await supabase
        .from("video_edit_queue")
        .update({ render_status: "failed", error_message: msg })
        .eq("id", body.job_id);
      return json({ ok: false, error: msg }, 500);
    }

    console.log("[render-reel] Render started, ID:", renderId);

    // Poll until done (up to 5 minutes)
    let finalUrl: string | null = null;
    let status = "rendering";
    let last: any = null;

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      console.log(`[render-reel] Polling attempt ${i + 1}...`);
      const pollRes = await creatomateFetch(`renders/${renderId}`, { method: "GET" });
      const pollJson = await pollRes.json();
      last = pollJson;
      status = pollJson?.status;
      
      console.log(`[render-reel] Poll status: ${status}`);

      if (status === "succeeded") {
        // Defensive URL resolution - Creatomate may return URL in different fields
        finalUrl = pollJson?.url || pollJson?.result_url || pollJson?.outputs?.[0]?.url || null;
        console.log("[render-reel] Render succeeded! URL:", finalUrl);
        break;
      }
      if (status === "failed") {
        console.error("[render-reel] Render failed:", pollJson);
        break;
      }
    }

    if (!finalUrl) {
      const msg = status === "failed"
        ? `Creatomate render failed: ${JSON.stringify(last?.error || last)}`
        : `Creatomate render timed out after 5 minutes. Last status: ${status}`;

      console.error("[render-reel]", msg);
      
      await supabase
        .from("video_edit_queue")
        .update({
          render_status: "failed",
          error_message: msg,
          debug_payload: {
            renderer: "creatomate",
            request: body,
            creatomate_render_id: renderId,
            last_status: status,
            last_response: last,
          },
        })
        .eq("id", body.job_id);

      return json({ ok: false, error: msg, render_id: renderId }, 500);
    }

    // Success - update DB with VERIFICATION
    console.log("[render-reel] Updating DB with success...");
    const { data: saved, error: saveError } = await supabase
      .from("video_edit_queue")
      .update({
        render_status: "complete",
        final_render_url: finalUrl,
        error_message: null,
        debug_payload: {
          renderer: "creatomate",
          creatomate_render_id: renderId,
          completed_at: new Date().toISOString(),
          final_url_saved: finalUrl,
        },
      })
      .eq("id", body.job_id)
      .select("id, final_render_url, render_status");

    // Verify save succeeded
    if (saveError || !saved?.length) {
      console.error("[render-reel] SAVE FAILED!", saveError, "job_id:", body.job_id);
      return json({
        ok: false,
        error: "Render succeeded but failed to save final_render_url to database",
        finalUrl,
        saveError: saveError?.message || "No rows updated - check job_id and RLS",
        job_id: body.job_id,
      }, 500);
    }

    console.log("[render-reel] DB save verified:", JSON.stringify(saved));
    console.log("[render-reel] ====== FUNCTION COMPLETE ======");
    return json({ 
      ok: true, 
      render_id: renderId, 
      final_url: finalUrl,
      db_verified: true,
      saved_row: saved[0]
    });

  } catch (err) {
    console.error("[render-reel] FATAL ERROR:", err);
    return json({ ok: false, error: String(err instanceof Error ? err.message : err) }, 500);
  }
});
