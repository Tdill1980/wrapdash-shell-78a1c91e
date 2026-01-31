import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Design product detection - same IDs as sync-wc-approveflow
const DESIGN_PRODUCT_IDS = [234, 58160, 290, 289];
const DESIGN_PRODUCT_NAMES = [
  'custom vehicle wrap design',
  'custom design',
  'hourly design',
  'file output'
];

interface ConvertQuoteRequest {
  quote_id: string;
  payment_method: string;
  payment_notes?: string;
}

// Generate internal order number (non-colliding with WooCommerce)
function generateInternalOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MQ-${timestamp}${random}`;
}

// Detect if product is a design product
function isDesignProduct(productName: string, wooProductId?: number): boolean {
  if (wooProductId && DESIGN_PRODUCT_IDS.includes(wooProductId)) return true;
  const lower = productName?.toLowerCase() || '';
  return DESIGN_PRODUCT_NAMES.some(name => lower.includes(name));
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { quote_id, payment_method, payment_notes }: ConvertQuoteRequest = await req.json();

    if (!quote_id || !payment_method) {
      return new Response(
        JSON.stringify({ error: "quote_id and payment_method are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Converting quote ${quote_id} to order with payment method: ${payment_method}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError);
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already converted
    if (quote.is_paid && quote.shopflow_order_id) {
      return new Response(
        JSON.stringify({ error: "Quote has already been converted to an order" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate required fields
    if (!quote.customer_email) {
      return new Response(
        JSON.stringify({ error: "Quote must have a customer email to convert to order" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Generate order number
    const orderNumber = generateInternalOrderNumber();
    console.log(`Generated order number: ${orderNumber}`);

    // 3. Parse vehicle details
    let vehicleInfo: Record<string, unknown> = {};
    try {
      if (quote.vehicle_details) {
        vehicleInfo = typeof quote.vehicle_details === 'string' 
          ? JSON.parse(quote.vehicle_details) 
          : quote.vehicle_details;
      }
    } catch (e) {
      console.log('Could not parse vehicle_details, using fields directly');
    }

    vehicleInfo = {
      year: quote.vehicle_year || vehicleInfo.year,
      make: quote.vehicle_make || vehicleInfo.make,
      model: quote.vehicle_model || vehicleInfo.model,
      ...vehicleInfo
    };

    // 4. Get artwork files
    const artworkFiles = quote.artwork_files || [];
    const hasArtwork = Array.isArray(artworkFiles) && artworkFiles.length > 0;

    // 5. Create ShopFlow order
    const { data: shopflowOrder, error: shopflowError } = await supabase
      .from('shopflow_orders')
      .insert({
        order_number: orderNumber,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        product_type: quote.product_name,
        status: 'order_received',
        customer_stage: 'order_received',
        vehicle_info: vehicleInfo,
        is_paid: true,
        source_quote_id: quote.id,
        organization_id: quote.organization_id,
        order_total: quote.total_price,
        timeline: {
          order_received: new Date().toISOString()
        },
        files: artworkFiles
      })
      .select()
      .single();

    if (shopflowError) {
      console.error('Failed to create ShopFlow order:', shopflowError);
      return new Response(
        JSON.stringify({ error: "Failed to create ShopFlow order", details: shopflowError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Created ShopFlow order: ${shopflowOrder.id}`);

    // 6. Check if design product and create ApproveFlow project if needed
    let approveflowProject = null;
    const productIsDesign = isDesignProduct(quote.product_name || '', quote.woo_product_id);

    if (productIsDesign) {
      console.log('Design product detected, creating ApproveFlow project');
      
      const { data: afProject, error: afError } = await supabase
        .from('approveflow_projects')
        .insert({
          order_number: orderNumber,
          customer_name: quote.customer_name,
          customer_email: quote.customer_email,
          product_type: quote.product_name,
          status: 'design_requested',
          vehicle_info: vehicleInfo,
          organization_id: quote.organization_id,
          order_total: quote.total_price,
          design_instructions: quote.notes || null
        })
        .select()
        .single();

      if (afError) {
        console.error('Failed to create ApproveFlow project:', afError);
        // Don't fail the whole operation, just log it
      } else {
        approveflowProject = afProject;
        console.log(`Created ApproveFlow project: ${afProject.id}`);
      }
    }

    // 7. Update quote with payment info and order references
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_method: payment_method,
        payment_notes: payment_notes || null,
        shopflow_order_id: shopflowOrder.id,
        approveflow_project_id: approveflowProject?.id || null,
        status: 'converted',
        converted_to_order: true
      })
      .eq('id', quote_id);

    if (updateError) {
      console.error('Failed to update quote:', updateError);
      // Order was created, so we continue but log the error
    }

    // 8. Send appropriate email
    const portalUrl = productIsDesign && approveflowProject
      ? `https://weprintwraps.com/approveflow/${orderNumber}`
      : `https://weprintwraps.com/my-order/${orderNumber}`;

    try {
      const emailPayload = {
        projectId: approveflowProject?.id || shopflowOrder.id,
        customerEmail: quote.customer_email,
        customerName: quote.customer_name || 'Customer',
        orderNumber: orderNumber,
        hasArtwork: hasArtwork,
        artworkCount: artworkFiles.length,
        designInstructions: quote.notes || '',
        portalUrl: portalUrl
      };

      console.log('Sending welcome email with payload:', emailPayload);

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-approveflow-welcome`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailResponse.json();
      
      if (!emailResponse.ok) {
        console.error('Email send failed:', emailResult);
      } else {
        console.log('Welcome email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the operation if email fails
    }

    // 9. Return success with created IDs
    return new Response(
      JSON.stringify({
        success: true,
        order_number: orderNumber,
        shopflow_order_id: shopflowOrder.id,
        approveflow_project_id: approveflowProject?.id || null,
        is_design_product: productIsDesign,
        email_sent: true,
        has_artwork: hasArtwork
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in convert-quote-to-order:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
