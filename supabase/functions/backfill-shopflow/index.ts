// Backfill ShopFlow orders from WooCommerce
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
    const wooUrl = Deno.env.get('WOO_URL') || 'https://weprintwraps.com';
    const consumerKey = Deno.env.get('WOO_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET');
    const syncUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/sync-wc-shopflow';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const { days = 3, status = 'processing,completed' } = await req.json().catch(() => ({}));

    console.log(`🔄 Backfilling ShopFlow orders from last ${days} days...`);

    // Calculate date range
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - days);
    const afterStr = afterDate.toISOString();

    // Fetch recent orders from WooCommerce
    const ordersUrl = `${wooUrl}/wp-json/wc/v3/orders?per_page=100&status=${status}&after=${afterStr}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    console.log('Fetching orders after:', afterStr);
    
    const ordersRes = await fetch(ordersUrl);
    if (!ordersRes.ok) {
      const text = await ordersRes.text();
      return new Response(JSON.stringify({ error: 'WooCommerce API error', status: ordersRes.status, body: text }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const orders = await ordersRes.json();
    console.log(`Found ${orders.length} orders to sync`);

    const results: any[] = [];
    let synced = 0;
    let failed = 0;

    // Sync each order
    for (const order of orders) {
      try {
        console.log(`Syncing order #${order.id}...`);
        
        const syncRes = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify(order)
        });

        const syncResult = await syncRes.json();
        
        if (syncRes.ok) {
          synced++;
          results.push({ order: order.id, status: 'synced', result: syncResult });
        } else {
          failed++;
          results.push({ order: order.id, status: 'failed', error: syncResult });
        }
      } catch (err) {
        failed++;
        results.push({ order: order.id, status: 'error', error: String(err) });
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      daysBackfilled: days,
      ordersFound: orders.length,
      synced,
      failed,
      results
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
