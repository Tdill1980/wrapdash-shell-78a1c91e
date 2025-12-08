import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = "wrapcommand_verify_2024";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // -------------------------------------------------------------------------
    // 1. HANDLE INSTAGRAM WEBHOOK VERIFICATION (GET)
    // -------------------------------------------------------------------------
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (req.method === "GET" && mode === "subscribe") {
      console.log("🔐 IG Webhook Verification Request:", { mode, token });
      
      if (token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      } else {
        console.error("❌ Invalid verify token");
        return new Response("INVALID_VERIFY_TOKEN", { status: 403 });
      }
    }

    // -------------------------------------------------------------------------
    // 2. HANDLE IG DM EVENTS (POST)
    // -------------------------------------------------------------------------
    if (req.method === "POST") {
      const rawBody = await req.json();
      console.log("📨 IG DM Event received:", JSON.stringify(rawBody, null, 2));

      // Safety check - ignore invalid payloads
      if (!rawBody?.entry?.[0]?.messaging?.[0]) {
        console.log("⚠️ Invalid or empty messaging payload, acknowledging");
        return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
      }

      const event = rawBody.entry[0].messaging[0];
      const senderId = event.sender?.id || "unknown_sender";
      const text = event.message?.text || "";
      const isEcho = event.message?.is_echo || false;

      // Skip echo messages (our own replies)
      if (isEcho) {
        console.log("↩️ Skipping echo message");
        return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
      }

      console.log("💬 Processing DM from:", senderId, "Text:", text);

      // -----------------------------------------------------------------------
      // 3. WRITE MESSAGE INTO INGEST LOG
      // -----------------------------------------------------------------------
      const { error: logError } = await supabase.from("message_ingest_log").insert({
        platform: "instagram",
        sender_id: senderId,
        sender_username: `ig_${senderId.slice(-6)}`,
        message_text: text,
        raw_payload: rawBody,
        processed: false,
      });

      if (logError) {
        console.error("❌ Failed to log message:", logError);
      } else {
        console.log("✅ Message logged to ingest_log");
      }

      // -----------------------------------------------------------------------
      // 4. FIND OR CREATE CONTACT
      // -----------------------------------------------------------------------
      let contact = null;
      
      // Look for existing contact by metadata
      const { data: existingContacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("source", "instagram")
        .contains("metadata", { instagram_sender_id: senderId })
        .limit(1);

      if (existingContacts && existingContacts.length > 0) {
        contact = existingContacts[0];
        console.log("📇 Found existing contact:", contact.id);
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            name: `IG User ${senderId.slice(-6)}`,
            source: "instagram",
            metadata: { instagram_sender_id: senderId },
            tags: ["instagram", "dm"],
          })
          .select()
          .single();

        if (contactError) {
          console.error("❌ Failed to create contact:", contactError);
        } else {
          contact = newContact;
          console.log("✅ Created new contact:", contact?.id);
        }
      }

      // -----------------------------------------------------------------------
      // 5. FIND OR CREATE CONVERSATION
      // -----------------------------------------------------------------------
      let conversation = null;

      if (contact) {
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("*")
          .eq("contact_id", contact.id)
          .eq("channel", "instagram")
          .limit(1);

        if (existingConv && existingConv.length > 0) {
          conversation = existingConv[0];
          console.log("💬 Found existing conversation:", conversation.id);
          
          // Update last_message_at
          await supabase
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversation.id);
        } else {
          const { data: newConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              contact_id: contact.id,
              channel: "instagram",
              subject: `Instagram DM with ${contact.name}`,
              status: "open",
              priority: "normal",
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (convError) {
            console.error("❌ Failed to create conversation:", convError);
          } else {
            conversation = newConv;
            console.log("✅ Created new conversation:", conversation?.id);
          }
        }
      }

      // -----------------------------------------------------------------------
      // 6. INSERT MESSAGE INTO MESSAGES TABLE
      // -----------------------------------------------------------------------
      if (conversation) {
        const { error: msgError } = await supabase.from("messages").insert({
          conversation_id: conversation.id,
          channel: "instagram",
          content: text,
          direction: "inbound",
          status: "received",
          metadata: { sender_id: senderId },
        });

        if (msgError) {
          console.error("❌ Failed to insert message:", msgError);
        } else {
          console.log("✅ Message inserted into messages table");
        }
      }

      // -----------------------------------------------------------------------
      // 7. CHECK FOR QUOTE INTENT AND CREATE AI ACTION
      // -----------------------------------------------------------------------
      const quoteKeywords = ["quote", "price", "cost", "wrap", "how much", "estimate"];
      const isQuoteRequest = quoteKeywords.some(kw => text.toLowerCase().includes(kw));

      if (isQuoteRequest) {
        const { error: actionError } = await supabase.from("ai_actions").insert({
          action_type: "create_quote",
          action_payload: {
            source: "instagram_dm",
            sender_id: senderId,
            message_text: text,
            contact_id: contact?.id,
            conversation_id: conversation?.id,
          },
          priority: "high",
          resolved: false,
        });

        if (actionError) {
          console.error("❌ Failed to create ai_action:", actionError);
        } else {
          console.log("✅ Created ai_action for quote request");
        }
      }

      // -----------------------------------------------------------------------
      // 8. RETURN IG STANDARD ACKNOWLEDGEMENT
      // -----------------------------------------------------------------------
      console.log("✅ Webhook processed successfully");
      return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
    }

    // Unsupported method fallback
    return new Response("METHOD_NOT_ALLOWED", { status: 405, headers: corsHeaders });

  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return new Response("EVENT_RECEIVED", { status: 200, headers: corsHeaders });
  }
});
