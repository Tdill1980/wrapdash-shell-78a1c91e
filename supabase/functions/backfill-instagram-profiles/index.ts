import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN") || "";

async function getInstagramUserProfile(igUserId: string) {
  try {
    const url = `https://graph.facebook.com/v18.0/${igUserId}?fields=username,name,profile_picture_url&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    console.log(`Fetching IG profile for user: ${igUserId}`);
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`IG API error (${res.status}):`, errorText);
      return null;
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
    return null;
  }
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

    // Get all Instagram contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("source", "instagram");

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    console.log(`Found ${contacts?.length || 0} Instagram contacts to backfill`);

    const results = {
      total: contacts?.length || 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ id: string; name: string; status: string }>
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

      if (!profile || (!profile.username && !profile.name)) {
        results.errors++;
        results.details.push({ id: contact.id, name: contact.name, status: "error - could not fetch profile" });
        continue;
      }

      const displayName = profile.name || profile.username || contact.name;
      const updatedMetadata = {
        ...metadata,
        username: profile.username,
        avatar_url: profile.profile_picture_url,
        profile_url: profile.username ? `https://instagram.com/${profile.username}` : null
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
        name: displayName, 
        status: `updated - @${profile.username || 'no username'}` 
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("Backfill complete:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Backfill error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
