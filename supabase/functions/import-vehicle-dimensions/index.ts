import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKET_NAME = "seed-data";
const CSV_PATH = "vehicle_dimensions.csv";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Vehicle dimensions import started…");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch CSV from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(CSV_PATH);

    if (fileError || !fileData) {
      console.error("❌ CSV not found in storage:", fileError);
      return new Response(
        JSON.stringify({ error: "CSV not found in Storage bucket. Upload vehicle_dimensions.csv to seed-data bucket." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📄 CSV file downloaded. Parsing…");

    // Parse CSV manually (Deno CSV module can be flaky)
    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Skip header row
    const dataRows = lines.slice(1);
    console.log(`📦 ${dataRows.length} vehicle rows found.`);

    // Parse rows into objects
    const vehicles = dataRows.map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        make: cols[0] || null,
        model: cols[1] || null,
        year_start: cols[2] ? parseInt(cols[2]) : null,
        year_end: cols[3] ? parseInt(cols[3]) : null,
        side_width: cols[4] ? parseFloat(cols[4]) : null,
        side_height: cols[5] ? parseFloat(cols[5]) : null,
        side_sqft: cols[6] ? parseFloat(cols[6]) : null,
        back_width: cols[7] ? parseFloat(cols[7]) : null,
        back_height: cols[8] ? parseFloat(cols[8]) : null,
        back_sqft: cols[9] ? parseFloat(cols[9]) : null,
        hood_width: cols[10] ? parseFloat(cols[10]) : null,
        hood_length: cols[11] ? parseFloat(cols[11]) : null,
        hood_sqft: cols[12] ? parseFloat(cols[12]) : null,
        roof_width: cols[13] ? parseFloat(cols[13]) : null,
        roof_length: cols[14] ? parseFloat(cols[14]) : null,
        roof_sqft: cols[15] ? parseFloat(cols[15]) : null,
        total_sqft: cols[16] ? parseFloat(cols[16]) : null,
        corrected_sqft: cols[17] ? parseFloat(cols[17]) : 0,
      };
    }).filter(v => v.make && v.model && v.corrected_sqft);

    console.log(`✅ ${vehicles.length} valid vehicles parsed.`);

    // Batch insert
    const batchSize = 200;
    let insertedCount = 0;

    for (let i = 0; i < vehicles.length; i += batchSize) {
      const chunk = vehicles.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from("vehicle_dimensions")
        .insert(chunk);

      if (insertError) {
        console.error(`❌ Insert error at batch ${Math.floor(i / batchSize) + 1}:`, insertError);
        return new Response(
          JSON.stringify({ error: insertError.message, batch: Math.floor(i / batchSize) + 1, insertedSoFar: insertedCount }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      insertedCount += chunk.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted (${insertedCount}/${vehicles.length})`);
    }

    console.log("🎉 All vehicle data imported successfully!");

    return new Response(
      JSON.stringify({ success: true, imported: insertedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("🔥 Seeder crashed:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
