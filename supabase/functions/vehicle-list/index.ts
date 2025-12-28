import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wpw-embed-secret',
};

function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const year = url.searchParams.get('year');
    const make = url.searchParams.get('make');
    const model = url.searchParams.get('model');

    console.log(`[vehicle-list] Request: type=${type}, year=${year}, make=${make}, model=${model}`);

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: type (makes, models, or years)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createSupabaseClient();

    switch (type) {
      case 'makes': {
        const yearNum = Number(year);
        if (!year || !yearNum) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameter: year' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('vehicle_dimensions')
          .select('make')
          .lte('year_start', yearNum)
          .gte('year_end', yearNum)
          .order('make');

        if (error) {
          console.error('[vehicle-list] Error fetching makes:', error);
          throw error;
        }

        // Get unique makes
        const uniqueMakes = [...new Set(data?.map(d => d.make))].filter(Boolean).sort();
        console.log(`[vehicle-list] Found ${uniqueMakes.length} makes for year ${yearNum}`);

        return new Response(
          JSON.stringify({ makes: uniqueMakes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'models': {
        const yearNum = Number(year);
        if (!year || !yearNum) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameter: year' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!make) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameter: make' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('vehicle_dimensions')
          .select('model')
          .ilike('make', make)
          .lte('year_start', yearNum)
          .gte('year_end', yearNum)
          .order('model');

        if (error) {
          console.error('[vehicle-list] Error fetching models:', error);
          throw error;
        }

        // Get unique models
        const uniqueModels = [...new Set(data?.map(d => d.model))].filter(Boolean).sort();
        console.log(`[vehicle-list] Found ${uniqueModels.length} models for ${yearNum} ${make}`);

        return new Response(
          JSON.stringify({ models: uniqueModels }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'years': {
        if (!make || !model) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters: make and model' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('vehicle_dimensions')
          .select('year_start, year_end')
          .ilike('make', make)
          .ilike('model', model);

        if (error) {
          console.error('[vehicle-list] Error fetching years:', error);
          throw error;
        }

        // Expand year ranges into individual years
        const yearsSet = new Set<number>();
        const currentYear = new Date().getFullYear();

        data?.forEach(record => {
          const startYear = record.year_start || currentYear;
          const endYear = record.year_end || currentYear;
          
          for (let year = startYear; year <= endYear; year++) {
            yearsSet.add(year);
          }
        });

        // Sort years descending (newest first)
        const years = Array.from(yearsSet).sort((a, b) => b - a);
        console.log(`[vehicle-list] Found ${years.length} years for ${make} ${model}`);

        return new Response(
          JSON.stringify({ years }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type parameter. Use: makes, models, or years' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[vehicle-list] Internal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
