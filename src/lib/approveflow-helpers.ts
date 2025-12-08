import { supabase } from '@/integrations/supabase/client';

/**
 * Create an ApproveFlow project from a MightyCustomer quote
 */
export async function createApproveFlowProjectFromQuote(
  quoteData: {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    productType: string;
    orderTotal: number;
    designInstructions?: string;
  }
) {
  try {
    const { data: project, error } = await supabase
      .from('approveflow_projects')
      .insert({
        customer_name: quoteData.customerName,
        customer_email: quoteData.customerEmail,
        order_number: quoteData.orderNumber,
        product_type: quoteData.productType,
        order_total: quoteData.orderTotal,
        design_instructions: quoteData.designInstructions,
        status: 'design_requested',
      })
      .select()
      .single();

    if (error) throw error;

    // Create automatic welcome chat message
    let welcomeMessage = `👋 Welcome to ApproveFlow! Your order #${quoteData.orderNumber} has been received.\n\n`;
    welcomeMessage += `⚠️ **Artwork Missing:** Please upload your design files to get started.\n\n`;
    
    if (quoteData.designInstructions && quoteData.designInstructions.trim()) {
      welcomeMessage += `📋 **Design Requirements:**\n${quoteData.designInstructions}\n\n`;
    } else {
      welcomeMessage += `📋 **Design Requirements:** No specific requirements provided.\n\n`;
    }
    
    welcomeMessage += `Our design team will review your order and get started as soon as we receive your artwork!`;
    
    await supabase.from('approveflow_chat').insert({
      project_id: project.id,
      sender: 'designer',
      message: welcomeMessage,
    });

    // Trigger event for Klaviyo notification
    await supabase.functions.invoke('approveflow-event', {
      body: {
        eventType: 'design_requested',
        projectId: project.id,
      },
    });

    // Send customer welcome email via Klaviyo (disabled by default for testing)
    const SEND_CUSTOMER_EMAILS = false; // Toggle this to enable customer emails
    
    if (SEND_CUSTOMER_EMAILS && quoteData.customerEmail) {
      const customerPortalUrl = `${window.location.origin}/customer/${project.id}`;
      
      await supabase.functions.invoke('send-klaviyo-event', {
        body: {
          eventName: 'approveflow_customer_welcome',
          customerEmail: quoteData.customerEmail,
          properties: {
            project_id: project.id,
            order_number: quoteData.orderNumber,
            customer_name: quoteData.customerName,
            product_type: quoteData.productType,
            portal_url: customerPortalUrl,
            order_total: quoteData.orderTotal,
          },
        },
      });
      
      console.log('Customer welcome email sent to:', quoteData.customerEmail);
    }

    return project;
  } catch (error: any) {
    console.error('Error creating ApproveFlow project:', error);
    throw error;
  }
}

/**
 * Save 3D render URLs to ApproveFlow project
 * Converts base64 data URLs to stored images for efficient loading
 */
export async function save3DRendersToApproveFlow(
  projectId: string,
  versionId: string,
  renderUrls: Record<string, string>
) {
  try {
    // Convert base64 data URLs to storage URLs
    const uploadedRenderUrls: Record<string, string> = {};
    
    for (const [angle, dataUrl] of Object.entries(renderUrls)) {
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
        // Extract base64 data from data URL
        const base64Data = dataUrl.split(',')[1];
        const mimeType = dataUrl.match(/data:(.*?);base64/)?.[1] || 'image/png';
        const fileExtension = mimeType.split('/')[1];
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Upload to storage
        const filename = `${projectId}/renders/${versionId}_${angle}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('approveflow-files')
          .upload(filename, blob, {
            contentType: mimeType,
            upsert: true,
          });
        
        if (uploadError) {
          console.error(`Failed to upload ${angle} render:`, uploadError);
          // Fall back to storing the data URL if upload fails
          uploadedRenderUrls[angle] = dataUrl;
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('approveflow-files')
            .getPublicUrl(filename);
          
          uploadedRenderUrls[angle] = publicUrl;
        }
      } else {
        // Already a URL, keep as is
        uploadedRenderUrls[angle] = dataUrl;
      }
    }
    
    const { data, error } = await supabase
      .from('approveflow_3d')
      .insert({
        project_id: projectId,
        version_id: versionId,
        render_urls: uploadedRenderUrls,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger event for Klaviyo + WooCommerce notification
    await supabase.functions.invoke('approveflow-event', {
      body: {
        eventType: '3d_render_ready',
        projectId,
        versionId,
        renderUrls: uploadedRenderUrls,
      },
    });

    return data;
  } catch (error: any) {
    console.error('Error saving 3D renders:', error);
    throw error;
  }
}
