import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Design product IDs that should go to ApproveFlow
const DESIGN_PRODUCT_IDS = [
  234,   // Custom Vehicle Wrap Design
  58160, // Custom Vehicle Wrap Design (Copy) - Draft
  290,   // Hourly Design
  289    // File Output
];

/**
 * Normalize WooCommerce status strings to handle variations
 */
function normalizeStatus(value: any): string {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Fetch product thumbnail from WooCommerce
 */
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
    console.error("❌ Failed to fetch Woo product image:", err);
    return null;
  }
}

/**
 * WOO → INTERNAL STATUS MAPPING (matches sync-wc-shopflow)
 */
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
  "lamination": "in_production",
  "finishing": "in_production",
  "processing": "in_production",
  "ready-for-pickup": "ready_or_shipped",
  "shipping-cost": "ready_or_shipped",
  "shipped": "ready_or_shipped",
  "completed": "completed"
};

/**
 * INTERNAL → CUSTOMER STAGE MAPPING
 */
const internalToCustomerStatus: Record<string, string> = {
  order_received: "Order Received",
  in_design: "In Design",
  action_required: "Action Needed (File Issue)",
  awaiting_approval: "Awaiting Your Approval",
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
    const wooUrl = `https://weprintwraps.com/wp-json/wc/v3/orders?per_page=100&orderby=date&order=desc&after=${afterISO}`;
    
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


    for (const order of orders) {
      try {
        const orderNumber = order.number.toString();
        const customerName = `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Unknown Customer';
        const productType = order.line_items?.[0]?.name || 'Unknown Product';
        const productId = order.line_items?.[0]?.product_id || null;
        
        // Extract design requirements from order notes and meta_data
        let designRequirements = order.customer_note || '';
        
        if (order.meta_data && Array.isArray(order.meta_data)) {
          const designField = order.meta_data.find((meta: any) => 
            meta.key && (
              meta.key.toLowerCase().includes('describe') ||
              meta.key.toLowerCase().includes('design') ||
              meta.key.toLowerCase().includes('project') ||
              meta.key.toLowerCase().includes('requirements') ||
              meta.key.toLowerCase().includes('instructions') ||
              meta.key.toLowerCase().includes('details') ||
              meta.key.toLowerCase().includes('notes') ||
              meta.key.toLowerCase().includes('description') ||
              meta.key.toLowerCase().includes('request') ||
              meta.key.toLowerCase().includes('specs') ||
              meta.key.toLowerCase().includes('specifications')
            )
          );
          
          if (designField && designField.value) {
            designRequirements = designField.value;
            console.log(`📋 Found design requirements for order ${orderNumber} in field: ${designField.key}`);
          }
        }
        
        const wooStatusRaw = order.status;
        const wooStatus = normalizeStatus(wooStatusRaw);
        
        console.log(`📊 Order ${orderNumber} - Raw: "${wooStatusRaw}", Normalized: "${wooStatus}"`);

        // Map to internal status and customer stage
        const internalStatus = wooToInternalStatus[wooStatus] || 'order_received';
        const customerStage = internalToCustomerStatus[internalStatus] || 'Order Received';
        
        console.log(`✅ Mapped to - Internal: "${internalStatus}", Customer: "${customerStage}"`);

        // Sync to ShopFlow
        if (target === 'shopflow' || target === 'both') {
          // Fetch product image
          const productImageUrl = await fetchWooProductImage(productId, wooKey, wooSecret);
          
          // Build customer address
          const address = `${order.billing?.address_1 || ""} ${order.billing?.address_2 || ""}, ${order.billing?.city || ""}, ${order.billing?.state || ""} ${order.billing?.postcode || ""}`.trim();

          // Check if order already exists
          const { data: existing } = await supabase
            .from('shopflow_orders')
            .select('id')
            .eq('order_number', orderNumber)
            .maybeSingle();

          if (!existing) {
            // Insert new order with all fields
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

            if (insertError) {
              errors.push(`ShopFlow - Order ${orderNumber}: ${insertError.message}`);
            } else {
              syncedShopFlow++;
              console.log(`✅ Synced order ${orderNumber} to ShopFlow`);
            }
          } else {
            // Update existing order with all fields
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

            if (updateError) {
              errors.push(`ShopFlow - Order ${orderNumber} update: ${updateError.message}`);
            } else {
              syncedShopFlow++;
              console.log(`✅ Updated order ${orderNumber} in ShopFlow`);
            }
          }
        }

        // Sync to ApproveFlow (only for design product orders)
        if (target === 'approveflow' || target === 'both') {
          // Check if order contains design products (by product ID)
          let hasDesignProduct = false;
          let designProductName = '';
          
          if (order.line_items && Array.isArray(order.line_items)) {
            for (const item of order.line_items) {
              const productId = item.product_id;
              if (DESIGN_PRODUCT_IDS.includes(productId)) {
                hasDesignProduct = true;
                designProductName = item.name || 'Custom Vehicle Wrap Design';
                console.log(`✅ Design product found - ID: ${productId}, Name: "${designProductName}"`);
                break;
              }
            }
          }

          if (hasDesignProduct) {
            console.log(`✅ Design product found in order ${orderNumber}: "${designProductName}" - syncing to ApproveFlow`);
            
            // Check if project already exists
            const { data: existingProject } = await supabase
              .from('approveflow_projects')
              .select('id')
              .eq('order_number', orderNumber)
              .maybeSingle();

            if (!existingProject) {
              const { error: projectError } = await supabase
                .from('approveflow_projects')
                .insert({
                  order_number: orderNumber,
                  customer_name: customerName,
                  customer_email: order.billing.email,
                  product_type: designProductName,
                  order_total: parseFloat(order.total),
                  status: 'design_requested',
                  design_instructions: designRequirements || null,
                });

              if (projectError) {
                errors.push(`ApproveFlow - Order ${orderNumber}: ${projectError.message}`);
              } else {
                syncedApproveFlow++;
                console.log(`✅ Synced order ${orderNumber} to ApproveFlow`);
              }
            } else {
              skipped++;
            }
          } else {
            console.log(`⚠️ Order ${orderNumber} does not contain design products - skipping ApproveFlow sync`);
            if (order.line_items) {
              console.log(`   Product IDs in order: ${order.line_items.map((i: any) => `${i.product_id} (${i.name})`).join(', ')}`);
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
