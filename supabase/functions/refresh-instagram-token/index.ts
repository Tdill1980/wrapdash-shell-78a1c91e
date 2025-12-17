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
    const body = await req.json().catch(() => ({}));
    const { force = false, token_id } = body;

    console.log("🔄 Instagram Token Refresh - Starting...");
    console.log("  Force refresh:", force);

    const APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
    const APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

    // Get tokens that need refreshing (expire within 7 days or forced)
    let query = supabase
      .from("instagram_tokens")
      .select("*");

    if (token_id) {
      query = query.eq("id", token_id);
    } else if (!force) {
      // Only get tokens expiring within 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query = query.lt("expires_at", sevenDaysFromNow.toISOString());
    }

    const { data: tokens, error: fetchError } = await query;

    if (fetchError) {
      console.error("❌ Error fetching tokens:", fetchError);
      throw fetchError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("✅ No tokens need refreshing");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No tokens need refreshing",
        refreshed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`📋 Found ${tokens.length} token(s) to refresh`);

    const results = [];

    for (const token of tokens) {
      console.log(`\n🔑 Refreshing token for org: ${token.organization_id}`);
      console.log(`  Current expiry: ${token.expires_at}`);

      try {
        // Use user_access_token if available (new model), otherwise fall back to access_token (legacy)
        const tokenToRefresh = token.user_access_token || token.access_token;
        
        if (!tokenToRefresh) {
          console.error("  ❌ No token to refresh");
          results.push({
            token_id: token.id,
            success: false,
            error: "No token available to refresh"
          });
          continue;
        }

        // Step 1: Refresh the USER token (60-day extension)
        console.log("  📤 Refreshing user token...");
        const refreshUrl = `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenToRefresh}`;

        const response = await fetch(refreshUrl);
        const result = await response.json();

        if (!response.ok || result.error) {
          console.error("  ❌ Token refresh failed:", result.error?.message || result);
          results.push({
            token_id: token.id,
            success: false,
            error: result.error?.message || "Token refresh failed"
          });
          continue;
        }

        const newUserToken = result.access_token;
        const expiresIn = result.expires_in || 5184000;
        const newExpiry = new Date(Date.now() + expiresIn * 1000);

        console.log(`  ✅ New user token received, expires: ${newExpiry.toISOString()}`);

        // Step 2: Re-derive Page Access Token
        console.log("  📤 Re-fetching page token...");
        const pagesRes = await fetch("https://graph.facebook.com/v24.0/me/accounts?fields=id,name,access_token,instagram_business_account", {
          headers: { Authorization: `Bearer ${newUserToken}` },
        });
        const pagesData = await pagesRes.json();

        let newPageToken = null;
        let pageId = token.page_id;
        let pageName = token.page_name;

        if (pagesRes.ok && pagesData.data && pagesData.data.length > 0) {
          // Find the same page by ID, or use first page
          const page = pagesData.data.find((p: any) => p.id === token.page_id) || pagesData.data[0];
          newPageToken = page.access_token;
          pageId = page.id;
          pageName = page.name;
          console.log(`  ✅ Page token refreshed for: ${pageName}`);
        } else {
          console.warn("  ⚠️ Could not refresh page token, keeping existing");
          newPageToken = token.page_access_token || token.access_token;
        }

        // Step 3: Update tokens in database
        const updateData: any = {
          user_access_token: newUserToken,
          expires_at: newExpiry.toISOString(),
          last_refreshed_at: new Date().toISOString(),
        };

        if (newPageToken) {
          updateData.page_access_token = newPageToken;
          updateData.access_token = newPageToken; // Keep backward compatibility
        }
        if (pageId) updateData.page_id = pageId;
        if (pageName) updateData.page_name = pageName;

        const { error: updateError } = await supabase
          .from("instagram_tokens")
          .update(updateData)
          .eq("id", token.id);

        if (updateError) {
          console.error("  ❌ Database update error:", updateError);
          results.push({
            token_id: token.id,
            success: false,
            error: "Failed to save refreshed token"
          });
          continue;
        }

        console.log("  ✅ Token saved to database");
        results.push({
          token_id: token.id,
          success: true,
          new_expiry: newExpiry.toISOString(),
          page_name: pageName
        });

      } catch (tokenError) {
        console.error(`  ❌ Error refreshing token ${token.id}:`, tokenError);
        results.push({
          token_id: token.id,
          success: false,
          error: String(tokenError)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Refresh complete: ${successCount}/${tokens.length} successful`);

    return new Response(JSON.stringify({
      success: true,
      refreshed: successCount,
      total: tokens.length,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ Token refresh error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
