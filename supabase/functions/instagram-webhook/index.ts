// CLEAN + STABLE INSTAGRAM WEBHOOK FOR WRAPCOMMAND AI
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN") || "wrapcommand_verify_2024";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const url = new URL(req.url);

    // -------------------------------------------------------------------------
    // 1. VERIFY WEBHOOK (Meta GET Challenge)
    // -------------------------------------------------------------------------
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }

      return new Response("INVALID_VERIFY_TOKEN", { status: 403 });
    }

    // -------------------------------------------------------------------------
    // 2. HANDLE INBOUND INSTAGRAM DM EVENT (POST)
    // -------------------------------------------------------------------------
    if (req.method === "POST") {
      const body = await req.json().catch(() => null);

      // Ignore invalid bodies
      if (!body?.entry?.[0]?.messaging?.[0]) {
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      const event = body.entry[0].messaging[0];
      const senderId = event.sender?.id || "unknown";
      const text = event.message?.text || "";

      // ---------------------------------------------------------------------
      // 3. INSERT INGEST LOG
      // ---------------------------------------------------------------------
      await supabase.from("message_ingest_log").insert({
        platform: "instagram",
        sender_id: senderId,
        sender_username: `ig_${senderId.slice(-6)}`,
        message_text: text,
        raw_payload: body,
        processed: false
      });

      // ---------------------------------------------------------------------
      // 4. FIND OR CREATE CONTACT
      // ---------------------------------------------------------------------
      let { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("source", "instagram")
        .contains("metadata", { instagram_sender_id: senderId })
        .maybeSingle();

      if (!contact) {
        const result = await supabase
          .from("contacts")
          .insert({
            name: `IG User ${senderId.slice(-6)}`,
            source: "instagram",
            metadata: { instagram_sender_id: senderId }
          })
          .select()
          .single();
        contact = result.data;
      }

      // ---------------------------------------------------------------------
      // 5. FIND OR CREATE CONVERSATION
      // ---------------------------------------------------------------------
      let { data: conversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("contact_id", contact.id)
        .eq("channel", "instagram")
        .maybeSingle();

      if (!conversation) {
        const result = await supabase
          .from("conversations")
          .insert({
            contact_id: contact.id,
            channel: "instagram",
            subject: `Instagram DM with ${contact.name}`,
            status: "open",
            priority: "normal",
            unread_count: 1
          })
          .select()
          .single();
        conversation = result.data;
      }

      // ---------------------------------------------------------------------
      // 6. INSERT MESSAGE INTO MESSAGES TABLE
      // ---------------------------------------------------------------------
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        channel: "instagram",
        content: text,
        direction: "inbound",
        status: "received",
        metadata: { sender_id: senderId }
      });

      // ---------------------------------------------------------------------
      // 7. RETURN IG REQUIRED 200 OK (DO NOT CHANGE)
      // ---------------------------------------------------------------------
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("METHOD_NOT_ALLOWED", { status: 405 });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("EVENT_RECEIVED", { status: 200 }); // Prevent IG retries
  }
});
