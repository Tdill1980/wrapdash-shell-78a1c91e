import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Complete WPW Allowed Product IDs list
const WPW_ALLOWED_PRODUCT_IDS = [
  // Printed Wrap Films
  79,    // Avery MPI 1105 with DOL 1460Z - $5.27/sqft
  72,    // 3M IJ180Cv3 with 8518 - $5.27/sqft
  
  // Contour Cut (Install-Ready)
  108,   // Avery Contour-Cut - $6.32/sqft
  19420, // 3M Contour-Cut - $6.92/sqft
  
  // Specialty Products
  80,    // Perforated Window Vinyl 50/50 - $5.95/sqft
  58391, // FadeWraps Pre-Designed - $600-$990 based on size
  69439, // InkFusion Premium - $2,075/roll
  
  // Wrap By The Yard
  1726,  // Camo & Carbon - $95.50/yard
  39698, // Metal & Marble - $95.50/yard
  4181,  // Wicked & Wild - $95.50/yard
  42809, // Bape Camo - $95.50/yard
  52489, // Modern & Trippy - $95.50/yard
  
  // Design Services
  234,   // Custom Vehicle Wrap Design - $750
  58160, // Custom Design (Copy/Draft) - $500
  
  // Sample/Reference Products
  15192, // Pantone Color Chart - $42
  475,   // Camo & Carbon Sample Book - $26.50
  39628, // Marble & Metals Swatch Book - $26.50
  4179,  // Wicked & Wild Swatch Book - $26.50
  
  // DesignPanelPro (Print Production Packs)
  69664, // Small Print Production Pack
  69671, // Medium Print Production Pack
  69680, // Large Print Production Pack
  69686, // XLarge Print Production Pack
];

// Wrap By The Yard product IDs (for special handling)
const WBTY_PRODUCT_IDS = [1726, 39698, 4181, 42809, 52489];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, quantity = 1, variation_id = null, meta_data = null } = await req.json();
    
    console.log('Add to cart request:', { product_id, quantity, variation_id, meta_data });

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
    const wooUrl = 'https://weprintwraps.com';
    const consumerKey = Deno.env.get('WOO_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      throw new Error('WooCommerce credentials not configured');
    }

    // Build cart payload
    const cartPayload: Record<string, unknown> = {
      product_id,
      quantity,
    };

    // Handle variation_id for WBTY and FadeWraps
    if (variation_id) {
      cartPayload.variation_id = variation_id;
    }

    // Add meta data for specialty products (FadeWrap add-ons, etc.)
    if (meta_data && Array.isArray(meta_data)) {
      cartPayload.meta_data = meta_data;
    }

    // Forward to WooCommerce cart API
    const wooResponse = await fetch(`${wooUrl}/wp-json/wc/v3/cart/add-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
      },
      body: JSON.stringify(cartPayload),
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
