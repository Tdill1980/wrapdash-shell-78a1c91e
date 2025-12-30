import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Load access token from database (preferred) or fallback to secret
async function getAccessToken(supabase: any): Promise<{ token: string; source: string }> {
  // Try to load from database first (new OAuth model)
  const { data: tokenRecord } = await supabase
    .from("instagram_tokens")
    .select("page_access_token, access_token, expires_at, page_name")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenRecord?.page_access_token) {
    console.log(`🔑 Using page_access_token from database: ${tokenRecord.page_name || 'page'}`);
    return { token: tokenRecord.page_access_token, source: `DB (${tokenRecord.page_name || 'page'})` };
  }

  if (tokenRecord?.access_token) {
    console.log(`🔑 Using legacy access_token from database`);
    return { token: tokenRecord.access_token, source: "DB (legacy access_token)" };
  }

  // Fallback to environment variable (legacy)
  const envToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
  if (envToken) {
    console.log(`🔑 Using access_token from environment variable`);
    return { token: envToken, source: "ENV (INSTAGRAM_ACCESS_TOKEN)" };
  }

  throw new Error("No Instagram access token available - please connect via Settings");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let deliveryResult = {
    success: false,
    error_code: null as number | null,
    error_message: null as string | null,
    error_type: null as string | null,
    api_response: null as any,
    latency_ms: 0
  };

  try {
    const body = await req.json();
    
    // Initialize Supabase client to load token from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Load access token from database (same as instagram-webhook)
    let token: string;
    let tokenSource: string;
    try {
      const result = await getAccessToken(supabase);
      token = result.token;
      tokenSource = result.source;
    } catch (tokenErr) {
      console.error("❌ Token loading failed:", tokenErr);
      deliveryResult.error_message = String(tokenErr);
      return new Response(JSON.stringify({ 
        error: "Token not configured",
        delivery_result: deliveryResult
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("📤 Sending IG reply to:", body.recipient);
    console.log("📝 Message length:", body.message?.length || 0);
    console.log("🔑 Token source:", tokenSource);

    // CRITICAL: For Instagram Professional accounts, use the Facebook Graph API
    // The graph.instagram.com endpoint does NOT support messaging for business accounts
    // We need to use graph.facebook.com with the Page's access token
    // 
    // The recipient ID is an Instagram-Scoped User ID (IGSID)
    // The Page Access Token is scoped to the Facebook Page linked to the Instagram account
    
    // Use Facebook Graph API (v19.0) - this is the correct endpoint for IG Professional messaging
    const url = `https://graph.facebook.com/v19.0/me/messages`;
    const payload = {
      recipient: { id: body.recipient },
      message: { text: body.message },
      messaging_type: "RESPONSE"
    };

    console.log("🔗 Request URL:", url);
    console.log("📦 Payload:", JSON.stringify({ recipient: payload.recipient, message: { text: body.message?.slice(0, 50) + "..." } }));

    const response = await fetch(`${url}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    deliveryResult.latency_ms = Date.now() - startTime;
    deliveryResult.api_response = result;
    
    if (!response.ok) {
      // Extract detailed error info from Meta API response
      const errorCode = result?.error?.code;
      const errorSubcode = result?.error?.error_subcode;
      const errorMessage = result?.error?.message;
      const errorType = result?.error?.type;
      
      deliveryResult.error_code = errorCode;
      deliveryResult.error_message = errorMessage;
      deliveryResult.error_type = errorType;
      
      console.error("❌ Meta API Error Details:");
      console.error("  - Status:", response.status);
      console.error("  - Error Type:", errorType);
      console.error("  - Error Code:", errorCode);
      console.error("  - Error Subcode:", errorSubcode);
      console.error("  - Error Message:", errorMessage);
      console.error("  - Full Response:", JSON.stringify(result));
      console.error("  - Token Source:", tokenSource);
      
      // Common error codes and what they mean
      if (errorCode === 190) {
        console.error("🔑 TOKEN EXPIRED - Need to refresh access token via Settings → Instagram");
        deliveryResult.error_message = "Token expired - reconnect Instagram in Settings";
      } else if (errorCode === 10) {
        console.error("🔒 PERMISSION DENIED - App missing instagram_manage_messages permission");
        deliveryResult.error_message = "Missing instagram_manage_messages permission";
      } else if (errorCode === 100) {
        console.error("📛 INVALID PARAMETER - Check recipient ID format");
        console.error("   The recipient ID should be an Instagram-Scoped User ID (IGSID)");
        deliveryResult.error_message = "Invalid recipient ID - may be using wrong ID format";
      } else if (errorCode === 551) {
        console.error("⏰ MESSAGING WINDOW CLOSED - User hasn't messaged in 24 hours");
        deliveryResult.error_message = "24-hour messaging window expired";
      }
      
      // Update message in database with delivery failure
      if (body.message_id) {
        await supabase
          .from("messages")
          .update({
            metadata: {
              instagram_sent: false,
              instagram_error: true,
              instagram_error_code: errorCode,
              instagram_error_message: errorMessage || "Unknown error",
              delivery_attempted_at: new Date().toISOString(),
              delivery_latency_ms: deliveryResult.latency_ms
            }
          })
          .eq("id", body.message_id);
      }
      
      // Write execution receipt for failure
      await supabase.from("execution_receipts").insert({
        conversation_id: body.conversation_id || null,
        source_table: "messages",
        source_id: body.message_id || null,
        channel: "instagram",
        action_type: "dm_send",
        status: "failed",
        provider: "meta",
        provider_receipt_id: null,
        payload_snapshot: { recipient: body.recipient, message_preview: body.message?.slice(0, 100) },
        error: deliveryResult.error_message,
      });
      console.log("📝 Execution receipt written (FAILED)");
      
      return new Response(JSON.stringify({ 
        error: result,
        error_summary: deliveryResult.error_message,
        error_code: errorCode,
        delivery_result: deliveryResult,
        help: getErrorHelp(errorCode)
      }), { 
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // SUCCESS
    deliveryResult.success = true;
    console.log("✅ IG reply sent successfully:", result);
    console.log("✅ Message ID from Meta:", result.message_id);
    console.log("✅ Latency:", deliveryResult.latency_ms, "ms");
    
    // Update message in database with delivery success
    if (body.message_id) {
      await supabase
        .from("messages")
        .update({
          metadata: {
            instagram_sent: true,
            instagram_message_id: result.message_id,
            sent_at: new Date().toISOString(),
            delivery_latency_ms: deliveryResult.latency_ms
          }
        })
        .eq("id", body.message_id);
      console.log("✅ Message", body.message_id, "marked as delivered");
    }
    
    // Write execution receipt for success
    await supabase.from("execution_receipts").insert({
      conversation_id: body.conversation_id || null,
      source_table: "messages",
      source_id: body.message_id || null,
      channel: "instagram",
      action_type: "dm_send",
      status: "sent",
      provider: "meta",
      provider_receipt_id: result.message_id,
      payload_snapshot: { recipient: body.recipient, message_preview: body.message?.slice(0, 100) },
      error: null,
    });
    console.log("📝 Execution receipt written (SENT)");
    
    return new Response(JSON.stringify({ 
      success: true, 
      result,
      delivery_result: deliveryResult 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    deliveryResult.latency_ms = Date.now() - startTime;
    deliveryResult.error_message = String(err);
    console.error("❌ Send IG reply error:", err);
    return new Response(JSON.stringify({ 
      error: String(err),
      delivery_result: deliveryResult
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function getErrorHelp(errorCode: number | null): string | null {
  switch (errorCode) {
    case 190:
      return "Go to Settings → Instagram and reconnect your account";
    case 10:
      return "Your Facebook app needs the instagram_manage_messages permission";
    case 100:
      return "The recipient ID format may be incorrect - check instagram-webhook logs";
    case 551:
      return "User must send a message first - 24-hour window has closed";
    default:
      return null;
  }
}
