import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Design product IDs that should go to ApproveFlow
const DESIGN_PRODUCT_IDS = [234, 58160, 290, 289];

function normalizeStatus(value: any): string {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

async function fetchWooProductImage(productId: number | null, wooKey: string, wooSecret: string): Promise<string | null> {
  if (!productId) return null;
  try {
    const credentials = `${wooKey}:${wooSecret}`;
    const base64Credentials = btoa(credentials);
    const authHeader = `Basic ${base64Credentials}`;
    const url = `https://weprintwraps.com/wp-json/wc/v3/products/${productId}`;
    const response = await fetch(url, {
      headers: { 
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return null;
    const product = await response.json();
    return product?.images?.[0]?.src ?? null;
  } catch (err) {
    console.error("Failed to fetch product image:", err);
    return null;
  }
}

const wooToInternalStatus: Record<string, string> = {
  "pending": "order_received",
  "pending-payment": "order_received",
  "on-hold": "order_received",
  "waiting-to-place-order": "order_received",
  "waiting-on-email-response": "order_received",
  "add-on": "order_received",
  "dropbox-link-sent": "order_received",
  "in-design": "in_design",
  "lance": "in_design",
  "manny": "in_design",
  "file-error": "action_required",
  "missing-file": "action_required",
  "design-complete": "awaiting_approval",
  "work-order-printed": "awaiting_approval",
  "ready-for-print": "preparing_for_print",
  "pre-press": "preparing_for_print",
  "print-production": "in_production",
  "in-production": "in_production",
  "in_production": "in_production",
  "lamination": "in_production",
  "finishing": "in_production",
  "processing": "in_production",
  "ready-for-pickup": "ready_or_shipped",
  "shipping-cost": "ready_or_shipped",
  "shipped": "ready_or_shipped",
  "completed": "completed"
};

const internalToCustomerStatus: Record<string, string> = {
  order_received: "Order Received",
  in_design: "In Design",
  action_required: "Action Needed",
  awaiting_approval: "Awaiting Approval",
  preparing_for_print: "Preparing for Print",
  in_production: "In Production",
  ready_or_shipped: "Ready / Shipped",
  completed: "Completed"
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumbers } = await req.json();

    if (!orderNumbers || !Array.isArray(orderNumbers) || orderNumbers.length === 0) {
      throw new Error('orderNumbers array is required');
    }

    console.log(`Bulk sync requested for ${orderNumbers.length} orders:`, orderNumbers);

    const wooKey = Deno.env.get('WOO_CONSUMER_KEY');
    const wooSecret = Deno.env.get('WOO_CONSUMER_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!wooKey || !wooSecret) {
      throw new Error('WooCommerce credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const credentials = `${wooKey}:${wooSecret}`;
    const base64Credentials = btoa(credentials);
    const authHeader = `Basic ${base64Credentials}`;

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each order
    for (const orderNumber of orderNumbers) {
      try {
        console.log(`Fetching order ${orderNumber} from WooCommerce...`);
        
        const wooUrl = `https://weprintwraps.com/wp-json/wc/v3/orders?number=${orderNumber}`;
        const wooResponse = await fetch(wooUrl, {
          headers: { 
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (!wooResponse.ok) {
          throw new Error(`WooCommerce API error: ${wooResponse.status}`);
        }

        const orders = await wooResponse.json();
        
        if (!orders || orders.length === 0) {
          throw new Error('Order not found in WooCommerce');
        }

        const order = orders[0];
        const customerName = `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Unknown Customer';
        const productType = order.line_items?.[0]?.name || 'Unknown Product';
        const productId = order.line_items?.[0]?.product_id || null;
        const wooStatus = normalizeStatus(order.status);
        const internalStatus = wooToInternalStatus[wooStatus] || 'order_received';
        const customerStage = internalToCustomerStatus[internalStatus] || 'Order Received';
        
        // Fetch product image
        const productImageUrl = await fetchWooProductImage(productId, wooKey, wooSecret);
        
        // Build customer address
        const address = `${order.billing?.address_1 || ""} ${order.billing?.address_2 || ""}, ${order.billing?.city || ""}, ${order.billing?.state || ""} ${order.billing?.postcode || ""}`.trim();

        // Check if order exists
        const { data: existing } = await supabase
          .from('shopflow_orders')
          .select('id')
          .eq('order_number', orderNumber)
          .maybeSingle();

        if (!existing) {
          // Insert new order
          const { error: insertError } = await supabase
            .from('shopflow_orders')
            .insert({
              order_number: orderNumber,
              woo_order_id: order.id,
              woo_order_number: order.number,
              customer_name: customerName,
              customer_email: order.billing?.email || null,
              customer_phone: order.billing?.phone || null,
              customer_address: address || null,
              product_type: productType,
              product_image_url: productImageUrl,
              status: internalStatus,
              customer_stage: customerStage,
              priority: internalStatus === 'action_required' ? 'high' : 'normal',
              created_at: order.date_created,
              updated_at: new Date().toISOString(),
            });

          if (insertError) throw insertError;
        } else {
          // Update existing order
          const { error: updateError } = await supabase
            .from('shopflow_orders')
            .update({
              woo_order_id: order.id,
              woo_order_number: order.number,
              customer_name: customerName,
              customer_email: order.billing?.email || null,
              customer_phone: order.billing?.phone || null,
              customer_address: address || null,
              product_type: productType,
              product_image_url: productImageUrl,
              status: internalStatus,
              customer_stage: customerStage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        }

        console.log(`✅ Successfully synced order ${orderNumber}`);
        synced++;
      } catch (orderError: any) {
        console.error(`❌ Failed to sync order ${orderNumber}:`, orderError);
        errors.push(`Order ${orderNumber}: ${orderError.message}`);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Bulk sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
