import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Status mapping layer
const wooToInternalStatus: Record<string, string> = {
  "pending": "order_received",
  "processing": "order_received",
  "on-hold": "order_received",
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

    // Extract order data
    const orderNumber = payload.id?.toString() || payload.number?.toString();
    const customerName = `${payload.billing?.first_name || ''} ${payload.billing?.last_name || ''}`.trim() || 'Guest';
    const customerEmail = payload.billing?.email || '';
    const productType = extractProductType(payload.line_items);
    const wooStatus = payload.status;
    const status = mapWooStatusToShopFlow(wooStatus);

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
      
      // Update existing order
      await supabase
        .from('shopflow_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', orderNumber);

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

    // Check if there's a matching ApproveFlow project
    const { data: approveflowProject } = await supabase
      .from('approveflow_projects')
      .select('id')
      .eq('order_number', orderNumber)
      .maybeSingle();

    // Create new ShopFlow order
    const { data: newOrder, error: insertError } = await supabase
      .from('shopflow_orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        product_type: productType,
        status,
        approveflow_project_id: approveflowProject?.id || null,
        priority: 'normal',
      })
      .select()
      .single();

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
  return wooToInternalStatus[wooStatus] || 'order_received';
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
            profile: { $email: customerEmail },
            metric: { name: eventName },
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
