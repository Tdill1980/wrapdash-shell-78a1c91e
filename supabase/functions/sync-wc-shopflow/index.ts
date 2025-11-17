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
    const productType = extractProductType(payload.line_items);
    const status = mapWooStatusToShopFlow(payload.status);

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
        event_type: 'order_created',
        payload: {
          source: 'woocommerce',
          woo_status: payload.status,
        },
      });

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
  const statusMap: Record<string, string> = {
    'pending': 'design_requested',
    'processing': 'design_requested',
    'on-hold': 'awaiting_feedback',
    'completed': 'completed',
    'cancelled': 'completed',
    'refunded': 'completed',
    'failed': 'design_requested',
  };

  return statusMap[wooStatus] || 'design_requested';
}
