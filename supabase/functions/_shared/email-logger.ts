import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Helper function to log email sends to the approveflow_email_logs table
 * Call this after sending any email from ApproveFlow edge functions
 */
export async function logApproveFlowEmail(params: {
  projectId: string;
  emailType: string; // 'proof_delivered', 'revision_requested', 'design_approved', '3d_render_ready', 'chat_message'
  recipientEmail: string;
  subject: string;
  status?: string; // 'pending', 'sent', 'delivered', 'failed'
  provider?: string; // 'klaviyo', 'resend', 'manual'
  metadata?: any;
  errorMessage?: string;
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("approveflow_email_logs")
      .insert({
        project_id: params.projectId,
        email_type: params.emailType,
        recipient_email: params.recipientEmail,
        subject: params.subject,
        status: params.status || 'sent',
        provider: params.provider || 'klaviyo',
        metadata: params.metadata || {},
        error_message: params.errorMessage,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging email:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to log email:", error);
    return null;
  }
}

/**
 * Update email log status (for tracking opens, clicks, deliveries)
 */
export async function updateEmailLogStatus(params: {
  emailLogId: string;
  status: 'delivered' | 'opened' | 'clicked' | 'failed';
  errorMessage?: string;
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateData: any = {
      status: params.status,
    };

    // Set timestamp fields based on status
    if (params.status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (params.status === 'opened') {
      updateData.opened_at = new Date().toISOString();
    } else if (params.status === 'clicked') {
      updateData.clicked_at = new Date().toISOString();
    } else if (params.status === 'failed' && params.errorMessage) {
      updateData.error_message = params.errorMessage;
    }

    const { data, error } = await supabase
      .from("approveflow_email_logs")
      .update(updateData)
      .eq('id', params.emailLogId)
      .select()
      .single();

    if (error) {
      console.error("Error updating email log:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to update email log:", error);
    return null;
  }
}
