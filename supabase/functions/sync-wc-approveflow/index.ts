import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email kill switch - set to true when ready for production
const SEND_CUSTOMER_EMAILS = false;

// Function to check if product is a design product
function isDesignProduct(productName: string): boolean {
  const designKeywords = [
    'Full Vehicle Wrap Design',
    'Hourly Design',
    'Custom Vehicle Wrap Design',
    'Vehicle Wrap Design'
  ];
  return designKeywords.some(keyword => 
    productName.toLowerCase().includes(keyword.toLowerCase())
  );
}

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
    
    // Check if order contains design products (by product name)
    let hasDesignProduct = false;
    let productType = 'Custom Wrap';
    
    if (webhook.line_items && webhook.line_items.length > 0) {
      for (const item of webhook.line_items) {
        const itemName = item.name || '';
        if (isDesignProduct(itemName)) {
          hasDesignProduct = true;
          productType = itemName;
          console.log('✅ Design product found:', itemName);
          break;
        }
      }
    }
    
    // Only process design product orders
    if (!hasDesignProduct) {
      console.log('⚠️ Order does not contain design products - skipping ApproveFlow sync for order:', orderNumber);
      console.log('   Product types in order:', webhook.line_items?.map((i: any) => i.name).join(', '));
      return new Response(
        JSON.stringify({ 
          message: 'Order does not contain design products', 
          orderNumber: orderNumber,
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Design product found in order:', orderNumber, '- Product:', productType);

    // Extract design requirements from meta_data (more flexible search)
    let designRequirements = webhook.customer_note || '';
    
    console.log('🔍 Extracting data from meta_data:', webhook.meta_data?.length || 0, 'fields');
    
    if (webhook.meta_data && Array.isArray(webhook.meta_data)) {
      // Log all meta_data keys for debugging
      webhook.meta_data.forEach((meta: any) => {
        console.log('  Meta key:', meta.key, '| Value length:', meta.value?.length || 0);
      });
      
      // Look for design requirements field (case-insensitive, flexible matching)
      const designField = webhook.meta_data.find((meta: any) => 
        meta.key && (
          meta.key.toLowerCase().includes('describe') ||
          meta.key.toLowerCase().includes('design') ||
          meta.key.toLowerCase().includes('project') ||
          meta.key.toLowerCase().includes('requirements') ||
          meta.key.toLowerCase().includes('instructions')
        )
      );
      
      if (designField && designField.value) {
        designRequirements = designField.value;
        console.log('✅ Found design requirements in meta_data:', designRequirements.substring(0, 100) + '...');
      }
    }

    // Extract vehicle info from meta_data OR parse from design requirements text
    let vehicleInfo = null;
    if (webhook.meta_data && Array.isArray(webhook.meta_data)) {
      const vehicleFields = {
        year: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('year'))?.value,
        make: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('make'))?.value,
        model: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('model'))?.value,
        type: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('type') || m.key?.toLowerCase().includes('vehicle_type'))?.value,
      };
      
      if (vehicleFields.make || vehicleFields.model) {
        vehicleInfo = vehicleFields;
      }
    }
    
    // If no vehicle info found in meta_data, try to extract from design requirements text
    if (!vehicleInfo && designRequirements) {
      const yearMatch = designRequirements.match(/\b(19|20)\d{2}\b/);
      const makeModelMatch = designRequirements.match(/\b(19|20)\d{2}\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+([A-Z][A-Z0-9-]+)/i);
      
      if (makeModelMatch) {
        vehicleInfo = {
          year: makeModelMatch[1],
          make: makeModelMatch[2],
          model: makeModelMatch[3],
          type: null
        };
        console.log('📍 Extracted vehicle from text:', vehicleInfo);
      }
    }

    // Extract color info from meta_data OR parse from design requirements text
    let colorInfo = null;
    if (webhook.meta_data && Array.isArray(webhook.meta_data)) {
      const colorFields = {
        color: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('color') && !m.key?.toLowerCase().includes('type'))?.value,
        color_hex: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('hex'))?.value,
        finish: webhook.meta_data.find((m: any) => m.key?.toLowerCase().includes('finish'))?.value,
      };
      
      if (colorFields.color || colorFields.color_hex) {
        colorInfo = colorFields;
      }
    }
    
    // If no color info found in meta_data, try to extract from design requirements text
    if (!colorInfo && designRequirements) {
      const colorMatch = designRequirements.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is the color|color)/i);
      const finishMatch = designRequirements.match(/(gloss|satin|matte)\s+(?:finish)?/i);
      const codeMatch = designRequirements.match(/3M\s+([\d-]+)/i);
      
      if (colorMatch || finishMatch || codeMatch) {
        colorInfo = {
          color: colorMatch ? colorMatch[1] : null,
          finish: finishMatch ? finishMatch[1] : null,
          color_hex: codeMatch ? codeMatch[1] : null
        };
        console.log('🎨 Extracted color from text:', colorInfo);
      }
    }

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
    console.log('💾 Saving project with:', {
      orderNumber,
      customerName,
      designRequirements: designRequirements?.substring(0, 100),
      vehicleInfo,
      colorInfo
    });
    
    const { data: newProject, error: projectError } = await supabase
      .from('approveflow_projects')
      .insert({
        order_number: orderNumber,
        customer_name: customerName || 'Unknown Customer',
        customer_email: customerEmail,
        product_type: productType,
        design_instructions: designRequirements,
        order_total: orderTotal,
        status: 'design_requested',
        vehicle_info: vehicleInfo,
        color_info: colorInfo,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }

    console.log('Created ApproveFlow project:', newProject.id);

    // Extract uploaded files from order meta data
    const uploadedFiles: any[] = [];
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
        
        uploadedFiles.push({ url: fileUrl, type: fileType });
      }
    }

    // designRequirements already extracted above - no need to re-extract

    // Create automatic welcome chat message
    const hasArtwork = uploadedFiles.length > 0;
    
    let welcomeMessage = `👋 Welcome to ApproveFlow! Your order #${orderNumber} has been received.\n\n`;
    
    // Add file status
    if (hasArtwork) {
      welcomeMessage += `✅ **Artwork Received:** We've received ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} from you. Thank you!\n\n`;
    } else {
      welcomeMessage += `⚠️ **Artwork Missing:** We haven't received any design files yet. Please upload your artwork or email it to us to get started.\n\n`;
    }
    
    // Add design requirements
    if (designRequirements && designRequirements.trim()) {
      welcomeMessage += `📋 **Design Requirements:**\n${designRequirements}\n\n`;
    } else {
      welcomeMessage += `📋 **Design Requirements:** No specific requirements provided.\n\n`;
    }
    
    welcomeMessage += `Our design team will review your order and get started right away. We'll keep you updated here on your progress!`;
    
    // Insert welcome message into chat
    await supabase.from('approveflow_chat').insert({
      project_id: newProject.id,
      sender: 'designer',
      message: welcomeMessage,
    });
    
    console.log('Created welcome chat message for project:', newProject.id);

    // Send customer welcome email via Klaviyo (DISABLED until production ready)
    if (SEND_CUSTOMER_EMAILS && customerEmail) {
      const customerPortalUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').split('.supabase.co')[0]}.lovable.app/customer/${newProject.id}`;
      
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-klaviyo-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          eventName: 'approveflow_customer_welcome',
          customerEmail: customerEmail,
          properties: {
            project_id: newProject.id,
            order_number: orderNumber,
            customer_name: customerName || 'Valued Customer',
            product_type: productType,
            portal_url: customerPortalUrl,
            order_total: orderTotal,
            design_requirements: designRequirements || 'No specific requirements provided',
            has_artwork: hasArtwork,
            artwork_count: uploadedFiles.length,
            uploaded_files: uploadedFiles,
            artwork_message: hasArtwork 
              ? `Thank you for uploading ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}! We have received your artwork and will begin working on your design.`
              : 'We noticed you haven\'t uploaded any artwork yet. Please upload your files through your customer portal or email them to us to get started.',
          },
        }),
      });
      
      console.log('Customer welcome email sent to:', customerEmail);
    } else if (!SEND_CUSTOMER_EMAILS && customerEmail) {
      console.log('Customer emails disabled - skipping welcome email for:', customerEmail);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId: newProject.id,
        orderNumber: orderNumber,
        filesUploaded: uploadedFiles.length
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
