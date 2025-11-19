import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WPW_ALLOWED_PRODUCT_IDS = [
  58391, 19420, 72, 108, 79, 234, 58160,
  15192, 80, 475, 39628, 4179,
  42809, 1726, 39698, 52489, 69439
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, quantity = 1, variation_id = null } = await req.json();
    
    console.log('Add to cart request:', { product_id, quantity, variation_id });

    // Server-side validation: Block non-WPW products
    if (!WPW_ALLOWED_PRODUCT_IDS.includes(Number(product_id))) {
      console.error('Blocked non-WPW product:', product_id);
      return new Response(
        JSON.stringify({
          error: "This product cannot be added to cart (Quote Only)."
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get WooCommerce credentials
    const wooUrl = Deno.env.get('VITE_SUPABASE_URL')?.replace('supabase.co', 'weprintwraps.com') || 'https://weprintwraps.com';
    const consumerKey = Deno.env.get('WOO_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      throw new Error('WooCommerce credentials not configured');
    }

    // Forward to WooCommerce cart API
    const wooResponse = await fetch(`${wooUrl}/wp-json/wc/v3/cart/add-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
      },
      body: JSON.stringify({
        product_id,
        quantity,
        variation_id,
      }),
    });

    if (!wooResponse.ok) {
      const errorText = await wooResponse.text();
      console.error('WooCommerce error:', errorText);
      throw new Error(`WooCommerce API error: ${wooResponse.status}`);
    }

    const cartData = await wooResponse.json();
    console.log('Successfully added to cart:', cartData);

    return new Response(
      JSON.stringify({ success: true, cart: cartData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in add-to-woo-cart:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
