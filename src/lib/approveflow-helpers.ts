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
 */
export async function save3DRendersToApproveFlow(
  projectId: string,
  versionId: string,
  renderUrls: Record<string, string>
) {
  try {
    const { data, error } = await supabase
      .from('approveflow_3d')
      .insert({
        project_id: projectId,
        version_id: versionId,
        render_urls: renderUrls,
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
        renderUrls,
      },
    });

    return data;
  } catch (error: any) {
    console.error('Error saving 3D renders:', error);
    throw error;
  }
}
