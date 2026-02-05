import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// ============================================================
// PAID GATE: Only these statuses indicate a PAID order
// ============================================================
const PAID_STATUSES = ['processing', 'completed'];

// UNPAID statuses - NEVER create new ShopFlow records for these
const UNPAID_STATUSES = ['pending', 'pending-payment', 'on-hold', 'failed', 'cancelled', 'refunded'];

/**
 * Check if a WooCommerce order is PAID
 * An order is considered paid if:
 * 1. Status is 'processing' or 'completed', OR
 * 2. date_paid is not null
 */
function isOrderPaid(wooStatus: string, datePaid: string | null): boolean {
  const normalizedStatus = normalizeStatus(wooStatus);
  
  // Check if status indicates payment
  if (PAID_STATUSES.includes(normalizedStatus)) {
    return true;
  }
  
  // Check if date_paid exists (fallback check)
  if (datePaid && datePaid.trim() !== '') {
    return true;
  }
  
  return false;
}

// Status mapping layer (internal staff view)
// NOTE: These mappings are ONLY used for PAID orders now
const wooToInternalStatus: Record<string, string> = {
  "processing": "order_received",
  "waiting-to-place-order": "order_received",
  "waiting-on-email-response": "order_received",
  "add-on": "order_received",
  "dropbox-link-sent": "order_received",
  "in-design": "in_design",
  "file-error": "action_required",
  "missing-file": "action_required",
  "design-complete": "awaiting_approval",
  "work-order-printed": "awaiting_approval",
  "ready-for-print": "preparing_for_print",
  "pre-press": "preparing_for_print",
  "print-production": "in_production",
  "lamination": "in_production",
  "finishing": "in_production",
  "ready-for-pickup": "ready_or_shipped",
  "shipping-cost": "ready_or_shipped",
  "shipped": "ready_or_shipped",
  "completed": "completed"
};

// Customer-facing stage mapping (for public tracker)
const wooToCustomerStage: Record<string, string> = {
  "processing": "order_received",
  "waiting-to-place-order": "order_received",
  "waiting-on-email-response": "order_received",
  "add-on": "order_received",
  "dropbox-link-sent": "order_received",
  "file-error": "file_error",
  "missing-file": "missing_file",
  "in-design": "preparing_print_files",
  "lance": "preparing_print_files",
  "manny": "preparing_print_files",
  "design-complete": "awaiting_approval",
  "work-order-printed": "awaiting_approval",
  "ready-for-print": "preparing_print_files",
  "pre-press": "preflight",
  "print-production": "printing",
  "lamination": "laminating",
  "finishing": "cutting",
  "ready-for-pickup": "ready",
  "shipped": "ready",
  "completed": "ready"
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fetch WooCommerce product image by product ID
 */
async function fetchWooProductImage(productId: number | string): Promise<string | null> {
  try {
    const wooUrl = Deno.env.get('WOO_URL') || 'https://weprintwraps.com';
    const consumerKey = Deno.env.get('WOO_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOO_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      console.error('WooCommerce credentials not configured');
      return null;
    }

    const url = `${wooUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    
    console.log(`Fetching product image for product ID: ${productId}`);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch product ${productId}: ${response.status}`);
      return null;
    }

    const product = await response.json();
    const imageUrl = product?.images?.[0]?.src || null;
    
    if (imageUrl) {
      console.log(`✅ Product image found: ${imageUrl}`);
    } else {
      console.log(`No image found for product ${productId}`);
    }

    return imageUrl;
  } catch (err) {
    console.error('Error fetching WooCommerce product image:', err);
    return null;
  }
}

/**
 * Normalize WooCommerce status strings to handle variations
 * Converts "Dropbox Link Sent" to "dropbox-link-sent", etc.
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
 * Track quote conversion when WooCommerce order is created
 */
async function trackQuoteConversion(supabase: any, customerEmail: string, orderNumber: string, orderTotal: number) {
  try {
    // Find matching quote by email
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, customer_email, quote_number")
      .eq("customer_email", customerEmail)
      .eq("converted_to_order", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quote) {
      // Mark quote as converted
      await supabase
        .from("quotes")
        .update({
          converted_to_order: true,
          conversion_date: new Date().toISOString(),
          woo_order_id: orderNumber,
          conversion_revenue: orderTotal,
          status: "completed",
        })
        .eq("id", quote.id);

      // Get customer ID for tracking
      const { data: customer } = await supabase
        .from("email_retarget_customers")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      // Track conversion event in UTIM
      await supabase.from("email_events").insert({
        event_type: "converted",
        customer_id: customer?.id || null,
        quote_id: quote.id,
        utim_data: {
          woo_order_id: orderNumber,
          revenue: orderTotal,
        },
        metadata: {
          quote_number: quote.quote_number,
          order_total: orderTotal,
        },
      });

      console.log(`✅ UTIM: Quote ${quote.id} converted to order ${orderNumber} - Revenue: $${orderTotal}`);
    }
  } catch (error) {
    console.error("Error tracking quote conversion:", error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get content type to handle different payload formats
    const contentType = req.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let payload;
    
    // Handle JSON payloads (standard WooCommerce webhook format)
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } 
    // Handle form/URL-encoded test pings or alternate formats
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      console.log('Received URL-encoded data:', text);
      
      // This is likely a test ping, return success
      if (text.includes('webhook_id')) {
        return new Response(
          JSON.stringify({ message: 'Webhook test received successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('URL-encoded payload not supported for order sync');
    }
    // Try to parse as JSON anyway
    else {
      const text = await req.text();
      console.log('Received unknown content type, raw body:', text);
      payload = JSON.parse(text);
    }
    
    console.log('WooCommerce webhook received:', payload);

    // Extract order data - prioritize display number
    const displayNumber = payload.number?.toString();
    const internalId = payload.id?.toString();
    const orderNumber = displayNumber || internalId;
    const customerName = `${payload.billing?.first_name || ''} ${payload.billing?.last_name || ''}`.trim() || 'Guest';
    const customerEmail = payload.billing?.email || '';
    const productType = extractProductType(payload.line_items);
    const wooStatus = payload.status;
    console.log(`📊 Raw Woo Status: "${wooStatus}"`);
    const status = mapWooStatusToShopFlow(wooStatus);
    const customerStage = mapWooStatusToCustomerStage(wooStatus);
    console.log(`✅ Normalized Status - Internal: "${status}", Customer: "${customerStage}"`);
    
    // Extract order info from line items meta data
    const orderInfo = extractOrderInfo(payload.line_items);
    
    // Extract files from meta data or attachments
    const files = extractFiles(payload);
    
    // Extract affiliate ref code
    const affiliateRefCode = extractAffiliateRefCode(payload);

    // Extract product ID and fetch product image
    const productId = payload.line_items?.[0]?.product_id;
    const productImageUrl = productId ? await fetchWooProductImage(productId) : null;

    if (!orderNumber) {
      throw new Error('Order number is required');
    }

    // Check if ShopFlow order already exists
    const { data: existingOrder } = await supabase
      .from('shopflow_orders')
      .select('id')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (existingOrder) {
      console.log('ShopFlow order already exists:', orderNumber);
      
      // Get current order data for timeline
      const { data: currentOrder } = await supabase
        .from('shopflow_orders')
        .select('customer_stage, timeline, files')
        .eq('order_number', orderNumber)
        .single();
      
      let updatedCustomerStage = customerStage;
      let updatedTimeline = currentOrder?.timeline || {};
      let updatedFiles = files.length > 0 ? files : (currentOrder?.files || []);
      
      // AUTO-TRIGGER: If files exist and stage is still "order_received", move to "files_received"
      if (updatedFiles.length > 0 && customerStage === 'order_received') {
        updatedCustomerStage = 'files_received';
        updatedTimeline['files_received'] = new Date().toISOString();
        console.log('Auto-triggered: files_received stage');
      }
      
      // Update timeline for the new stage
      if (!updatedTimeline[updatedCustomerStage]) {
        updatedTimeline[updatedCustomerStage] = new Date().toISOString();
      }
      
      // Update existing order (also capture order_total if missing)
      await supabase
        .from('shopflow_orders')
        .update({
          status,
          customer_stage: updatedCustomerStage,
          timeline: updatedTimeline,
          files: updatedFiles,
          customer_email: customerEmail,
          vehicle_info: orderInfo,
          affiliate_ref_code: affiliateRefCode,
          product_image_url: productImageUrl,
          woo_order_id: internalId ? parseInt(internalId) : null,
          woo_order_number: displayNumber ? parseInt(displayNumber) : null,
          order_total: parseFloat(payload.total || '0'),
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber);
      
      // AUTO-STAGE ENGINE: If entering "printing", queue internal progression
      if (updatedCustomerStage === 'printing' && currentOrder?.customer_stage !== 'printing') {
        console.log('Starting auto-stage progression from printing');
        triggerAutoStageProgression(orderNumber, supabase);
      }

      // Log status change
      await supabase
        .from('shopflow_logs')
        .insert({
          order_id: existingOrder.id,
          event_type: 'status_changed',
          payload: {
            woo_status: wooStatus,
            internal_status: status,
            source: 'woocommerce'
          }
        });

      // Send Klaviyo event
      if (customerEmail) {
        await sendKlaviyoEvent('shopflow_status_changed', {
          order_number: orderNumber,
          internal_status: status,
          woo_status: wooStatus,
          product_type: productType
        }, customerEmail);
      }

      return new Response(
        JSON.stringify({ message: 'ShopFlow order updated', orderId: existingOrder.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // PAID GATE: Block NEW unpaid orders from entering ShopFlow
    // ============================================================
    const datePaid = payload.date_paid;
    const isPaid = isOrderPaid(wooStatus, datePaid);
    
    if (!isPaid) {
      console.log(`⛔ PAID GATE BLOCKED: Order ${orderNumber} is UNPAID`);
      console.log(`   Status: "${wooStatus}", date_paid: "${datePaid}"`);
      console.log(`   This is likely a quote tool checkout or abandoned cart - NOT creating ShopFlow record`);
      
      return new Response(
        JSON.stringify({ 
          message: 'Order not synced - not paid (quote/checkout started but not completed)', 
          order_number: orderNumber,
          woo_status: wooStatus,
          date_paid: datePaid,
          blocked_by: 'PAID_GATE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ PAID GATE PASSED: Order ${orderNumber} is PAID (status: ${wooStatus}, date_paid: ${datePaid})`);

    // Check if there's a matching ApproveFlow project
    const { data: approveflowProject } = await supabase
      .from('approveflow_projects')
      .select('id')
      .eq('order_number', orderNumber)
      .maybeSingle();

    // Initialize timeline
    const initialTimeline: Record<string, string> = {};
    let initialCustomerStage = customerStage;
    
    // AUTO-TRIGGER: If files exist on creation, start at "files_received"
    if (files.length > 0 && customerStage === 'order_received') {
      initialCustomerStage = 'files_received';
      initialTimeline['order_received'] = new Date().toISOString();
      initialTimeline['files_received'] = new Date().toISOString();
      console.log('New order with files - starting at files_received');
    } else {
      initialTimeline[initialCustomerStage] = new Date().toISOString();
    }
    
    // Create new ShopFlow order - PAID orders only reach this point
    const { data: newOrder, error: insertError } = await supabase
      .from('shopflow_orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        product_type: productType,
        status,
        customer_stage: initialCustomerStage,
        customer_email: customerEmail,
        vehicle_info: orderInfo,
        timeline: initialTimeline,
        files,
        product_image_url: productImageUrl,
        woo_order_id: internalId ? parseInt(internalId) : null,
        woo_order_number: displayNumber ? parseInt(displayNumber) : null,
        approveflow_project_id: approveflowProject?.id || null,
        priority: 'normal',
        affiliate_ref_code: affiliateRefCode,
        order_total: parseFloat(payload.total || '0'),
        // Payment tracking fields
        is_paid: true,
        hidden: false,
        woo_status_raw: wooStatus,
        woo_date_paid: datePaid || new Date().toISOString(),
      })
      .select()
      .single();
    
    // Track affiliate referral if ref code exists
    if (affiliateRefCode && customerEmail && newOrder) {
      await trackAffiliateReferral(
        affiliateRefCode,
        customerEmail,
        orderNumber,
        parseFloat(payload.total || '0'),
        productType,
        supabase
      );
    }

    // Track quote conversion to order (UTIM)
    if (customerEmail && newOrder) {
      await trackQuoteConversion(
        supabase,
        customerEmail,
        orderNumber,
        parseFloat(payload.total || '0')
      );
    }
    
    // AUTO-STAGE ENGINE: If starting at "printing", queue progression
    if (initialCustomerStage === 'printing') {
      console.log('New order starting at printing - triggering auto-stage');
      triggerAutoStageProgression(orderNumber, supabase);
    }

    if (insertError) throw insertError;

    // Log creation event
    await supabase
      .from('shopflow_logs')
      .insert({
        order_id: newOrder.id,
        event_type: 'job_created',
        payload: {
          source: 'woocommerce',
          woo_status: wooStatus,
          internal_status: status,
        },
      });

    // Send Klaviyo event for new job
    if (customerEmail) {
      await sendKlaviyoEvent('shopflow_job_created', {
        order_number: orderNumber,
        customer_name: customerName,
        internal_status: status,
        woo_status: wooStatus,
        product_type: productType
      }, customerEmail);
    }

    console.log('ShopFlow order created:', newOrder.id);

    return new Response(
      JSON.stringify({ message: 'ShopFlow order created', orderId: newOrder.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing WooCommerce to ShopFlow:', error);
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

function extractProductType(lineItems: any[]): string {
  if (!lineItems || lineItems.length === 0) return 'Unknown Product';
  
  const firstItem = lineItems[0];
  return firstItem.name || 'Unknown Product';
}

function mapWooStatusToShopFlow(wooStatus: string): string {
  const normalized = normalizeStatus(wooStatus);
  return wooToInternalStatus[normalized] || 'order_received';
}

function mapWooStatusToCustomerStage(wooStatus: string): string {
  const normalized = normalizeStatus(wooStatus);
  return wooToCustomerStage[normalized] || 'order_received';
}

function extractOrderInfo(lineItems: any[]): any {
  if (!lineItems || lineItems.length === 0) return {};
  
  const firstItem = lineItems[0];
  const metaData = firstItem.meta_data || [];
  
  const orderInfo: any = {
    quantity: firstItem.quantity || 1,
  };
  
  console.log('📦 ===== EXTRACTING ORDER INFO =====');
  console.log('📦 ALL LINE ITEM META DATA KEYS:');
  
  for (const meta of metaData) {
    const key = meta.key?.toLowerCase() || '';
    const displayKey = meta.key || 'unknown';
    const value = meta.value;
    
    // Log EVERY key for debugging
    console.log(`  📋 Key: "${displayKey}" = "${typeof value === 'object' ? JSON.stringify(value) : value}"`);
    
    // Extract quantity - check multiple variations
    if (key.includes('quantity') || key.includes('qty') || key === 'pa_quantity') {
      orderInfo.quantity = parseInt(value) || orderInfo.quantity;
      console.log(`    ✓ MATCHED quantity: ${orderInfo.quantity}`);
    }
    
    // Extract square footage - check ALL possible keys
    if (key.includes('square') || key.includes('sqft') || key.includes('sq_ft') || 
        key.includes('sq ft') || key.includes('square_footage') || key.includes('size') ||
        key.includes('area') || key.includes('footage') || key === 'pa_size' || 
        key === 'pa_square-footage' || key.includes('dimension')) {
      orderInfo.square_footage = parseFloat(value) || value;
      console.log(`    ✓ MATCHED square footage: ${orderInfo.square_footage}`);
    }
    
    // Extract shipping speed - check multiple variations
    if ((key.includes('shipping') && (key.includes('speed') || key.includes('method'))) ||
        key === 'pa_shipping' || key.includes('delivery')) {
      orderInfo.shipping_speed = value;
      console.log(`    ✓ MATCHED shipping speed: ${orderInfo.shipping_speed}`);
    }
    
    // Extract any other potentially useful fields
    if (key.includes('vehicle') || key.includes('year') || key.includes('make') || key.includes('model')) {
      orderInfo[key.replace(/^pa_/, '').replace(/-/g, '_')] = value;
      console.log(`    ✓ MATCHED vehicle info: ${key} = ${value}`);
    }
    
    // Capture color/finish info
    if (key.includes('color') || key.includes('finish') || key.includes('material')) {
      orderInfo[key.replace(/^pa_/, '').replace(/-/g, '_')] = value;
      console.log(`    ✓ MATCHED color/finish: ${key} = ${value}`);
    }
  }
  
  console.log('📦 FINAL ORDER INFO:', JSON.stringify(orderInfo, null, 2));
  return orderInfo;
}

function extractFiles(payload: any): any[] {
  const files: any[] = [];
  
  console.log('🔍 Extracting files from WooCommerce payload...');
  console.log('Meta data available:', payload.meta_data ? payload.meta_data.length : 0);
  console.log('Line items:', payload.line_items ? payload.line_items.length : 0);
  
  // Check meta_data for file URLs
  if (payload.meta_data) {
    for (const meta of payload.meta_data) {
      const key = meta.key?.toLowerCase();
      console.log(`  - Checking meta key: ${meta.key}`);
      
      // Check for various file-related keys
      if (
        key?.includes('file') || 
        key?.includes('artwork') || 
        key?.includes('design') ||
        key?.includes('upload') ||
        key?.includes('attachment') ||
        key?.includes('document')
      ) {
        console.log(`    ✓ Found potential file key: ${meta.key}, value type: ${typeof meta.value}`);
        
        // Handle string URLs
        if (typeof meta.value === 'string' && (meta.value.startsWith('http') || meta.value.includes('dropbox'))) {
          console.log(`    ✅ Adding file: ${meta.value}`);
          files.push({
            name: meta.key,
            url: meta.value,
            status: 'print_ready',
            uploaded_at: new Date().toISOString()
          });
        }
        // Handle array of URLs
        else if (Array.isArray(meta.value)) {
          console.log(`    ✅ Adding ${meta.value.length} files from array`);
          meta.value.forEach((url: string) => {
            if (typeof url === 'string' && url.startsWith('http')) {
              files.push({
                name: `${meta.key}`,
                url: url,
                status: 'print_ready',
                uploaded_at: new Date().toISOString()
              });
            }
          });
        }
        // Handle object with file URL
        else if (typeof meta.value === 'object' && meta.value?.url) {
          console.log(`    ✅ Adding file from object: ${meta.value.url}`);
          files.push({
            name: meta.value.name || meta.key,
            url: meta.value.url,
            status: 'print_ready',
            uploaded_at: new Date().toISOString()
          });
        }
      }
    }
  }
  
  // Check line items for uploaded files
  if (payload.line_items) {
    for (const item of payload.line_items) {
      if (item.meta_data) {
        console.log(`  - Checking line item: ${item.name}`);
        for (const meta of item.meta_data) {
          const key = meta.key?.toLowerCase();
          console.log(`    - Line item meta key: ${meta.key}`);
          
          if (
            key?.includes('file') || 
            key?.includes('artwork') || 
            key?.includes('upload') ||
            key?.includes('attachment') ||
            key?.includes('document') ||
            key?.includes('design')
          ) {
            console.log(`      ✓ Found file-related key in line item: ${meta.key}`);
            
            // Handle string URLs
            if (typeof meta.value === 'string' && meta.value.startsWith('http')) {
              console.log(`      ✅ Adding file: ${meta.value}`);
              files.push({
                name: `${item.name} - ${meta.key}`,
                url: meta.value,
                status: 'print_ready',
                uploaded_at: new Date().toISOString()
              });
            }
            // Handle array of URLs
            else if (Array.isArray(meta.value)) {
              console.log(`      ✅ Adding ${meta.value.length} files from line item array`);
              meta.value.forEach((url: string) => {
                if (typeof url === 'string' && url.startsWith('http')) {
                  files.push({
                    name: `${item.name} - ${meta.key}`,
                    url: url,
                    status: 'print_ready',
                    uploaded_at: new Date().toISOString()
                  });
                }
              });
            }
          }
        }
      }
    }
  }
  
  console.log(`📁 Total files extracted: ${files.length}`);
  if (files.length === 0) {
    console.log('⚠️ No files found in WooCommerce order data');
    console.log('This likely means:');
    console.log('  1. Customer has not uploaded files yet');
    console.log('  2. Files are in a different location/format in WooCommerce');
    console.log('  3. Files were emailed separately instead of uploaded');
  }
  
  return files;
}

function extractAffiliateRefCode(payload: any): string | null {
  // Check coupon_lines for affiliate coupon codes (most common pattern)
  if (payload.coupon_lines && Array.isArray(payload.coupon_lines)) {
    for (const coupon of payload.coupon_lines) {
      const code = coupon.code?.toUpperCase();
      // Affiliate codes are typically 4-15 chars, uppercase
      if (code && code.length >= 4 && code.length <= 15) {
        console.log(`[sync-wc-shopflow] Found coupon code: ${code}, treating as potential affiliate code`);
        return code;
      }
    }
  }

  // Check meta_data array for affiliate ref codes
  if (payload.meta_data) {
    const refMeta = payload.meta_data.find((m: any) => 
      m.key === '_affiliate_ref' || 
      m.key === 'ref_code' ||
      m.key === '_wc_affiliate_code' ||
      m.key === 'affiliate_code'
    );
    if (refMeta) return refMeta.value;
  }
  
  // Check billing meta_data
  if (payload.billing?.meta_data) {
    const refMeta = payload.billing.meta_data.find((m: any) => 
      m.key === '_affiliate_ref' || 
      m.key === 'ref_code'
    );
    if (refMeta) return refMeta.value;
  }
  
  // Check customer note for ref code pattern
  if (payload.customer_note) {
    const match = payload.customer_note.match(/REF:(\w+)/i);
    if (match) return match[1];
  }
  
  // Check utm_source
  if (payload.utm_source) return payload.utm_source;
  
  return null;
}

async function trackAffiliateReferral(refCode: string, customerEmail: string, orderNumber: string, orderTotal: number, productType: string, supabase: any) {
  try {
    // Calculate 2.5% commission
    const commissionAmount = orderTotal * 0.025;
    
    console.log(`Tracking affiliate referral: ${refCode} for order ${orderNumber}, commission: $${commissionAmount}`);
    
    // Call the track-affiliate-signup function
    const { data, error } = await supabase.functions.invoke('track-affiliate-signup', {
      body: {
        refCode,
        email: customerEmail,
        orderNumber,
        orderTotal,
        productType
      }
    });
    
    if (error) {
      console.error('Error tracking affiliate signup:', error);
    } else {
      console.log('Affiliate signup tracked successfully:', data);
    }
  } catch (error) {
    console.error('Error in trackAffiliateReferral:', error);
  }
}

// AUTO-STAGE PROGRESSION ENGINE
// Automatically advances through internal production stages
async function triggerAutoStageProgression(orderNumber: string, supabase: any) {
  const stages = [
    { stage: 'laminating', delayMinutes: 20 },
    { stage: 'cutting', delayMinutes: 40 },
    { stage: 'qc', delayMinutes: 60 }
  ];
  
  for (const { stage, delayMinutes } of stages) {
    // Schedule stage update (simulated with immediate execution for webhook context)
    // In production, you'd use a queue system or scheduled function
    setTimeout(async () => {
      try {
        const { data: order } = await supabase
          .from('shopflow_orders')
          .select('timeline, id')
          .eq('order_number', orderNumber)
          .single();
        
        if (order) {
          const updatedTimeline = order.timeline || {};
          updatedTimeline[stage] = new Date().toISOString();
          
          await supabase
            .from('shopflow_orders')
            .update({
              customer_stage: stage,
              timeline: updatedTimeline,
              updated_at: new Date().toISOString()
            })
            .eq('order_number', orderNumber);
          
          console.log(`Auto-progressed to ${stage} for order ${orderNumber}`);
        }
      } catch (error) {
        console.error(`Auto-stage progression error for ${stage}:`, error);
      }
    }, delayMinutes * 60 * 1000);
  }
}

async function sendKlaviyoEvent(eventName: string, properties: any, customerEmail: string) {
  try {
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (!klaviyoKey) {
      console.log('Klaviyo API key not configured, skipping event');
      return;
    }

    const response = await fetch('https://a.klaviyo.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: customerEmail
                }
              }
            },
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: eventName
                }
              }
            },
            properties,
            time: new Date().toISOString()
          }
        }
      })
    });

    if (!response.ok) {
      console.error('Klaviyo event failed:', await response.text());
    } else {
      console.log('Klaviyo event sent:', eventName);
    }
  } catch (error) {
    console.error('Error sending Klaviyo event:', error);
  }
}
