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

  try {
    const { short_lived_token, organization_id, instagram_username } = await req.json();

    if (!short_lived_token) {
      throw new Error("short_lived_token is required");
    }

    const appId = Deno.env.get("INSTAGRAM_APP_ID");
    const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET");

    if (!appId || !appSecret) {
      throw new Error("INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be configured");
    }

    console.log("🔄 Exchanging short-lived token for long-lived token...");

    // Exchange for long-lived token
    const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${short_lived_token}`;

    const response = await fetch(exchangeUrl);
    const result = await response.json();

    if (!response.ok || result.error) {
      console.error("❌ Meta API error:", result.error?.message || result);
      throw new Error(result.error?.message || "Failed to exchange token");
    }

    console.log("✅ Long-lived token received");

    // Calculate expiry (Meta returns expires_in in seconds, typically 5184000 = 60 days)
    const expiresIn = result.expires_in || 5184000;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tokenData, error: insertError } = await supabase
      .from("instagram_tokens")
      .upsert({
        organization_id: organization_id || null,
        access_token: result.access_token,
        expires_at: expiresAt.toISOString(),
        token_type: "long_lived",
        instagram_username: instagram_username || null,
        last_refreshed_at: new Date().toISOString(),
      }, {
        onConflict: "organization_id",
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Database error:", insertError);
      // Still return success since we got the token
    } else {
      console.log("✅ Token stored in database");
    }

    return new Response(JSON.stringify({
      success: true,
      access_token: result.access_token,
      expires_at: expiresAt.toISOString(),
      expires_in_days: Math.round(expiresIn / 86400),
      stored_in_db: !insertError,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Token exchange error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
