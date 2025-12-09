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
        // Call Meta's token refresh endpoint
        const refreshUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get("INSTAGRAM_APP_ID")}&client_secret=${Deno.env.get("INSTAGRAM_APP_SECRET")}&fb_exchange_token=${token.access_token}`;

        console.log("  Calling Meta refresh endpoint...");

        const response = await fetch(refreshUrl);
        const result = await response.json();

        if (!response.ok || result.error) {
          console.error("  ❌ Meta API error:", result.error?.message || result);
          results.push({
            token_id: token.id,
            success: false,
            error: result.error?.message || "Unknown error"
          });
          continue;
        }

        // Calculate new expiry (Meta returns expires_in in seconds)
        const expiresIn = result.expires_in || 5184000; // Default 60 days
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + expiresIn);

        console.log(`  ✅ New token received, expires: ${newExpiry.toISOString()}`);

        // Update token in database
        const { error: updateError } = await supabase
          .from("instagram_tokens")
          .update({
            access_token: result.access_token,
            expires_at: newExpiry.toISOString(),
            last_refreshed_at: new Date().toISOString()
          })
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
          new_expiry: newExpiry.toISOString()
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
