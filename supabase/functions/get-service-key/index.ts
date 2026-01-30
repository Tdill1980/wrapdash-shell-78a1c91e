import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wpw-embed-secret",
};

/**
 * get-service-key
 * 
 * Returns the service role key for the external Wrap Quote Tool to connect
 * to the WrapCommandAI database. Requires valid WPW_EMBED_SECRET for auth.
 * 
 * This allows the external CommercialPro/Quote Tool project to read/write
 * to the main WrapCommandAI database (wzwqhfbmymrengjqikjl) without
 * managing its own Supabase project.
 */
serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate embed secret
    const embedSecret = req.headers.get("x-wpw-embed-secret");
    const expectedSecret = Deno.env.get("WPW_EMBED_SECRET");

    if (!embedSecret || embedSecret !== expectedSecret) {
      console.error("[get-service-key] Invalid or missing x-wpw-embed-secret header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the service key (this is the key the external tool needs)
    const serviceKey = Deno.env.get("EXTERNAL_QUOTE_DB_SERVICE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceKey) {
      console.error("[get-service-key] EXTERNAL_QUOTE_DB_SERVICE_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Service key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[get-service-key] Successfully returning service key configuration");

    // Return the connection details for the external tool
    return new Response(
      JSON.stringify({
        success: true,
        config: {
          supabase_url: supabaseUrl,
          service_role_key: serviceKey,
          project_id: "wzwqhfbmymrengjqikjl",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("[get-service-key] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
