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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("vehicle_dimensions")
      .select("year_start, year_end");

    if (error) throw error;

    const allYears = new Set<number>();
    for (const row of data || []) {
      for (let y = row.year_start; y <= row.year_end; y++) {
        allYears.add(y);
      }
    }

    const years = [...allYears].sort((a, b) => b - a);
    console.log(`[vehicle-years] Returning ${years.length} years`);

    return new Response(
      JSON.stringify({ years }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[vehicle-years] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
