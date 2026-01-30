import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const wooUrl = Deno.env.get('WOO_URL') || 'https://weprintwraps.com';
    const consumerKey = Deno.env.get('WOO_CONSUMER_KEY')!;
    const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting order_total backfill...');

    // Get all orders with order_total = 0 or null
    const { data: ordersToFix, error: fetchError } = await supabase
      .from('shopflow_orders')
      .select('id, order_number, woo_order_id, order_total')
      .or('order_total.eq.0,order_total.is.null')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch orders: ${fetchError.message}`);
    }

    console.log(`📊 Found ${ordersToFix?.length || 0} orders needing backfill`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const order of ordersToFix || []) {
      try {
        // Use woo_order_id if available, otherwise use order_number
        const orderId = order.woo_order_id || order.order_number;
        
        // Fetch order directly by ID (not search)
        const wooOrderUrl = `${wooUrl}/wp-json/wc/v3/orders/${orderId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
        
        const wooResponse = await fetch(wooOrderUrl);
        
        if (!wooResponse.ok) {
          // Try searching if direct fetch fails
          const wooSearchUrl = `${wooUrl}/wp-json/wc/v3/orders?include=${orderId}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
          const searchResponse = await fetch(wooSearchUrl);
          
          if (!searchResponse.ok) {
            console.error(`WooCommerce API error for ${order.order_number}: ${searchResponse.status}`);
            results.failed++;
            results.errors.push(`${order.order_number}: WooCommerce API error`);
            continue;
          }
          
          const searchResults = await searchResponse.json();
          if (!searchResults || searchResults.length === 0) {
            console.log(`⚠️ No WooCommerce match for ${order.order_number}`);
            results.skipped++;
            continue;
          }
          
          const matchingOrder = searchResults[0];
          const orderTotal = parseFloat(matchingOrder.total || '0');
          
          if (orderTotal > 0) {
            const { error: updateError } = await supabase
              .from('shopflow_orders')
              .update({ order_total: orderTotal, updated_at: new Date().toISOString() })
              .eq('id', order.id);

            if (updateError) {
              results.failed++;
              results.errors.push(`${order.order_number}: ${updateError.message}`);
            } else {
              console.log(`✅ Updated ${order.order_number}: $${orderTotal}`);
              results.success++;
            }
          } else {
            results.skipped++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }

        const matchingOrder = await wooResponse.json();

        if (!matchingOrder) {
          console.log(`⚠️ No WooCommerce match for ${order.order_number}`);
          results.skipped++;
          continue;
        }

        const orderTotal = parseFloat(matchingOrder.total || '0');

        if (orderTotal > 0) {
          // Update ShopFlow order
          const { error: updateError } = await supabase
            .from('shopflow_orders')
            .update({ 
              order_total: orderTotal,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`Update error for ${order.order_number}:`, updateError);
            results.failed++;
            results.errors.push(`${order.order_number}: ${updateError.message}`);
          } else {
            console.log(`✅ Updated ${order.order_number}: $${orderTotal}`);
            results.success++;
          }
        } else {
          console.log(`⚠️ WooCommerce order ${order.order_number} has $0 total`);
          results.skipped++;
        }

        // Rate limiting - don't hammer WooCommerce API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (orderErr) {
        console.error(`Error processing ${order.order_number}:`, orderErr);
        results.failed++;
        results.errors.push(`${order.order_number}: ${String(orderErr)}`);
      }
    }

    console.log('📊 Backfill complete:', results);

    return new Response(
      JSON.stringify({
        message: 'Order total backfill complete',
        total_processed: ordersToFix?.length || 0,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
