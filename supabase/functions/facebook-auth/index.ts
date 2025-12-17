import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { shortLivedToken, organizationId } = await req.json();

    if (!shortLivedToken) {
      return new Response(JSON.stringify({ error: "Missing shortLivedToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use existing secrets (INSTAGRAM_APP_ID/SECRET are the same as Facebook)
    const APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
    const APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

    console.log("🔐 Facebook Auth - Starting token exchange...");
    console.log("  Organization ID:", organizationId || "default");

    // Step 1: Exchange short-lived → 60-day long-lived USER token
    console.log("📤 Step 1: Exchanging for 60-day user token...");
    const tokenUrl = `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("❌ Token exchange failed:", tokenData.error?.message || tokenData);
      throw new Error(tokenData.error?.message || "Failed to exchange token");
    }

    const longLivedUserToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // ~60 days default
    const userTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log("✅ Got 60-day user token, expires:", userTokenExpiresAt.toISOString());

    // Step 2: Get Facebook Pages (and their access tokens)
    console.log("📤 Step 2: Fetching connected Pages...");
    const pagesRes = await fetch("https://graph.facebook.com/v24.0/me/accounts?fields=id,name,access_token,instagram_business_account", {
      headers: { Authorization: `Bearer ${longLivedUserToken}` },
    });
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || pagesData.error) {
      console.error("❌ Failed to fetch pages:", pagesData.error?.message || pagesData);
      throw new Error(pagesData.error?.message || "Failed to fetch pages");
    }

    console.log(`📋 Found ${pagesData.data?.length || 0} connected page(s)`);

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook Pages found. Make sure your app has access to at least one Page.");
    }

    // Use the first page (or could let user select)
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;
    const instagramBusinessAccountId = page.instagram_business_account?.id;

    console.log("✅ Using Page:", pageName, "(ID:", pageId, ")");
    console.log("  Instagram Business Account:", instagramBusinessAccountId || "Not linked");

    // Step 3: Get Instagram Business Account details if linked
    let instagramUserId = null;
    let instagramUsername = null;

    if (instagramBusinessAccountId) {
      console.log("📤 Step 3: Fetching Instagram account details...");
      const igRes = await fetch(`https://graph.facebook.com/v24.0/${instagramBusinessAccountId}?fields=id,username`, {
        headers: { Authorization: `Bearer ${pageAccessToken}` },
      });
      const igData = await igRes.json();
      
      if (igRes.ok && !igData.error) {
        instagramUserId = igData.id;
        instagramUsername = igData.username;
        console.log("✅ Instagram account:", instagramUsername, "(ID:", instagramUserId, ")");
      } else {
        console.warn("⚠️ Could not fetch Instagram details:", igData.error?.message);
      }
    }

    // Step 4: Store tokens in database
    console.log("💾 Step 4: Storing tokens in database...");
    
    const tokenRecord = {
      organization_id: organizationId || null,
      user_access_token: longLivedUserToken,
      page_access_token: pageAccessToken,
      access_token: pageAccessToken, // Keep backward compatibility
      page_id: pageId,
      page_name: pageName,
      instagram_user_id: instagramUserId,
      instagram_username: instagramUsername,
      expires_at: userTokenExpiresAt.toISOString(),
      last_refreshed_at: new Date().toISOString(),
    };

    // Upsert by organization_id (or create new if none exists)
    const { data: existingToken } = await supabase
      .from("instagram_tokens")
      .select("id")
      .eq("organization_id", organizationId || "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    let dbResult;
    if (existingToken) {
      dbResult = await supabase
        .from("instagram_tokens")
        .update(tokenRecord)
        .eq("id", existingToken.id);
    } else {
      dbResult = await supabase
        .from("instagram_tokens")
        .insert(tokenRecord);
    }

    if (dbResult.error) {
      console.error("❌ Database error:", dbResult.error);
      // Don't fail - tokens are still valid, just not persisted
    } else {
      console.log("✅ Tokens saved to database");
    }

    // Return success response
    const response = {
      success: true,
      user_token_expires_at: userTokenExpiresAt.toISOString(),
      page_id: pageId,
      page_name: pageName,
      instagram_user_id: instagramUserId,
      instagram_username: instagramUsername,
      message: `Connected to ${pageName}${instagramUsername ? ` (@${instagramUsername})` : ""}`,
    };

    console.log("🎉 Facebook Auth complete!");
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Facebook Auth error:", err);
    return new Response(JSON.stringify({ 
      error: String(err), 
      message: "Failed to connect Facebook/Instagram. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
