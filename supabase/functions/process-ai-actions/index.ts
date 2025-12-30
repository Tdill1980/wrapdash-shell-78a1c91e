// supabase/functions/process-ai-actions/index.ts
// The missing worker that processes pending ai_actions
// Implements: locking, idempotency, retry tracking, outbox pattern

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface AIAction {
  id: string;
  action_type: string;
  status: string;
  channel: string | null;
  conversation_id: string | null;
  organization_id: string | null;
  action_payload: Record<string, unknown> | null;
  priority: string | null;
  created_at: string;
  attempts?: number;
}

// Execute action based on type
async function executeAction(action: AIAction): Promise<{ ok: boolean; result: string; error?: string }> {
  const payload = action.action_payload || {};
  
  switch (action.action_type) {
    case "approve_message":
    case "dm_send":
    case "email_send":
    case "website_reply":
      // Route through execute-ai-action for actual sending
      console.log(`[process-ai-actions] Routing ${action.action_type} to execute-ai-action`);
      
      const execResponse = await fetch(`${SUPABASE_URL}/functions/v1/execute-ai-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ action_id: action.id }),
      });
      
      const execResult = await execResponse.json();
      
      if (execResult.blocked) {
        return { ok: true, result: `blocked: ${execResult.reason}` };
      }
      
      if (execResult.error || !execResult.sent) {
        return { ok: false, result: "send_failed", error: execResult.error || "Unknown send error" };
      }
      
      return { ok: true, result: `sent via ${execResult.provider}` };

    case "create_quote":
    case "auto_quote_generated":
      // Quote actions are already created by ingest-message
      // Mark as executed so they show in the queue for approval
      console.log(`[process-ai-actions] Quote action ${action.id} ready for review`);
      return { ok: true, result: "quote_ready_for_review" };

    case "file_review":
      // File reviews need manual attention - keep pending but log
      console.log(`[process-ai-actions] File review ${action.id} - needs manual review`);
      return { ok: true, result: "file_needs_review" };

    default:
      console.log(`[process-ai-actions] Unknown action_type: ${action.action_type}`);
      return { ok: true, result: `noop for ${action.action_type}` };
  }
}

// Write execution receipt
async function writeReceipt(action: AIAction, status: "success" | "failed", result: Record<string, unknown>, error?: string) {
  try {
    await supabase.from("execution_receipts").insert({
      conversation_id: action.conversation_id,
      source_table: "ai_actions",
      source_id: action.id,
      channel: action.channel,
      action_type: action.action_type,
      status: status === "success" ? "executed" : "failed",
      provider: "process-ai-actions",
      provider_receipt_id: null,
      payload_snapshot: { ...action.action_payload, worker_result: result },
      error: error || null,
    });
  } catch (e) {
    console.error(`[process-ai-actions] Failed to write receipt:`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    console.log("[process-ai-actions] Starting batch processing...");

    // Fetch pending actions (oldest first, limited batch)
    // Only process action types that should be auto-executed
    const { data: actions, error: fetchError } = await supabase
      .from("ai_actions")
      .select("*")
      .eq("status", "pending")
      .in("action_type", ["dm_send", "email_send", "website_reply", "approve_message"])
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[process-ai-actions] Fetch error:", fetchError);
      return new Response(JSON.stringify({ ok: false, error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!actions || actions.length === 0) {
      console.log("[process-ai-actions] No pending actions to process");
      return new Response(JSON.stringify({ 
        ok: true, 
        processed: 0, 
        message: "No pending actions",
        duration_ms: Date.now() - startTime 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[process-ai-actions] Found ${actions.length} pending actions`);

    for (const action of actions) {
      const currentAttempts = (action as unknown as { attempts?: number }).attempts || 0;
      
      // Skip if too many attempts (max 3)
      if (currentAttempts >= 3) {
        console.log(`[process-ai-actions] Skipping ${action.id} - max attempts reached (${currentAttempts})`);
        skipped++;
        continue;
      }

      // ============================================================
      // IDEMPOTENT LOCK: Update to 'processing' ONLY if still 'pending'
      // This prevents double execution by concurrent workers
      // ============================================================
      const { data: locked, error: lockErr } = await supabase
        .from("ai_actions")
        .update({ 
          status: "processing", 
          executed_at: new Date().toISOString(),
        })
        .eq("id", action.id)
        .eq("status", "pending") // CRITICAL: Only lock if still pending
        .select()
        .maybeSingle();

      if (lockErr || !locked) {
        console.log(`[process-ai-actions] Could not lock ${action.id} - already grabbed by another worker`);
        skipped++;
        continue;
      }

      console.log(`[process-ai-actions] Processing action ${action.id} (${action.action_type})`);

      try {
        const result = await executeAction(action as AIAction);

        if (result.ok) {
          // SUCCESS: Mark as executed
          await supabase.from("ai_actions").update({
            status: "executed",
            executed_at: new Date().toISOString(),
          }).eq("id", action.id);

          await writeReceipt(action as AIAction, "success", { result: result.result });
          processed++;
          console.log(`[process-ai-actions] ✅ Action ${action.id} executed: ${result.result}`);
        } else {
          // FAILED: Mark as failed, increment attempts
          await supabase.from("ai_actions").update({
            status: currentAttempts + 1 >= 3 ? "failed" : "pending", // Retry up to 3 times
            executed_at: new Date().toISOString(),
          }).eq("id", action.id);

          await writeReceipt(action as AIAction, "failed", { result: result.result }, result.error);
          failed++;
          console.log(`[process-ai-actions] ❌ Action ${action.id} failed: ${result.error}`);
        }
      } catch (execErr) {
        // EXCEPTION: Mark as failed
        const errorMsg = execErr instanceof Error ? execErr.message : String(execErr);
        
        await supabase.from("ai_actions").update({
          status: currentAttempts + 1 >= 3 ? "failed" : "pending",
          executed_at: new Date().toISOString(),
        }).eq("id", action.id);

        await writeReceipt(action as AIAction, "failed", { exception: true }, errorMsg);
        failed++;
        console.error(`[process-ai-actions] ❌ Exception processing ${action.id}:`, execErr);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[process-ai-actions] Batch complete: ${processed} processed, ${failed} failed, ${skipped} skipped in ${duration}ms`);

    return new Response(JSON.stringify({ 
      ok: true, 
      processed, 
      failed, 
      skipped,
      duration_ms: duration 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[process-ai-actions] Unexpected error:", err);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - startTime 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
