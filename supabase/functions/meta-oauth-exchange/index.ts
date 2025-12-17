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
    const { code, redirectUri, organizationId } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: "Missing authorization code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
    const APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

    console.log("🔐 Meta OAuth Exchange - Starting...");

    // Step 1: Exchange authorization code for short-lived access token
    console.log("📤 Step 1: Exchanging code for short-lived token...");
    const tokenUrl = `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${APP_SECRET}&code=${code}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("❌ Code exchange failed:", tokenData.error?.message || tokenData);
      throw new Error(tokenData.error?.message || "Failed to exchange authorization code");
    }

    const shortLivedToken = tokenData.access_token;
    console.log("✅ Got short-lived token");

    // Step 2: Exchange short-lived → 60-day long-lived USER token
    console.log("📤 Step 2: Exchanging for 60-day user token...");
    const longTokenUrl = `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
    
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();

    if (!longTokenRes.ok || longTokenData.error) {
      console.error("❌ Long-lived token exchange failed:", longTokenData.error?.message || longTokenData);
      throw new Error(longTokenData.error?.message || "Failed to get long-lived token");
    }

    const longLivedUserToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in || 5184000; // ~60 days default
    const userTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log("✅ Got 60-day user token, expires:", userTokenExpiresAt.toISOString());

    // Step 3: Get Facebook Pages (and their access tokens)
    console.log("📤 Step 3: Fetching connected Pages...");
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

    // Step 4: Get Instagram Business Account details if linked
    let instagramUserId = null;
    let instagramUsername = null;

    if (instagramBusinessAccountId) {
      console.log("📤 Step 4: Fetching Instagram account details...");
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

    // Step 5: Store tokens in database
    console.log("💾 Step 5: Storing tokens in database...");
    
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

    // Upsert - delete existing tokens first, then insert new
    await supabase
      .from("instagram_tokens")
      .delete()
      .not("id", "is", null); // Delete all existing tokens

    const { error: insertError } = await supabase
      .from("instagram_tokens")
      .insert(tokenRecord);

    if (insertError) {
      console.error("❌ Database error:", insertError);
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

    console.log("🎉 Meta OAuth Exchange complete!");
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Meta OAuth Exchange error:", err);
    return new Response(JSON.stringify({ 
      error: String(err), 
      message: "Failed to connect Facebook/Instagram. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
