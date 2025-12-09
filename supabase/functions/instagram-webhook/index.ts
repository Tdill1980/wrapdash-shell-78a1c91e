// INSTAGRAM WEBHOOK WITH USERNAME/AVATAR LOOKUP
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN")!;
const VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN") || "wrapcommand_verify_2024";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fetch Instagram user profile (username, name, avatar)
async function getInstagramUserProfile(igUserId: string): Promise<{
  username: string | null;
  name: string | null;
  profile_picture_url: string | null;
}> {
  try {
    const url = `https://graph.facebook.com/v18.0/${igUserId}?fields=username,name,profile_picture_url&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    console.log(`Fetching IG profile for user: ${igUserId}`);
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`IG API error (${res.status}):`, errorText);
      return { username: null, name: null, profile_picture_url: null };
    }

    const data = await res.json();
    console.log("IG profile data:", JSON.stringify(data));
    
    return {
      username: data.username || null,
      name: data.name || null,
      profile_picture_url: data.profile_picture_url || null
    };
  } catch (err) {
    console.error("Error fetching IG profile:", err);
    return { username: null, name: null, profile_picture_url: null };
  }
}

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
        console.log("Webhook verified successfully");
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
        console.log("No messaging data in webhook payload");
        return new Response("EVENT_RECEIVED", { status: 200 });
      }

      const event = body.entry[0].messaging[0];
      const senderId = event.sender?.id || "unknown";
      const text = event.message?.text || "";

      console.log(`Received DM from ${senderId}: "${text}"`);

      // ---------------------------------------------------------------------
      // 3. FETCH INSTAGRAM USER PROFILE
      // ---------------------------------------------------------------------
      const profile = await getInstagramUserProfile(senderId);
      
      const displayName = profile.name || profile.username || `IG User ${senderId.slice(-6)}`;
      const usernameDisplay = profile.username ? `@${profile.username}` : `ig_${senderId.slice(-6)}`;

      console.log(`User profile: ${displayName} (${usernameDisplay})`);

      // ---------------------------------------------------------------------
      // 4. INSERT INGEST LOG
      // ---------------------------------------------------------------------
      await supabase.from("message_ingest_log").insert({
        platform: "instagram",
        sender_id: senderId,
        sender_username: usernameDisplay,
        message_text: text,
        raw_payload: body,
        processed: false
      });

      // ---------------------------------------------------------------------
      // 5. FIND OR CREATE CONTACT WITH PROFILE DATA
      // ---------------------------------------------------------------------
      let { data: contact } = await supabase
        .from("contacts")
        .select("*")
        .eq("source", "instagram")
        .contains("metadata", { instagram_sender_id: senderId })
        .maybeSingle();

      if (!contact) {
        // Create new contact with full profile data
        const result = await supabase
          .from("contacts")
          .insert({
            name: displayName,
            source: "instagram",
            metadata: {
              instagram_sender_id: senderId,
              username: profile.username,
              avatar_url: profile.profile_picture_url,
              profile_url: profile.username ? `https://instagram.com/${profile.username}` : null
            }
          })
          .select()
          .single();
        contact = result.data;
        console.log("Created new contact:", contact?.id);
      } else {
        // Update existing contact with latest profile data if available
        if (profile.username || profile.name || profile.profile_picture_url) {
          const updatedMetadata = {
            ...((contact.metadata as object) || {}),
            instagram_sender_id: senderId,
            username: profile.username || (contact.metadata as any)?.username,
            avatar_url: profile.profile_picture_url || (contact.metadata as any)?.avatar_url,
            profile_url: profile.username 
              ? `https://instagram.com/${profile.username}` 
              : (contact.metadata as any)?.profile_url
          };
          
          await supabase
            .from("contacts")
            .update({ 
              name: displayName,
              metadata: updatedMetadata 
            })
            .eq("id", contact.id);
          
          console.log("Updated existing contact:", contact.id);
        }
      }

      // ---------------------------------------------------------------------
      // 6. FIND OR CREATE CONVERSATION WITH REAL USERNAME
      // ---------------------------------------------------------------------
      let { data: conversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("contact_id", contact.id)
        .eq("channel", "instagram")
        .maybeSingle();

      const conversationSubject = profile.username 
        ? `Instagram DM with @${profile.username}` 
        : `Instagram DM with ${displayName}`;

      if (!conversation) {
        const result = await supabase
          .from("conversations")
          .insert({
            contact_id: contact.id,
            channel: "instagram",
            subject: conversationSubject,
            status: "open",
            priority: "normal",
            unread_count: 1,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();
        conversation = result.data;
        console.log("Created new conversation:", conversation?.id);
      } else {
        // Update conversation with real username and increment unread
        await supabase
          .from("conversations")
          .update({ 
            subject: conversationSubject,
            unread_count: (conversation.unread_count || 0) + 1,
            last_message_at: new Date().toISOString()
          })
          .eq("id", conversation.id);
        console.log("Updated conversation:", conversation.id);
      }

      // ---------------------------------------------------------------------
      // 7. INSERT MESSAGE INTO MESSAGES TABLE
      // ---------------------------------------------------------------------
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        channel: "instagram",
        content: text,
        direction: "inbound",
        status: "received",
        sender_name: usernameDisplay,
        metadata: { 
          sender_id: senderId,
          username: profile.username,
          avatar_url: profile.profile_picture_url
        }
      });

      console.log("Message saved successfully");

      // ---------------------------------------------------------------------
      // 8. RETURN IG REQUIRED 200 OK (DO NOT CHANGE)
      // ---------------------------------------------------------------------
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("METHOD_NOT_ALLOWED", { status: 405 });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("EVENT_RECEIVED", { status: 200 }); // Prevent IG retries
  }
});
