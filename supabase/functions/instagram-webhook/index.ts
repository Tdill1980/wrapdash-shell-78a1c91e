// INSTAGRAM WEBHOOK WITH USERNAME/AVATAR LOOKUP + FILE HANDLING
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN")!;
const VERIFY_TOKEN = Deno.env.get("INSTAGRAM_VERIFY_TOKEN") || "wrapcommand_verify_2024";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fetch Instagram user profile with dual-endpoint strategy for better username capture
async function getInstagramUserProfile(igUserId: string): Promise<{
  username: string | null;
  name: string | null;
  profile_picture_url: string | null;
  api_error: string | null;
}> {
  // Instagram-Scoped User IDs (IGSID) require specific API endpoints
  // Try multiple endpoints to maximize success rate
  const endpoints = [
    // Instagram Graph API - preferred for IGSID
    {
      name: 'Instagram Graph API',
      url: `https://graph.instagram.com/${igUserId}?fields=name,username,profile_picture_url&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    },
    // Facebook Graph API with user_profile field
    {
      name: 'Facebook Graph API v18',
      url: `https://graph.facebook.com/v18.0/${igUserId}?fields=name,username,profile_picture_url&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    },
    // Facebook Graph API with different field set
    {
      name: 'Facebook Graph API (alt fields)',
      url: `https://graph.facebook.com/v18.0/${igUserId}?fields=name,profile_pic&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    }
  ];

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Trying ${endpoint.name} for user ${igUserId}...`);
      
      const res = await fetch(endpoint.url);
      const responseText = await res.text();
      
      // Log raw response for debugging
      console.log(`📥 ${endpoint.name} response (${res.status}): ${responseText.substring(0, 500)}`);
      
      if (!res.ok) {
        const errorMsg = `${endpoint.name}: HTTP ${res.status} - ${responseText.substring(0, 200)}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        continue;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        errors.push(`${endpoint.name}: Failed to parse JSON`);
        continue;
      }

      // Check for API error in response body
      if (data.error) {
        const errorMsg = `${endpoint.name}: ${data.error.message || data.error.type || 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ API Error: ${JSON.stringify(data.error)}`);
        continue;
      }

      // Check if we got useful profile data
      const username = data.username || null;
      const name = data.name || null;
      const profilePic = data.profile_picture_url || data.profile_pic || null;

      if (username || name) {
        console.log(`✅ SUCCESS via ${endpoint.name}: @${username || 'no-username'} / ${name || 'no-name'}`);
        return {
          username,
          name,
          profile_picture_url: profilePic,
          api_error: null
        };
      }

      // Got response but no useful data
      errors.push(`${endpoint.name}: Empty response - no username or name returned`);
      console.log(`⚠️ ${endpoint.name} returned empty profile data`);

    } catch (err) {
      const errorMsg = `${endpoint.name}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ Exception: ${errorMsg}`);
    }
  }

  // All endpoints failed - return detailed error for debugging
  const combinedError = errors.join(' | ');
  console.error(`🚫 All profile fetch attempts failed for ${igUserId}: ${combinedError}`);
  
  return {
    username: null,
    name: null,
    profile_picture_url: null,
    api_error: combinedError
  };
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
      
      // *** NEW: Extract file attachments ***
      const attachments = event.message?.attachments || [];
      const hasFiles = attachments.length > 0;
      const fileUrls = attachments
        .map((a: any) => a.payload?.url)
        .filter(Boolean);

      console.log(`Received DM from ${senderId}: "${text}"`);
      if (hasFiles) {
        console.log(`📁 ${attachments.length} file(s) attached:`, fileUrls);
      }

      // ---------------------------------------------------------------------
      // 3. FETCH INSTAGRAM USER PROFILE
      // ---------------------------------------------------------------------
      const profile = await getInstagramUserProfile(senderId);
      
      const displayName = profile.name || profile.username || `IG User ${senderId.slice(-6)}`;
      const usernameDisplay = profile.username ? `@${profile.username}` : `ig_${senderId.slice(-6)}`;
      const profileFetchFailed = !profile.username && !profile.name;

      console.log(`👤 User profile: ${displayName} (${usernameDisplay}) ${profileFetchFailed ? '⚠️ PROFILE FETCH FAILED' : '✅'}`);
      if (profile.api_error) {
        console.log(`🔴 API Error stored: ${profile.api_error}`);
      }

      // ---------------------------------------------------------------------
      // 4. INSERT INGEST LOG WITH FILE INFO
      // ---------------------------------------------------------------------
      await supabase.from("message_ingest_log").insert({
        platform: "instagram",
        sender_id: senderId,
        sender_username: usernameDisplay,
        message_text: hasFiles ? `${text} [+${attachments.length} file(s)]` : text,
        raw_payload: { ...body, has_files: hasFiles, file_urls: fileUrls },
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
        // Create new contact with full profile data + error tracking
        const result = await supabase
          .from("contacts")
          .insert({
            name: displayName,
            source: "instagram",
            metadata: {
              instagram_sender_id: senderId,
              username: profile.username,
              avatar_url: profile.profile_picture_url,
              profile_url: profile.username ? `https://instagram.com/${profile.username}` : null,
              profile_fetch_failed: profileFetchFailed,
              profile_api_error: profile.api_error,
              last_profile_attempt: new Date().toISOString()
            }
          })
          .select()
          .single();
        contact = result.data;
        console.log(`📝 Created new contact: ${contact?.id} ${profileFetchFailed ? '(profile fetch failed)' : ''}`);
      } else {
        // Check if existing contact has generic name and we should retry profile fetch
        const existingMeta = (contact.metadata as any) || {};
        const hasGenericName = contact.name?.startsWith('IG User') || contact.name?.startsWith('ig_');
        const shouldRetryFetch = hasGenericName && !existingMeta.username;
        
        if (shouldRetryFetch) {
          console.log(`🔄 Existing contact ${contact.id} has generic name - profile was fetched again`);
        }
        // Update existing contact with latest profile data OR update error tracking
        const updatedMetadata = {
          ...existingMeta,
          instagram_sender_id: senderId,
          username: profile.username || existingMeta.username,
          avatar_url: profile.profile_picture_url || existingMeta.avatar_url,
          profile_url: profile.username 
            ? `https://instagram.com/${profile.username}` 
            : existingMeta.profile_url,
          profile_fetch_failed: profileFetchFailed && !existingMeta.username,
          profile_api_error: profileFetchFailed ? profile.api_error : null,
          last_profile_attempt: new Date().toISOString()
        };
        
        // Update name only if we got a real profile OR contact still has generic name
        const newName = (profile.username || profile.name) 
          ? displayName 
          : (hasGenericName ? contact.name : displayName);
        
        await supabase
          .from("contacts")
          .update({ 
            name: newName,
            metadata: updatedMetadata 
          })
          .eq("id", contact.id);
        
        console.log(`📝 Updated contact ${contact.id}: ${newName} ${profile.username ? '✅ Got username!' : (profileFetchFailed ? '⚠️ Profile still unavailable' : '')}`);
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
            priority: hasFiles ? "high" : "normal", // Escalate priority if files sent
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
            last_message_at: new Date().toISOString(),
            priority: hasFiles ? "high" : conversation.priority // Escalate if files
          })
          .eq("id", conversation.id);
        console.log("Updated conversation:", conversation.id);
      }

      // ---------------------------------------------------------------------
      // 7. INSERT MESSAGE INTO MESSAGES TABLE WITH FILE METADATA
      // ---------------------------------------------------------------------
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        channel: "instagram",
        content: hasFiles ? `${text || ''} [Sent ${attachments.length} file(s)]` : text,
        direction: "inbound",
        status: "received",
        sender_name: usernameDisplay,
        metadata: { 
          sender_id: senderId,
          username: profile.username,
          avatar_url: profile.profile_picture_url,
          has_files: hasFiles,
          attachments: hasFiles ? fileUrls : undefined
        }
      });

      console.log("Message saved successfully");

      // ---------------------------------------------------------------------
      // 8. LOG STORY ENGAGEMENT (Track DMs that may be story responses)
      // ---------------------------------------------------------------------
      try {
        // Check if message might be a story response (Instagram includes story_reply in some cases)
        const isStoryReply = event.message?.reply_to?.story || event.message?.is_story_reply;
        const storyMention = text.toLowerCase().includes('story') || text.toLowerCase().includes('saw') || text.toLowerCase().includes('post');
        
        // Log all DMs to story_engagement for pattern analysis
        // Hot leads: people who DM after seeing content
        await supabase.from("story_engagement_log").insert({
          story_id: event.message?.reply_to?.story?.id || null,
          dm_received_at: new Date().toISOString(),
          sender_id: senderId,
          sender_username: usernameDisplay,
          message_text: text,
          intent_type: isStoryReply ? 'story_reply' : (storyMention ? 'story_mention' : 'organic_dm'),
          conversation_id: conversation.id,
          contact_id: contact.id
        });
        
        console.log(`📊 Story engagement logged: ${isStoryReply ? 'STORY_REPLY' : (storyMention ? 'STORY_MENTION' : 'ORGANIC_DM')}`);
      } catch (storyErr) {
        console.error("Story engagement log error:", storyErr);
      }

      // ---------------------------------------------------------------------
      // 9. ROUTE THROUGH INGEST-MESSAGE FOR AI PROCESSING (WITH FILES)
      // ---------------------------------------------------------------------
      try {
        const ingestResponse = await fetch(`${SUPABASE_URL}/functions/v1/ingest-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            platform: 'instagram',
            sender_id: senderId,
            sender_username: usernameDisplay,
            message_text: text,
            conversation_id: conversation.id,
            contact_id: contact.id,
            // *** NEW: Pass file attachments to ingest-message ***
            attachments: hasFiles ? fileUrls : []
          })
        });
        
        const ingestResult = await ingestResponse.json();
        console.log("Ingest result:", JSON.stringify(ingestResult));
        
        // AI reply is sent by ingest-message via send-instagram-reply
      } catch (ingestErr) {
        console.error("Ingest-message error:", ingestErr);
      }

      // ---------------------------------------------------------------------
      // 9. RETURN IG REQUIRED 200 OK (DO NOT CHANGE)
      // ---------------------------------------------------------------------
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("METHOD_NOT_ALLOWED", { status: 405 });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("EVENT_RECEIVED", { status: 200 }); // Prevent IG retries
  }
});
