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

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: body.recipient },
        message: { text: body.message },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("❌ Meta API error:", result);
      return new Response(JSON.stringify({ error: result }), { 
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
