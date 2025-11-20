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

    let webhook;

    // Handle JSON payloads (standard WooCommerce webhook format)
    if (contentType.includes('application/json')) {
      webhook = await req.json();
    } 
    // Handle form/URL-encoded test pings
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      console.log('Received URL-encoded data:', text);
      
      // This is likely a test ping from WooCommerce, return success
      if (text.includes('webhook_id')) {
        return new Response(
          JSON.stringify({ message: 'ApproveFlow webhook test received successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('URL-encoded payload not supported for order sync');
    }
    // Try to parse as JSON anyway
    else {
      const text = await req.text();
      console.log('Received unknown content type, raw body:', text);
      webhook = JSON.parse(text);
    }

    console.log('WooCommerce webhook received:', webhook);

    // Parse WooCommerce order data
    const orderNumber = webhook.id?.toString() || webhook.order_key;
    const customerName = `${webhook.billing?.first_name || ''} ${webhook.billing?.last_name || ''}`.trim();
    const orderTotal = parseFloat(webhook.total || '0');
    const customerEmail = webhook.billing?.email;
    
    // Extract product type from line items
    let productType = 'Custom Wrap';
    if (webhook.line_items && webhook.line_items.length > 0) {
      productType = webhook.line_items[0].name || 'Custom Wrap';
    }

    // Extract design instructions from customer note
    const designInstructions = webhook.customer_note || '';

    // Check if project already exists
    const { data: existingProject } = await supabase
      .from('approveflow_projects')
      .select('id')
      .eq('order_number', orderNumber)
      .single();

    if (existingProject) {
      console.log('Project already exists for order:', orderNumber);
      return new Response(
        JSON.stringify({ message: 'Project already exists', projectId: existingProject.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new ApproveFlow project
    const { data: newProject, error: projectError } = await supabase
      .from('approveflow_projects')
      .insert({
        order_number: orderNumber,
        customer_name: customerName || 'Unknown Customer',
        customer_email: customerEmail,
        product_type: productType,
        design_instructions: designInstructions,
        order_total: orderTotal,
        status: 'design_requested',
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }

    console.log('Created ApproveFlow project:', newProject.id);

    // Extract uploaded files from order meta data
    if (webhook.meta_data && Array.isArray(webhook.meta_data)) {
      const fileUploads = webhook.meta_data.filter((meta: any) => 
        meta.key && meta.key.includes('file') && meta.value
      );

      for (const fileUpload of fileUploads) {
        const fileUrl = fileUpload.value;
        const fileType = fileUrl.split('.').pop()?.toLowerCase() || 'unknown';

        await supabase.from('approveflow_assets').insert({
          project_id: newProject.id,
          file_url: fileUrl,
          file_type: fileType,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId: newProject.id,
        orderNumber: orderNumber 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-wc-approveflow:', error);
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
