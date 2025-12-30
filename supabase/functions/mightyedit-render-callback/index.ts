// supabase/functions/mightyedit-render-callback/index.ts
// Called when a render completes. Saves to creative_vault and writes execution_receipts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Json = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = (await req.json()) as {
      job_id?: string;
      conversation_id?: string;
      organization_id?: string;
      platform?: string;
      content_type?: string;
      title?: string;
      render_url: string;
      thumbnail_url?: string;
      meta?: Json;
      created_by?: string;
      type?: string;
    };

    console.log("[mightyedit-render-callback] Received:", body);

    if (!body.render_url) {
      return jsonResponse({ ok: false, error: "render_url required" }, 400);
    }

    // Save to vault
    const { data: vault, error: vErr } = await supabaseAdmin.from("creative_vault").insert({
      conversation_id: body.conversation_id ?? null,
      organization_id: body.organization_id ?? null,
      job_id: body.job_id ?? null,
      type: body.type ?? "video",
      platform: body.platform ?? null,
      content_type: body.content_type ?? null,
      title: body.title ?? (body.content_type ? `${body.content_type} render` : "render"),
      asset_url: body.render_url,
      thumbnail_url: body.thumbnail_url ?? null,
      created_by: body.created_by ?? null,
      meta: body.meta ?? {},
    }).select("*").single();

    if (vErr) {
      console.error("[mightyedit-render-callback] Vault insert error:", vErr);
      return jsonResponse({ ok: false, error: vErr.message }, 500);
    }

    console.log("[mightyedit-render-callback] Saved to vault:", vault.id);

    // Write receipt as proof of persistence
    await supabaseAdmin.from("execution_receipts").insert({
      conversation_id: body.conversation_id ?? null,
      organization_id: body.organization_id ?? null,
      source_table: "creative_vault",
      source_id: vault.id,
      channel: "content",
      action_type: "vault_save",
      status: "sent",
      provider: "internal",
      provider_receipt_id: null,
      payload_snapshot: { 
        render_url: body.render_url, 
        vault_id: vault.id,
        job_id: body.job_id,
      },
      error: null,
    });

    // Update job if provided
    if (body.job_id) {
      await supabaseAdmin.from("content_jobs").update({
        status: "completed",
        result: { vault_id: vault.id, render_url: body.render_url },
      }).eq("id", body.job_id);
    }

    // Also update ai_creatives if linked
    if (body.job_id) {
      // Check if there's an ai_creative linked through video_edit_queue
      const { data: veq } = await supabaseAdmin
        .from("video_edit_queue")
        .select("ai_creative_id")
        .eq("content_jobs_id", body.job_id)
        .single();

      if (veq?.ai_creative_id) {
        await supabaseAdmin.from("ai_creatives").update({
          status: "complete",
          output_url: body.render_url,
          thumbnail_url: body.thumbnail_url ?? null,
        }).eq("id", veq.ai_creative_id);
        console.log("[mightyedit-render-callback] Updated ai_creatives:", veq.ai_creative_id);
      }
    }

    console.log("[mightyedit-render-callback] Complete:", vault.id);

    return jsonResponse({ ok: true, vault_id: vault.id });
  } catch (e) {
    console.error("[mightyedit-render-callback] Error:", e);
    return jsonResponse({ ok: false, error: (e as Error).message }, 500);
  }
});
