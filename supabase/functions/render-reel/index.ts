import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ TYPES ============
interface SceneBlueprintScene {
  sceneId: string;
  clipId: string;
  clipUrl: string;
  start: number;
  end: number;
  purpose: string;
  text?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  animation?: 'pop' | 'slide' | 'fade' | 'punch' | 'typewriter';
  cutReason?: string;
}

interface SceneBlueprint {
  id: string;
  platform: string;
  totalDuration: number;
  scenes: SceneBlueprintScene[];
  endCard?: { duration: number; text: string; cta: string };
  brand?: string;
  format?: string;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  templateId?: string;
  overlayPack?: string;
  font?: string;
  textStyle?: 'bold' | 'minimal' | 'modern';
  caption?: string;
}

interface CaptionInput {
  text: string;
  time: number;
  duration: number;
  style?: string;
  animation?: 'none' | 'fade' | 'pop' | 'slide';
  position?: 'top' | 'center' | 'bottom';
  fontSize?: 'small' | 'medium' | 'large';
}

interface RenderRequest {
  job_id: string;
  blueprint: SceneBlueprint;
  music_url?: string | null;
  captions?: CaptionInput[];
}

// ============ HELPERS ============
const json = (obj: unknown, _status = 200) =>
  new Response(JSON.stringify(obj), {
    // Always return 200 so the client can display the structured error payload
    // instead of failing with "Edge Function returned a non-2xx status code".
    status: 200,
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

// ============ PREFLIGHT VALIDATION ============
function assertRenderable(bp: SceneBlueprint | null | undefined): asserts bp is SceneBlueprint {
  const errors: string[] = [];

  if (!bp) {
    throw new Error("No blueprint provided");
  }

  if (!bp.format) errors.push("Missing format");
  if (!bp.aspectRatio) errors.push("Missing aspect ratio");
  if (!bp.templateId) errors.push("Missing template ID");
  if (!bp.scenes?.length) errors.push("No scenes defined");

  bp.scenes?.forEach((scene, i) => {
    if (!scene.clipUrl) errors.push(`Scene ${i + 1}: missing clip URL`);
    if (scene.start === undefined) errors.push(`Scene ${i + 1}: missing start time`);
    if (scene.end === undefined) errors.push(`Scene ${i + 1}: missing end time`);
    if (scene.end <= scene.start) errors.push(`Scene ${i + 1}: invalid timing`);
  });

  if (errors.length > 0) {
    throw new Error(`Blueprint not renderable:\n- ${errors.join('\n- ')}`);
  }
}

// ============ BLUEPRINT → CREATOMATE MAPPER ============
function mapPositionToXY(position?: string): { x: string; y: string } {
  switch (position) {
    case 'top': return { x: '50%', y: '12%' };
    case 'bottom': return { x: '50%', y: '88%' };
    default: return { x: '50%', y: '50%' };
  }
}

function mapAnimation(animation?: string): { type: string; duration: string; easing?: string } {
  switch (animation) {
    case 'pop': return { type: 'scale', duration: '0.3 s', easing: 'back-out' };
    case 'slide': return { type: 'slide', duration: '0.4 s', easing: 'ease-out' };
    case 'punch': return { type: 'scale', duration: '0.2 s', easing: 'ease-out' };
    case 'typewriter': return { type: 'text-appear', duration: '0.5 s' };
    default: return { type: 'fade', duration: '0.3 s' };
  }
}

function getDimensions(aspectRatio?: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1': return { width: 1080, height: 1080 };
    case '16:9': return { width: 1920, height: 1080 };
    default: return { width: 1080, height: 1920 };
  }
}

function getFontFamily(font?: string, overlayPack?: string): string {
  if (font) return font;
  switch (overlayPack) {
    case 'wpw_signature': return 'Montserrat';
    case 'modern-clean': return 'Inter';
    case 'minimal': return 'SF Pro';
    case 'bold-impact': return 'Impact';
    default: return 'Montserrat';
  }
}

function mapBlueprintToCreatomate(
  bp: SceneBlueprint,
  musicUrl?: string | null,
  captions?: CaptionInput[]
) {
  const { width, height } = getDimensions(bp.aspectRatio);
  const fontFamily = getFontFamily(bp.font, bp.overlayPack);
  const elements: any[] = [];
  let timelineCursor = 0;

  // Build video + text elements from scenes
  for (const scene of bp.scenes) {
    const clipDuration = scene.end - scene.start;

    // Video element
    elements.push({
      type: 'video',
      source: scene.clipUrl,
      time: timelineCursor,
      duration: clipDuration,
      trim_start: scene.start,
      trim_duration: clipDuration,
    });

    // Scene text overlay (if present)
    if (scene.text?.trim()) {
      const { x, y } = mapPositionToXY(scene.textPosition);
      elements.push({
        type: 'text',
        text: scene.text,
        time: timelineCursor,
        duration: clipDuration,
        x,
        y,
        width: '90%',
        x_alignment: '50%',
        y_alignment: '50%',
        font_family: fontFamily,
        font_weight: bp.textStyle === 'bold' ? '800' : '600',
        font_size: '7 vh',
        fill_color: '#ffffff',
        stroke_color: '#000000',
        stroke_width: '1.5 vh',
        text_transform: 'uppercase',
        enter: mapAnimation(scene.animation),
        exit: { type: 'fade', duration: '0.2 s' },
      });
    }

    timelineCursor += clipDuration;
  }

  const totalDuration = timelineCursor;

  // Add captions as timed text elements
  if (Array.isArray(captions) && captions.length > 0) {
    const sizeToVh = (s?: string) => (s === 'small' ? '4.5 vh' : s === 'medium' ? '6 vh' : '7 vh');

    for (const cap of captions) {
      const pos = cap.position || 'center';
      const { x, y } = mapPositionToXY(pos);
      const enter = cap.animation && cap.animation !== 'none' ? mapAnimation(cap.animation) : undefined;

      elements.push({
        type: 'text',
        text: cap.text,
        time: Math.max(0, cap.time),
        duration: Math.max(0.1, cap.duration),
        x,
        y,
        width: '92%',
        x_alignment: '50%',
        y_alignment: '50%',
        font_family: fontFamily,
        font_weight: cap.style === 'sabri' ? '800' : '700',
        font_size: sizeToVh(cap.fontSize),
        fill_color: '#ffffff',
        stroke_color: '#000000',
        stroke_width: '1.35 vh',
        text_transform: cap.style === 'clean' ? 'none' : 'uppercase',
        ...(enter ? { enter } : {}),
        exit: { type: 'fade', duration: '0.2 s' },
      });
    }
  }

  // End card
  if (bp.endCard) {
    const { x, y } = mapPositionToXY('center');
    elements.push({
      type: 'text',
      text: bp.endCard.text,
      time: totalDuration,
      duration: bp.endCard.duration,
      x,
      y,
      width: '80%',
      x_alignment: '50%',
      y_alignment: '50%',
      font_family: fontFamily,
      font_weight: '800',
      font_size: '8 vh',
      fill_color: '#ffffff',
      stroke_color: '#000000',
      stroke_width: '2 vh',
      text_transform: 'uppercase',
      enter: { type: 'scale', duration: '0.4 s', easing: 'back-out' },
    });
  }

  const finalDuration = bp.endCard ? totalDuration + bp.endCard.duration : totalDuration;

  // Audio track
  if (musicUrl) {
    elements.push({
      type: 'audio',
      source: musicUrl,
      time: 0,
      duration: finalDuration,
      audio_fade_out: '1 s',
      volume: '60%',
    });
  }

  return {
    output_format: 'mp4',
    width,
    height,
    frame_rate: 30,
    duration: finalDuration,
    elements,
  };
}

// ============ MAIN HANDLER ============
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[render-reel] ====== BLUEPRINT-BASED RENDER ======");

  try {
    const body = (await req.json()) as RenderRequest;
    console.log("[render-reel] Job ID:", body.job_id);

    // ============ VALIDATION ============
    if (!body.job_id) {
      return json({ ok: false, error: "Missing job_id" }, 400);
    }

    // PREFLIGHT: Fail fast if blueprint is incomplete
    try {
      assertRenderable(body.blueprint);
      console.log("[render-reel] ✓ Blueprint passed preflight validation");
    } catch (e) {
      console.error("[render-reel] ✗ Preflight failed:", e);
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 400);
    }

    // ============ MAP BLUEPRINT → CREATOMATE ============
    const timeline = mapBlueprintToCreatomate(body.blueprint, body.music_url, body.captions);
    console.log("[render-reel] Timeline mapped:", JSON.stringify({
      duration: timeline.duration,
      elements_count: timeline.elements.length,
      dimensions: `${timeline.width}x${timeline.height}`,
    }));

    // ============ DATABASE SETUP ============
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Persist debug payload
    await supabase
      .from("video_edit_queue")
      .update({
        render_status: "rendering",
        error_message: null,
        debug_payload: {
          renderer: "creatomate",
          blueprint_id: body.blueprint.id,
          blueprint_scenes: body.blueprint.scenes.length,
          timeline_elements: timeline.elements.length,
          started_at: new Date().toISOString(),
        },
      })
      .eq("id", body.job_id);

    // ============ START CREATOMATE RENDER ============
    console.log("[render-reel] Starting Creatomate render...");
    const startRes = await creatomateFetch("renders", {
      method: "POST",
      body: JSON.stringify(timeline),
    });

    const startJson = await startRes.json();

    if (!startRes.ok) {
      const msg = `Creatomate start failed: ${startRes.status} - ${JSON.stringify(startJson)}`;
      console.error("[render-reel]", msg);
      await supabase
        .from("video_edit_queue")
        .update({ 
          render_status: "failed", 
          error_message: msg,
          debug_payload: { 
            renderer: "creatomate", 
            blueprint_id: body.blueprint.id,
            error: startJson 
          }
        })
        .eq("id", body.job_id);
      return json({ ok: false, error: msg }, 500);
    }

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

    // ============ POLL UNTIL COMPLETE ============
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
      
      // Get the job to find linked creative
      const { data: failedJob } = await supabase
        .from("video_edit_queue")
        .select("ai_creative_id")
        .eq("id", body.job_id)
        .single();

      await supabase
        .from("video_edit_queue")
        .update({
          render_status: "failed",
          error_message: msg,
          debug_payload: {
            renderer: "creatomate",
            blueprint_id: body.blueprint.id,
            creatomate_render_id: renderId,
            last_status: status,
            last_response: last,
          },
        })
        .eq("id", body.job_id);

      // Update linked creative to failed status
      if (failedJob?.ai_creative_id) {
        await supabase
          .from("ai_creatives")
          .update({
            status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", failedJob.ai_creative_id);

        await supabase
          .from("creative_tag_map")
          .delete()
          .eq("creative_id", failedJob.ai_creative_id)
          .like("tag_slug", "status:%");

        await supabase
          .from("creative_tag_map")
          .insert({ creative_id: failedJob.ai_creative_id, tag_slug: "status:failed" });
      }

      return json({ ok: false, error: msg, render_id: renderId }, 500);
    }

    // ============ SUCCESS ============
    console.log("[render-reel] Updating DB with success...");
    const { data: saved, error: saveError } = await supabase
      .from("video_edit_queue")
      .update({
        render_status: "complete",
        final_render_url: finalUrl,
        error_message: null,
        debug_payload: {
          renderer: "creatomate",
          blueprint_id: body.blueprint.id,
          creatomate_render_id: renderId,
          completed_at: new Date().toISOString(),
          final_url_saved: finalUrl,
        },
      })
      .eq("id", body.job_id)
      .select("id, final_render_url, render_status, ai_creative_id");

    if (saveError || !saved?.length) {
      console.error("[render-reel] SAVE FAILED!", saveError, "job_id:", body.job_id);
      return json({
        ok: false,
        error: "Render succeeded but failed to save final_render_url to database",
        finalUrl,
        saveError: saveError?.message || "No rows updated",
        job_id: body.job_id,
      }, 500);
    }

    // ============ UPDATE LINKED AI_CREATIVE ============
    const aiCreativeId = saved[0]?.ai_creative_id;
    if (aiCreativeId) {
      console.log("[render-reel] Updating ai_creative:", aiCreativeId);
      
      // Update creative status and output
      await supabase
        .from("ai_creatives")
        .update({
          status: "complete",
          output_url: finalUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", aiCreativeId);

      // Update status tags
      await supabase
        .from("creative_tag_map")
        .delete()
        .eq("creative_id", aiCreativeId)
        .like("tag_slug", "status:%");

      await supabase
        .from("creative_tag_map")
        .insert({ creative_id: aiCreativeId, tag_slug: "status:complete" });
      
      console.log("[render-reel] ✓ ai_creative updated with status:complete");
    }

    console.log("[render-reel] DB save verified:", JSON.stringify(saved));
    console.log("[render-reel] ====== RENDER COMPLETE ======");
    
    return json({ 
      ok: true, 
      render_id: renderId, 
      final_url: finalUrl,
      blueprint_id: body.blueprint.id,
      db_verified: true,
      saved_row: saved[0],
      creative_updated: !!aiCreativeId
    });

  } catch (err) {
    console.error("[render-reel] FATAL ERROR:", err);
    return json({ ok: false, error: String(err instanceof Error ? err.message : err) }, 500);
  }
});