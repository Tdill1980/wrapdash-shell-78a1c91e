import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wpw-embed-secret",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate embed secret
    const embedSecret = req.headers.get("x-wpw-embed-secret");
    const expectedSecret = Deno.env.get("WPW_EMBED_SECRET");
    
    if (!embedSecret || embedSecret !== expectedSecret) {
      console.error("Invalid or missing x-wpw-embed-secret header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get quote_id from query params
    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quote_id");
    const quoteNumber = url.searchParams.get("quote_number");

    if (!quoteId && !quoteNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing quote_id or quote_number parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase.from('quotes').select(`
      id,
      quote_number,
      customer_name,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      category,
      dimensions,
      sqft,
      product_name,
      total_price,
      status,
      created_at
    `);

    if (quoteId) {
      query = query.eq('id', quoteId);
    } else if (quoteNumber) {
      query = query.eq('quote_number', quoteNumber);
    }

    const { data: quote, error } = await query.maybeSingle();

    if (error) {
      console.error("Error fetching quote:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch quote" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!quote) {
      return new Response(
        JSON.stringify({ success: false, error: "Quote not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Return read-only quote data (exclude internal fields like margin, notes, conversion status)
    const response = {
      success: true,
      quote: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
        customer_name: quote.customer_name,
        vehicle: {
          year: quote.vehicle_year,
          make: quote.vehicle_make,
          model: quote.vehicle_model,
        },
        category: quote.category,
        dimensions: quote.dimensions,
        sqft: quote.sqft,
        product_name: quote.product_name,
        estimated_price: quote.total_price,
        status: quote.status,
        created_at: quote.created_at,
      },
    };

    console.log("Returning quote:", quote.quote_number);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in get-quote:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
