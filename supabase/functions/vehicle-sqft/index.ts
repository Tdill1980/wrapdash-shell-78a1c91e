// MightyCommandAI Vehicle SqFt API
// Single authoritative endpoint for vehicle square footage lookups
// Used by: external embeds, quote tools, Jordan, Luigi

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getVehicleSqFt, createSupabaseClient } from "../_shared/mighty-vehicle-sqft.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wpw-embed-secret",
};

interface VehicleSqFtRequest {
  year: number | string;
  make: string;
  model: string;
  category?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Validate embed secret (optional but recommended for external calls)
    const embedSecret = req.headers.get("x-wpw-embed-secret");
    const expectedSecret = Deno.env.get("WPW_EMBED_SECRET");
    
    // Allow requests with valid secret OR internal calls (no secret required for internal)
    const isAuthorized = !expectedSecret || embedSecret === expectedSecret || embedSecret === null;
    
    if (expectedSecret && embedSecret && embedSecret !== expectedSecret) {
      console.error("[vehicle-sqft] Invalid x-wpw-embed-secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const body: VehicleSqFtRequest = await req.json();
    const { year, make, model, category } = body;

    // Validate required fields
    if (!year || !make || !model) {
      console.error("[vehicle-sqft] Missing required fields:", { year, make, model });
      return new Response(
        JSON.stringify({ 
          error: "Missing vehicle info",
          required: ["year", "make", "model"],
          received: { year: !!year, make: !!make, model: !!model }
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Get authoritative sqft from MightyCommandAI engine
    const result = await getVehicleSqFt(supabase, year, make, model, category);

    console.log(`[vehicle-sqft] ${year} ${make} ${model} → ${result.sqft} sqft (source: ${result.source})`);

    // Return result
    return new Response(
      JSON.stringify({
        year: typeof year === 'string' ? parseInt(year, 10) : year,
        make,
        model,
        sqft: result.sqft,
        panels: result.panels || null,
        source: result.source,
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (err) {
    console.error("[vehicle-sqft] Error:", err);
    return new Response(
      JSON.stringify({ 
        error: "Internal error",
        message: err instanceof Error ? err.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
