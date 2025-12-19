import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let ACCESS_TOKEN = "";

async function loadAccessToken(supabase: any) {
  // Try database first (new OAuth model)
  const { data } = await supabase
    .from("instagram_tokens")
    .select("page_access_token, access_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (data?.page_access_token) {
    ACCESS_TOKEN = data.page_access_token;
    console.log("[Backfill] Using page_access_token from database");
    return;
  }
  if (data?.access_token) {
    ACCESS_TOKEN = data.access_token;
    console.log("[Backfill] Using access_token from database");
    return;
  }
  
  // Fallback to env var
  ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN") || "";
  console.log("[Backfill] Using INSTAGRAM_ACCESS_TOKEN from env");
}

async function getInstagramUserProfile(igUserId: string) {
  // Instagram Messaging "user profile" lookup expects a versioned Graph endpoint.
  // We try the most correct endpoint first, then fall back.
  const endpoints = [
    {
      name: "Instagram Graph API v24.0",
      url: `https://graph.instagram.com/v24.0/${igUserId}?fields=name,username,profile_pic&access_token=${ACCESS_TOKEN}`,
    },
    {
      name: "Instagram Graph API (unversioned fallback)",
      url: `https://graph.instagram.com/${igUserId}?fields=name,username,profile_pic&access_token=${ACCESS_TOKEN}`,
    },
    {
      name: "Facebook Graph API v24.0 (fallback)",
      url: `https://graph.facebook.com/v24.0/${igUserId}?fields=name,username,profile_pic,profile_picture_url&access_token=${ACCESS_TOKEN}`,
    },
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[Backfill] Trying ${endpoint.name} for user ${igUserId}`);
      const res = await fetch(endpoint.url);

      if (res.ok) {
        const data = await res.json();
        console.log(`[Backfill] SUCCESS from ${endpoint.name}:`, JSON.stringify(data));

        const username = data.username || null;
        const name = data.name || null;
        const profilePic = data.profile_picture_url || data.profile_pic || null;

        if (username || name) {
          return {
            username,
            name,
            profile_picture_url: profilePic,
            source: endpoint.name,
          };
        }
      } else {
        const errorText = await res.text();
        console.log(`[Backfill] ${endpoint.name} returned ${res.status}: ${errorText}`);
        lastError = { endpoint: endpoint.name, status: res.status, error: errorText };
      }
    } catch (err) {
      console.error(`[Backfill] ${endpoint.name} exception:`, err);
      lastError = { endpoint: endpoint.name, error: String(err) };
    }
  }

  console.error(`[Backfill] All endpoints failed for user ${igUserId}. Last error:`, lastError);
  return { error: lastError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Load access token from database or env
    await loadAccessToken(supabase);

    // Get all Instagram contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("source", "instagram");

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    console.log(`[Backfill] Found ${contacts?.length || 0} Instagram contacts to process`);

    const results = {
      total: contacts?.length || 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      api_errors: 0,
      details: [] as Array<{ id: string; name: string; status: string; newName?: string; error?: any }>
    };

    for (const contact of contacts || []) {
      const metadata = contact.metadata || {};
      const senderId = metadata.instagram_sender_id;

      if (!senderId) {
        results.skipped++;
        results.details.push({ id: contact.id, name: contact.name, status: "skipped - no sender_id" });
        continue;
      }

      // Fetch profile from Instagram
      const profile = await getInstagramUserProfile(senderId);

      if (profile.error) {
        results.api_errors++;
        // Store the error in metadata for debugging
        const updatedMetadata = {
          ...metadata,
          backfill_error: profile.error,
          backfill_attempted_at: new Date().toISOString()
        };
        await supabase
          .from("contacts")
          .update({ metadata: updatedMetadata })
          .eq("id", contact.id);
        
        results.details.push({ 
          id: contact.id, 
          name: contact.name, 
          status: "api_error",
          error: profile.error
        });
        continue;
      }

      if (!profile.username && !profile.name) {
        results.errors++;
        results.details.push({ id: contact.id, name: contact.name, status: "error - no username or name returned" });
        continue;
      }

      const handle = profile.username ? `@${String(profile.username).replace(/^@/, "")}` : null;
      const displayName = handle || profile.name || contact.name;
      const updatedMetadata = {
        ...metadata,
        username: profile.username,
        avatar_url: profile.profile_picture_url,
        profile_url: profile.username ? `https://instagram.com/${profile.username}` : null,
        backfill_source: profile.source,
        backfill_at: new Date().toISOString()
      };

      // Update contact
      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          name: displayName,
          metadata: updatedMetadata
        })
        .eq("id", contact.id);

      if (updateError) {
        results.errors++;
        results.details.push({ id: contact.id, name: contact.name, status: `error - ${updateError.message}` });
        continue;
      }

      // Update conversation subject
      const conversationSubject = profile.username 
        ? `Instagram DM with @${profile.username}` 
        : `Instagram DM with ${displayName}`;

      await supabase
        .from("conversations")
        .update({ subject: conversationSubject })
        .eq("contact_id", contact.id)
        .eq("channel", "instagram");

      results.updated++;
      results.details.push({ 
        id: contact.id, 
        name: contact.name,
        newName: displayName,
        status: `updated via ${profile.source} - @${profile.username || 'no username'}` 
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log("[Backfill] Complete:", JSON.stringify(results, null, 2));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[Backfill] Fatal error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});