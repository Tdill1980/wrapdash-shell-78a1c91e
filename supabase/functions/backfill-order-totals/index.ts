import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const wooKey = Deno.env.get('WOO_CONSUMER_KEY');
    const wooSecret = Deno.env.get('WOO_CONSUMER_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!wooKey || !wooSecret) {
      throw new Error('WooCommerce credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all orders with order_total = 0 or null
    const { data: orders, error: fetchError } = await supabase
      .from('shopflow_orders')
      .select('id, order_number, woo_order_id, order_total')
      .or('order_total.eq.0,order_total.is.null')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch orders: ${fetchError.message}`);
    }

    console.log(`Found ${orders?.length || 0} orders to backfill`);

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each order
    for (const order of orders || []) {
      try {
        // Try to get WooCommerce order by woo_order_id first, then by order_number
        const searchId = order.woo_order_id || order.order_number;
        
        if (!searchId) {
          console.log(`Order ${order.id} has no woo_order_id or order_number, skipping`);
          continue;
        }

        // Fetch order from WooCommerce
        const wooUrl = `https://weprintwraps.com/wp-json/wc/v3/orders/${searchId}`;
        const auth = btoa(`${wooKey}:${wooSecret}`);
        
        const wooResponse = await fetch(wooUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!wooResponse.ok) {
          // Try searching by order number if direct ID failed
          const searchUrl = `https://weprintwraps.com/wp-json/wc/v3/orders?search=${order.order_number}`;
          const searchResponse = await fetch(searchUrl, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          });

          if (!searchResponse.ok) {
            console.log(`Order ${order.order_number}: WooCommerce API error, skipping`);
            failed++;
            continue;
          }

          const searchResults = await searchResponse.json();
          if (!searchResults || searchResults.length === 0) {
            console.log(`Order ${order.order_number}: Not found in WooCommerce`);
            failed++;
            continue;
          }

          const wooOrder = searchResults[0];
          const orderTotal = parseFloat(wooOrder.total) || 0;

          // Update the order
          const { error: updateError } = await supabase
            .from('shopflow_orders')
            .update({ 
              order_total: orderTotal,
              woo_order_id: wooOrder.id 
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Failed to update order ${order.order_number}:`, updateError);
            failed++;
            errors.push(`${order.order_number}: ${updateError.message}`);
          } else {
            console.log(`Updated order ${order.order_number}: $${orderTotal}`);
            updated++;
          }
        } else {
          const wooOrder = await wooResponse.json();
          const orderTotal = parseFloat(wooOrder.total) || 0;

          // Update the order
          const { error: updateError } = await supabase
            .from('shopflow_orders')
            .update({ 
              order_total: orderTotal,
              woo_order_id: wooOrder.id 
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Failed to update order ${order.order_number}:`, updateError);
            failed++;
            errors.push(`${order.order_number}: ${updateError.message}`);
          } else {
            console.log(`Updated order ${order.order_number}: $${orderTotal}`);
            updated++;
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (orderError: unknown) {
        const errMsg = orderError instanceof Error ? orderError.message : String(orderError);
        console.error(`Error processing order ${order.order_number}:`, orderError);
        failed++;
        errors.push(`${order.order_number}: ${errMsg}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_orders: orders?.length || 0,
      updated,
      failed,
      errors: errors.slice(0, 10) // Only return first 10 errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errMsg
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
