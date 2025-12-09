import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const token = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");

    if (!token) {
      console.error("❌ INSTAGRAM_ACCESS_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Token not configured" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("📤 Sending IG reply to:", body.recipient);
    console.log("📝 Message length:", body.message?.length || 0);

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`;

    const payload = {
      recipient: { id: body.recipient },
      message: { text: body.message },
    };

    console.log("🔗 Request URL:", url.replace(token, "***TOKEN***"));
    console.log("📦 Payload:", JSON.stringify({ recipient: payload.recipient, message: { text: body.message?.slice(0, 50) + "..." } }));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      // Extract detailed error info from Meta API response
      const errorCode = result?.error?.code;
      const errorSubcode = result?.error?.error_subcode;
      const errorMessage = result?.error?.message;
      const errorType = result?.error?.type;
      
      console.error("❌ Meta API Error Details:");
      console.error("  - Status:", response.status);
      console.error("  - Error Type:", errorType);
      console.error("  - Error Code:", errorCode);
      console.error("  - Error Subcode:", errorSubcode);
      console.error("  - Error Message:", errorMessage);
      console.error("  - Full Response:", JSON.stringify(result));
      
      // Common error codes and what they mean
      if (errorCode === 190) {
        console.error("🔑 TOKEN EXPIRED - Need to refresh INSTAGRAM_ACCESS_TOKEN");
      } else if (errorCode === 10) {
        console.error("🔒 PERMISSION DENIED - App missing instagram_manage_messages permission");
      } else if (errorCode === 100) {
        console.error("📛 INVALID PARAMETER - Recipient ID may be invalid or user blocked the page");
      }
      
      return new Response(JSON.stringify({ 
        error: result,
        error_summary: errorMessage || "Unknown Meta API error",
        error_code: errorCode
      }), { 
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ IG reply sent successfully:", result);
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("❌ Send IG reply error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
