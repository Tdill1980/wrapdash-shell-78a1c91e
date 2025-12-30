// supabase/functions/execute-ai-action/index.ts
// The single authoritative executor for MightyChat AI actions
// Enforces: LIVE/MANUAL/OFF mode, ai_paused, approval_required, autopilot_allowed
// Writes: messages + execution_receipts on every attempt

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

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore parse errors */
  }
  return { res, text, data };
}

function nowIso() {
  return new Date().toISOString();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -----------------------------
    // Auth / Supabase client
    // -----------------------------
    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const { action_id } = (await req.json().catch(() => ({}))) as { action_id?: string };
    if (!action_id) {
      console.error("[execute-ai-action] Missing action_id");
      return jsonResponse({ error: "Missing action_id" }, 400);
    }

    console.log(`[execute-ai-action] Processing action: ${action_id}`);

    // -----------------------------
    // Helpers: DB calls via REST
    // -----------------------------
    const db = async (path: string, init: RequestInit) => {
      const url = `${SUPABASE_URL}/rest/v1/${path}`;
      const headers = new Headers(init.headers || {});
      headers.set("apikey", SERVICE_ROLE_KEY);
      headers.set("Authorization", `Bearer ${SERVICE_ROLE_KEY}`);
      headers.set("Content-Type", "application/json");
      headers.set("Prefer", headers.get("Prefer") || "return=representation");
      return fetchJson(url, { ...init, headers });
    };

    // -----------------------------
    // Load ai_action
    // -----------------------------
    const { data: actionRows } = await db(
      `ai_actions?id=eq.${encodeURIComponent(action_id)}&select=*`,
      { method: "GET" }
    );

    const action = Array.isArray(actionRows) ? actionRows[0] : null;
    if (!action) {
      console.error(`[execute-ai-action] Action not found: ${action_id}`);
      return jsonResponse({ error: "ai_action not found" }, 404);
    }

    const conversation_id = action.conversation_id as string | null;
    const channel = (action.channel || "") as string;
    const action_type = (action.action_type || "") as string;
    const status = (action.status || "pending") as string;

    const payload: Record<string, unknown> = (action.action_payload as Record<string, unknown>) || {};
    const content = String(payload.content || payload.message || "").trim();

    console.log(`[execute-ai-action] Action details:`, {
      conversation_id,
      channel,
      action_type,
      status,
      hasContent: !!content,
    });

    // -----------------------------
    // Load conversation (for gating)
    // -----------------------------
    let conversation: Record<string, unknown> | null = null;
    if (conversation_id) {
      const { data: convRows } = await db(
        `conversations?id=eq.${encodeURIComponent(conversation_id)}&select=*`,
        { method: "GET" }
      );
      conversation = Array.isArray(convRows) ? convRows[0] : null;
    }

    // -----------------------------
    // Global AI mode enforcement
    // LIVE = can auto-send when allowed
    // MANUAL = requires ai_actions.status = approved
    // OFF = do not execute
    // -----------------------------
    const AI_MODE = (Deno.env.get("AI_MODE") || "LIVE").toUpperCase();

    console.log(`[execute-ai-action] AI_MODE: ${AI_MODE}, conversation settings:`, {
      ai_paused: conversation?.ai_paused,
      approval_required: conversation?.approval_required,
      autopilot_allowed: conversation?.autopilot_allowed,
    });

    if (AI_MODE === "OFF") {
      console.log(`[execute-ai-action] Blocked: AI_MODE=OFF`);
      return jsonResponse({ blocked: true, reason: "AI_MODE=OFF" }, 200);
    }

    if (conversation?.ai_paused === true) {
      console.log(`[execute-ai-action] Blocked: conversation.ai_paused=true`);
      return jsonResponse({ blocked: true, reason: "conversation.ai_paused" }, 200);
    }

    const approval_required = conversation?.approval_required ?? true;
    const autopilot_allowed = conversation?.autopilot_allowed ?? false;

    // In MANUAL mode, require approved always.
    if (AI_MODE === "MANUAL" && status !== "approved") {
      console.log(`[execute-ai-action] Blocked: MANUAL mode requires approved status`);
      return jsonResponse({ blocked: true, reason: "MANUAL requires approved", status }, 200);
    }

    // In LIVE mode, allow auto-send only if autopilot_allowed is true OR approval_required is false.
    // Otherwise require approved.
    if (AI_MODE === "LIVE") {
      const canAutoSend = approval_required === false || autopilot_allowed === true;
      if (!canAutoSend && status !== "approved") {
        console.log(`[execute-ai-action] Blocked: LIVE mode requires approval for this thread`);
        return jsonResponse({ blocked: true, reason: "LIVE requires approval for this thread", status }, 200);
      }
    }

    // Basic payload validations
    if (!content && (action_type === "dm_send" || action_type === "email_send" || action_type === "website_reply")) {
      console.error(`[execute-ai-action] Missing content in action_payload`);
      return jsonResponse({ error: "Missing content in action_payload" }, 400);
    }

    // Mark executing
    await db(`ai_actions?id=eq.${encodeURIComponent(action_id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "executing", executed_at: nowIso() }),
    });

    // -----------------------------
    // Execute by type
    // -----------------------------
    let sent = false;
    let provider_receipt_id: string | null = null;
    let provider: string | null = null;
    let errorMessage: string | null = null;

    // Always snapshot what we attempted to send
    const payload_snapshot = {
      channel,
      action_type,
      content,
      ...payload,
    };

    // ----- Instagram DM Send -----
    if (channel === "instagram" && action_type === "dm_send") {
      provider = "meta";

      const recipientId = String(
        payload.recipient_id || payload.sender_id || payload.igsid || ""
      ).trim();

      if (!recipientId) {
        errorMessage = "Missing recipient_id in action_payload";
        console.error(`[execute-ai-action] ${errorMessage}`);
      } else {
        // Load token row (choose latest active)
        const { data: tokRows } = await db(
          `instagram_tokens?select=*&order=created_at.desc&limit=1`,
          { method: "GET" }
        );

        const tok = Array.isArray(tokRows) ? tokRows[0] : null;
        const pageAccessToken =
          tok?.page_access_token || Deno.env.get("INSTAGRAM_PAGE_ACCESS_TOKEN") || Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
        const pageId = tok?.page_id || Deno.env.get("INSTAGRAM_PAGE_ID");

        if (!pageAccessToken || !pageId) {
          errorMessage = "Instagram not connected: missing page_access_token/page_id";
          console.error(`[execute-ai-action] ${errorMessage}`);
        } else {
          console.log(`[execute-ai-action] Sending IG DM to ${recipientId} via /me/messages`);

          // CRITICAL: Use /me/messages, NOT /{pageId}/messages
          // The Page Access Token automatically scopes to the correct page
          const graphUrl = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
            pageAccessToken
          )}`;

          const { res, data, text } = await fetchJson(graphUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_type: "RESPONSE",
              recipient: { id: recipientId },
              message: { text: content },
            }),
          });

          if (!res.ok) {
            const apiData = data as Record<string, unknown> | null;
            const apiError = apiData?.error as Record<string, unknown> | undefined;
            errorMessage = String(apiError?.message || text || `Graph send failed (${res.status})`);
            console.error(`[execute-ai-action] Instagram API error:`, { status: res.status, error: errorMessage });
          } else {
            const apiData = data as Record<string, unknown> | null;
            provider_receipt_id = String(apiData?.message_id || apiData?.recipient_id || "");
            sent = true;
            console.log(`[execute-ai-action] Instagram DM sent successfully, receipt: ${provider_receipt_id}`);
          }
        }
      }
    }

    // ----- Email Send -----
    if (channel === "email" && action_type === "email_send") {
      provider = "resend";

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const from = String(
        payload.from || Deno.env.get("DEFAULT_FROM_EMAIL") || "support@weprintwraps.com"
      ).trim();
      const to = String(payload.to || "").trim();
      const subject = String(payload.subject || "WePrintWraps").trim();

      if (!RESEND_API_KEY) {
        errorMessage = "Missing RESEND_API_KEY";
        console.error(`[execute-ai-action] ${errorMessage}`);
      } else if (!to) {
        errorMessage = "Missing email recipient (to)";
        console.error(`[execute-ai-action] ${errorMessage}`);
      } else {
        console.log(`[execute-ai-action] Sending email to ${to} from ${from}`);

        const { res, data, text } = await fetchJson("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject,
            text: content,
          }),
        });

        if (!res.ok) {
          const apiData = data as Record<string, unknown> | null;
          errorMessage = String(apiData?.message || text || `Resend failed (${res.status})`);
          console.error(`[execute-ai-action] Resend API error:`, { status: res.status, error: errorMessage });
        } else {
          const apiData = data as Record<string, unknown> | null;
          provider_receipt_id = String(apiData?.id || "");
          sent = true;
          console.log(`[execute-ai-action] Email sent successfully, receipt: ${provider_receipt_id}`);
        }
      }
    }

    // ----- Website Reply -----
    if (channel === "website" && action_type === "website_reply") {
      // Website replies don't go to external provider - just mark as sent
      // The message will be visible in the chat UI
      provider = "internal";
      sent = true;
      provider_receipt_id = `internal-${Date.now()}`;
      console.log(`[execute-ai-action] Website reply recorded internally`);
    }

    // -----------------------------
    // Persist outbound message (always insert, mark sent/failed)
    // -----------------------------
    if (
      conversation_id &&
      (action_type === "dm_send" || action_type === "email_send" || action_type === "website_reply")
    ) {
      const messageResult = await db(`messages`, {
        method: "POST",
        body: JSON.stringify({
          conversation_id,
          direction: "outbound",
          channel,
          content,
          sender_type: "ai",
          sender_name: String(payload.sender_name || payload.agent_name || "AI"),
          sender_email: payload.sender_email || null,
          status: sent ? "sent" : "failed",
          sent_at: nowIso(),
          metadata: {
            provider,
            provider_receipt_id,
            sent,
            ...(errorMessage ? { error_message: errorMessage } : {}),
          },
        }),
      });

      console.log(`[execute-ai-action] Message persisted:`, {
        success: messageResult.res.ok,
        status: sent ? "sent" : "failed",
      });
    }

    // -----------------------------
    // Write execution receipt ALWAYS
    // -----------------------------
    const receiptResult = await db(`execution_receipts`, {
      method: "POST",
      body: JSON.stringify({
        conversation_id,
        source_table: "ai_actions",
        source_id: action_id,
        channel,
        action_type,
        status: sent ? "sent" : "failed",
        provider,
        provider_receipt_id,
        payload_snapshot,
        error: errorMessage,
      }),
    });

    console.log(`[execute-ai-action] Execution receipt written:`, {
      success: receiptResult.res.ok,
      status: sent ? "sent" : "failed",
    });

    // Update ai_actions final status
    await db(`ai_actions?id=eq.${encodeURIComponent(action_id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: sent ? "sent" : "failed",
        executed_at: nowIso(),
      }),
    });

    console.log(`[execute-ai-action] Action ${action_id} completed:`, {
      sent,
      channel,
      action_type,
      provider,
    });

    return jsonResponse({
      ok: true,
      sent,
      channel,
      action_type,
      provider,
      provider_receipt_id,
      error: errorMessage,
    });
  } catch (err) {
    console.error("[execute-ai-action] Unexpected error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
