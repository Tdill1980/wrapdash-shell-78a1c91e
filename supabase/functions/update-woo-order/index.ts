import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumber, metaData, orderNote } = await req.json();
    
    const WOO_CONSUMER_KEY = Deno.env.get('WOO_CONSUMER_KEY');
    const WOO_CONSUMER_SECRET = Deno.env.get('WOO_CONSUMER_SECRET');
    
    if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
      throw new Error('WooCommerce credentials not configured');
    }

    // Create Basic Auth header
    const credentials = btoa(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`);
    
    const updatePayload: any = {
      meta_data: Object.entries(metaData).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      }))
    };

    if (orderNote) {
      updatePayload.customer_note = orderNote;
    }

    console.log('Updating WooCommerce order:', orderNumber);

    const response = await fetch(
      `https://weprintwraps.com/wp-json/wc/v3/orders/${orderNumber}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, errorText);
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('WooCommerce order updated successfully');

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-woo-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
