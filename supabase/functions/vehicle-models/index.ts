import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wpw-embed-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, make } = await req.json();
    if (!year || !make) {
      return new Response(
        JSON.stringify({ error: "Year and make are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[vehicle-models] Looking up models for ${year} ${make}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("model")
      .eq("make", make)
      .lte("year_start", year)
      .gte("year_end", year);

    if (error) throw error;

    const models = [...new Set(data?.map((r) => r.model) || [])].sort();
    console.log(`[vehicle-models] Found ${models.length} models for ${year} ${make}`);

    return new Response(
      JSON.stringify({ models }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[vehicle-models] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
