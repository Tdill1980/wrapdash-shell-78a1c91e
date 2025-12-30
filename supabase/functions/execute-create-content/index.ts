// supabase/functions/execute-create-content/index.ts
// Parses Noah's ===CREATE_CONTENT=== block and executes it through a gated, auditable pipeline.
// NO OpenAI SDK imports. Execution = calling existing internal edge functions + writing receipts.

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

function extractCreateContentBlock(text: string): string | null {
  const start = text.indexOf("===CREATE_CONTENT===");
  if (start === -1) return null;
  const end = text.indexOf("===END_CREATE_CONTENT===", start);
  if (end === -1) return text.slice(start).trim();
  return text.slice(start, end + "===END_CREATE_CONTENT===".length).trim();
}

/**
 * Minimal parser:
 * Supports YAML-ish lines: key: value
 * Supports arrays like: hashtags: ["a","b"]
 * Supports overlays as YAML-ish list (very basic)
 */
function parseCreateContent(block: string): Json {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("==="));

  const out: Record<string, unknown> = {};
  let currentKey: string | null = null;

  for (const line of lines) {
    // list item (very basic) for overlays:
    if (line.startsWith("- ") && currentKey) {
      const arr = out[currentKey] as unknown[] ?? [];
      arr.push(line.slice(2).trim());
      out[currentKey] = arr;
      continue;
    }

    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let valRaw = line.slice(idx + 1).trim();

    currentKey = key;

    // Strip quotes
    if (
      (valRaw.startsWith('"') && valRaw.endsWith('"')) ||
      (valRaw.startsWith("'") && valRaw.endsWith("'"))
    ) {
      valRaw = valRaw.slice(1, -1);
    }

    // Try parse JSON arrays/objects
    if ((valRaw.startsWith("[") && valRaw.endsWith("]")) || (valRaw.startsWith("{") && valRaw.endsWith("}"))) {
      try {
        out[key] = JSON.parse(valRaw);
        continue;
      } catch {
        // fall through
      }
    }

    out[key] = valRaw;
  }

  return out as Json;
}

async function writeReceipt(supabaseAdmin: any, params: {
  conversation_id?: string | null;
  organization_id?: string | null;
  source_table: string;
  source_id?: string | null;
  channel: string;
  action_type: string;
  status: "sent" | "failed" | "pending";
  provider?: string | null;
  provider_receipt_id?: string | null;
  payload_snapshot?: Json;
  error?: string | null;
}) {
  await supabaseAdmin.from("execution_receipts").insert({
    conversation_id: params.conversation_id ?? null,
    organization_id: params.organization_id ?? null,
    source_table: params.source_table,
    source_id: params.source_id ?? null,
    channel: params.channel,
    action_type: params.action_type,
    status: params.status,
    provider: params.provider ?? null,
    provider_receipt_id: params.provider_receipt_id ?? null,
    payload_snapshot: params.payload_snapshot ?? {},
    error: params.error ?? null,
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
      conversation_id?: string;
      organization_id?: string;
      requested_by?: string;
      agent?: string;
      create_content_text: string;
      mode?: "preview" | "execute";
    };

    const conversation_id = body.conversation_id ?? null;
    const organization_id = body.organization_id ?? null;
    const requested_by = body.requested_by ?? "unknown";
    const agent = body.agent ?? "noah_bennett";
    const mode = body.mode ?? "preview";

    console.log("[execute-create-content] Received request:", { conversation_id, organization_id, agent, mode });

    const rawBlock = extractCreateContentBlock(body.create_content_text) ?? body.create_content_text;
    const parsed = parseCreateContent(rawBlock);

    console.log("[execute-create-content] Parsed block:", parsed);

    // Create job row immediately (so nothing is invisible)
    const { data: jobRow, error: jobErr } = await supabaseAdmin
      .from("content_jobs")
      .insert({
        conversation_id,
        organization_id,
        requested_by,
        agent,
        status: "pending",
        mode,
        create_content_block: rawBlock,
        parsed,
      })
      .select("*")
      .single();

    if (jobErr || !jobRow) {
      console.error("[execute-create-content] Failed to create job:", jobErr);
      return jsonResponse({ ok: false, error: jobErr?.message ?? "Failed creating content job" }, 500);
    }

    console.log("[execute-create-content] Created job:", jobRow.id);

    // Preview mode: just return parsed + job id
    if (mode === "preview") {
      await supabaseAdmin
        .from("content_jobs")
        .update({ status: "completed", result: { preview: true } })
        .eq("id", jobRow.id);
      
      return jsonResponse({ ok: true, job_id: jobRow.id, parsed, preview: true });
    }

    // If conversation exists, enforce gating
    let approvalRequired = true;
    let autopilotAllowed = false;
    let aiPaused = false;

    if (conversation_id) {
      const { data: conv, error: convErr } = await supabaseAdmin
        .from("conversations")
        .select("ai_paused, approval_required, autopilot_allowed")
        .eq("id", conversation_id)
        .single();

      if (!convErr && conv) {
        aiPaused = !!conv.ai_paused;
        approvalRequired = conv.approval_required !== false;
        autopilotAllowed = !!conv.autopilot_allowed;
      }
    }

    console.log("[execute-create-content] Gating:", { aiPaused, approvalRequired, autopilotAllowed });

    if (aiPaused) {
      await supabaseAdmin
        .from("content_jobs")
        .update({ status: "failed", error: "AI paused for this conversation" })
        .eq("id", jobRow.id);
      
      await writeReceipt(supabaseAdmin, {
        conversation_id,
        organization_id,
        source_table: "content_jobs",
        source_id: jobRow.id,
        channel: "content",
        action_type: "content_render",
        status: "failed",
        provider: "internal",
        error: "AI paused for this conversation",
        payload_snapshot: { parsed },
      });
      
      return jsonResponse({ ok: false, job_id: jobRow.id, error: "AI paused" }, 409);
    }

    // If approval required and autopilot not allowed, create ai_action and stop here
    if (approvalRequired && !autopilotAllowed) {
      const { data: actionRow } = await supabaseAdmin
        .from("ai_actions")
        .insert({
          conversation_id,
          organization_id,
          status: "pending",
          channel: "content",
          action_type: "content_render",
          preview: `Render ${String(parsed.content_type ?? "content")} for ${String(parsed.platform ?? "platform")}`,
          action_payload: {
            job_id: jobRow.id,
            parsed,
            create_content_block: rawBlock,
          },
        })
        .select("*")
        .single();

      await supabaseAdmin.from("content_jobs").update({
        status: "approved",
        result: { approval_required: true, ai_action_id: actionRow?.id ?? null },
      }).eq("id", jobRow.id);

      await writeReceipt(supabaseAdmin, {
        conversation_id,
        organization_id,
        source_table: "content_jobs",
        source_id: jobRow.id,
        channel: "content",
        action_type: "content_render",
        status: "pending",
        provider: "internal",
        payload_snapshot: { job_id: jobRow.id, ai_action_id: actionRow?.id ?? null, parsed },
      });

      console.log("[execute-create-content] Queued for approval:", actionRow?.id);

      return jsonResponse({
        ok: true,
        job_id: jobRow.id,
        queued_for_approval: true,
        ai_action_id: actionRow?.id ?? null,
      });
    }

    // Execute immediately (autopilot mode)
    await supabaseAdmin.from("content_jobs").update({ status: "executing" }).eq("id", jobRow.id);

    const contentType = String(parsed.content_type ?? "reel");
    const platform = String(parsed.platform ?? "instagram");

    const fnHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    };

    async function callFn(fnName: string, payload: Record<string, unknown>) {
      console.log(`[execute-create-content] Calling ${fnName}...`);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
        method: "POST",
        headers: fnHeaders,
        body: JSON.stringify(payload),
      });
      const txt = await res.text();
      let json: Record<string, unknown> = {};
      try { json = JSON.parse(txt); } catch { json = { raw: txt }; }
      if (!res.ok) throw new Error((json?.error as string) ?? `${fnName} failed (${res.status})`);
      return json;
    }

    let execResult: Record<string, unknown> = {};
    let usedFn = "";

    try {
      execResult = await callFn("execute-delegated-task", {
        job_id: jobRow.id,
        platform,
        content_type: contentType,
        create_content: parsed,
        conversation_id,
        organization_id,
      });
      usedFn = "execute-delegated-task";
    } catch (e1) {
      console.log("[execute-create-content] execute-delegated-task failed, trying hybrid-generate-content:", e1);
      try {
        execResult = await callFn("hybrid-generate-content", {
          job_id: jobRow.id,
          platform,
          content_type: contentType,
          create_content: parsed,
          conversation_id,
          organization_id,
        });
        usedFn = "hybrid-generate-content";
      } catch (e2) {
        console.error("[execute-create-content] Both pipelines failed:", e2);
        await supabaseAdmin.from("content_jobs").update({
          status: "failed",
          error: (e2 as Error).message,
        }).eq("id", jobRow.id);

        await writeReceipt(supabaseAdmin, {
          conversation_id,
          organization_id,
          source_table: "content_jobs",
          source_id: jobRow.id,
          channel: "content",
          action_type: "content_render",
          status: "failed",
          provider: "internal",
          error: (e2 as Error).message,
          payload_snapshot: { parsed },
        });

        return jsonResponse({ ok: false, job_id: jobRow.id, error: (e2 as Error).message }, 500);
      }
    }

    await supabaseAdmin.from("content_jobs").update({
      status: "completed",
      result: { usedFn, execResult },
    }).eq("id", jobRow.id);

    await writeReceipt(supabaseAdmin, {
      conversation_id,
      organization_id,
      source_table: "content_jobs",
      source_id: jobRow.id,
      channel: "content",
      action_type: "content_render",
      status: "sent",
      provider: "internal",
      payload_snapshot: { usedFn, execResult, parsed },
    });

    console.log("[execute-create-content] Execution complete:", { job_id: jobRow.id, usedFn });

    return jsonResponse({ ok: true, job_id: jobRow.id, executed: true, usedFn, execResult });
  } catch (e) {
    console.error("[execute-create-content] Error:", e);
    return jsonResponse({ ok: false, error: (e as Error).message }, 500);
  }
});
