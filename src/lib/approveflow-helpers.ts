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

    // Trigger event for Klaviyo notification
    await supabase.functions.invoke('approveflow-event', {
      body: {
        eventType: 'design_requested',
        projectId: project.id,
      },
    });

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
