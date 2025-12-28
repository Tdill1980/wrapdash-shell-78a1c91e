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
    const { year } = await req.json();
    if (!year) {
      return new Response(
        JSON.stringify({ error: "Year is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[vehicle-makes] Looking up makes for year: ${year}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("make")
      .lte("year_start", year)
      .gte("year_end", year);

    if (error) throw error;

    const makes = [...new Set(data?.map((r) => r.make) || [])].sort();
    console.log(`[vehicle-makes] Found ${makes.length} makes for year ${year}`);

    return new Response(
      JSON.stringify({ makes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[vehicle-makes] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
