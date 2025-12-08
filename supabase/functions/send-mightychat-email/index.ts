import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadTradeDNA } from "../_shared/tradedna-loader.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Configurable sender email - defaults to Resend dev domain, can be overridden with verified domain
const FROM_EMAIL = Deno.env.get("MIGHTYCHAT_FROM_EMAIL") || "onboarding@resend.dev";
const FROM_NAME = Deno.env.get("MIGHTYCHAT_FROM_NAME") || "WePrintWraps";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  conversationId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  content: string;
  senderName?: string;
  organizationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      conversationId, 
      recipientEmail, 
      recipientName,
      subject, 
      content,
      senderName = "WrapCommand",
      organizationId
    }: SendEmailRequest = await req.json();

    // Load TradeDNA for brand styling
    const tradeDNA = await loadTradeDNA(organizationId);
    const businessName = tradeDNA.business_name || "WePrintWraps";

    console.log("📧 Sending email via MightyChat:", {
      conversationId,
      recipientEmail,
      subject: subject?.substring(0, 50),
    });

    // Validate required fields
    if (!conversationId || !recipientEmail || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: conversationId, recipientEmail, content" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert message with 'sending' status first
    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content,
        channel: "email",
        direction: "outbound",
        status: "sending",
        sender_name: senderName,
        sender_email: "noreply@wrapcommand.ai",
        metadata: { subject, recipient_email: recipientEmail },
      })
      .select()
      .single();

    if (messageError) {
      console.error("❌ Failed to create message record:", messageError);
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    console.log("✅ Message record created:", messageData.id);

    // Send email via Resend with configurable sender
    const actualSenderName = senderName || FROM_NAME;
    const emailResponse = await resend.emails.send({
      from: `${actualSenderName} <${FROM_EMAIL}>`,
      to: [recipientEmail],
      subject: subject || `Message from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #405DE6, #833AB4, #E1306C); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${businessName}</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${recipientName || "there"},</p>
            <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${content}</div>
          </div>
          <div style="padding: 20px; background: #333; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">Sent via MightyChat™ by ${businessName}</p>
          </div>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    // Update message status to 'delivered'
    const { error: updateError } = await supabase
      .from("messages")
      .update({ status: "delivered" })
      .eq("id", messageData.id);

    if (updateError) {
      console.error("⚠️ Failed to update message status:", updateError);
    }

    // Update conversation's last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    console.log("✅ MightyChat email flow completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageData.id,
        emailResponse
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("❌ Error in send-mightychat-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
