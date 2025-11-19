import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { target = 'both', days = 7 } = await req.json();
    console.log(`Manual sync requested for: ${target}, last ${days} days`);

    const wooKey = Deno.env.get('WOO_CONSUMER_KEY');
    const wooSecret = Deno.env.get('WOO_CONSUMER_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!wooKey || !wooSecret) {
      throw new Error('WooCommerce credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date for filtering
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - days);
    const afterISO = afterDate.toISOString();

    // Fetch orders from WooCommerce using proper base64 encoding for Deno
    const credentials = `${wooKey}:${wooSecret}`;
    const base64Credentials = btoa(credentials);
    const authHeader = `Basic ${base64Credentials}`;
    const wooUrl = `https://weprintwraps.com/wp-json/wc/v3/orders?per_page=50&orderby=date&order=desc&after=${afterISO}`;
    
    console.log('Fetching from WooCommerce...');
    console.log('Using auth with key ending in:', wooKey.slice(-4));
    
    const wooResponse = await fetch(wooUrl, {
      headers: { 
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!wooResponse.ok) {
      throw new Error(`WooCommerce API error: ${wooResponse.statusText}`);
    }

    const orders = await wooResponse.json();
    console.log(`Fetched ${orders.length} orders from WooCommerce`);

    let syncedShopFlow = 0;
    let syncedApproveFlow = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Status mapping for ShopFlow
    const shopflowStatusMap: Record<string, string> = {
      'in-design': 'design_requested',
      'lance': 'design_requested',
      'manny': 'design_requested',
      'design-complete': 'ready_for_print',
      'print-production': 'in_production',
      'processing': 'in_production',
      'work-order-printed': 'in_production',
      'add-on': 'in_production',
      'file-error': 'awaiting_feedback',
      'missing-file': 'awaiting_feedback',
      'waiting-on-email-response': 'awaiting_feedback',
      'dropbox-link-sent': 'awaiting_feedback',
    };

    const excludedStatuses = ['on-hold', 'shipped', 'refunded', 'failed', 'pending-payment', 'shipping-cost', 'credit'];

    for (const order of orders) {
      try {
        const orderNumber = order.number.toString();
        const customerName = `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Unknown Customer';
        const productType = order.line_items?.[0]?.name || 'Unknown Product';
        const wooStatus = order.status;

        // Sync to ShopFlow
        if ((target === 'shopflow' || target === 'both') && !excludedStatuses.includes(wooStatus)) {
          const mappedStatus = shopflowStatusMap[wooStatus] || 'design_requested';

          // Check if order already exists
          const { data: existing } = await supabase
            .from('shopflow_orders')
            .select('id')
            .eq('order_number', orderNumber)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('shopflow_orders')
              .insert({
                order_number: orderNumber,
                customer_name: customerName,
                product_type: productType,
                status: mappedStatus,
                priority: mappedStatus === 'awaiting_feedback' ? 'high' : 'normal',
                created_at: order.date_created,
              });

            if (insertError) {
              errors.push(`ShopFlow - Order ${orderNumber}: ${insertError.message}`);
            } else {
              syncedShopFlow++;
              console.log(`Synced order ${orderNumber} to ShopFlow`);
            }
          } else {
            skipped++;
          }
        }

        // Sync to ApproveFlow (only for design orders)
        if (target === 'approveflow' || target === 'both') {
          const isDesignOrder = ['in-design', 'lance', 'manny', 'design-complete'].includes(wooStatus);

          if (isDesignOrder) {
            // Check if project already exists
            const { data: existingProject } = await supabase
              .from('approveflow_projects')
              .select('id')
              .eq('order_number', orderNumber)
              .single();

            if (!existingProject) {
              const { error: projectError } = await supabase
                .from('approveflow_projects')
                .insert({
                  order_number: orderNumber,
                  customer_name: customerName,
                  customer_email: order.billing.email,
                  product_type: productType,
                  order_total: parseFloat(order.total),
                  status: 'design_requested',
                  design_instructions: order.customer_note || null,
                });

              if (projectError) {
                errors.push(`ApproveFlow - Order ${orderNumber}: ${projectError.message}`);
              } else {
                syncedApproveFlow++;
                console.log(`Synced order ${orderNumber} to ApproveFlow`);
              }
            } else {
              skipped++;
            }
          }
        }
      } catch (orderError: any) {
        errors.push(`Order ${order.number}: ${orderError.message}`);
        console.error(`Error processing order ${order.number}:`, orderError);
      }
    }

    const result = {
      success: true,
      syncedShopFlow,
      syncedApproveFlow,
      skipped,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Sync complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Manual sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
