import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERIFY_TOKEN = "wrapcommand_verify_2024";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const params = url.searchParams;

  // Meta webhook verification (GET request)
  if (req.method === "GET") {
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");

    console.log("🔐 IG Webhook Verification:", { mode, token });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }
    console.error("❌ Webhook verification failed");
    return new Response("Verification failed", { status: 403 });
  }

  // Handle incoming DM events (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("📨 IG DM Event:", JSON.stringify(body, null, 2));

      const entry = body.entry?.[0];
      const messaging = entry?.messaging;

      if (!messaging) {
        console.log("No messaging data, ignoring event");
        return new Response("ignored", { status: 200, headers: corsHeaders });
      }

      for (const event of messaging) {
        if (event.message && !event.message.is_echo) {
          console.log("💬 New DM from:", event.sender.id, "Text:", event.message.text);

          // Forward to ingest-message
          const ingestUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ingest-message`;
          
          const ingestResponse = await fetch(ingestUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              platform: "instagram",
              sender_id: event.sender.id,
              sender_username: event.sender.id,
              message_text: event.message.text,
              metadata: {
                timestamp: event.timestamp,
                page_id: entry.id,
              },
            }),
          });

          const ingestData = await ingestResponse.json();
          console.log("📤 Ingest response:", ingestData);
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
    } catch (err) {
      console.error("❌ IG Webhook Error:", err);
      return new Response("error", { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
});
