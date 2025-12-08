import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { loadTradeDNA } from "../_shared/tradedna-loader.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProofEmailRequest {
  projectId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  proofUrl: string;
  renderUrls?: Record<string, string>;
  portalUrl: string;
  organizationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      projectId, 
      customerEmail, 
      customerName, 
      orderNumber, 
      proofUrl, 
      renderUrls,
      portalUrl,
      organizationId
    }: ProofEmailRequest = await req.json();

    console.log('Sending proof email to:', customerEmail);

    // Load TradeDNA for brand styling
    const tradeDNA = await loadTradeDNA(organizationId);
    const businessName = tradeDNA.business_name || "Your Wrap Provider";

    // Build render images HTML if available
    let renderImagesHtml = '';
    if (renderUrls && Object.keys(renderUrls).length > 0) {
      renderImagesHtml = `
        <h2 style="color: #2F81F7; margin-top: 30px; margin-bottom: 15px;">3D Renders</h2>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
          ${Object.entries(renderUrls).map(([angle, url]) => `
            <img src="${url}" alt="${angle} view" style="width: 200px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
          `).join('')}
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Design Proof is Ready</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: linear-gradient(135deg, #2F81F7 0%, #15D1FF 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Design Proof Ready!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your design proof for <strong>Order #${orderNumber}</strong> is ready for review!
            </p>

            <h2 style="color: #2F81F7; margin-top: 30px; margin-bottom: 15px;">2D Design Proof</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <img src="${proofUrl}" alt="Design Proof" style="width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
            </div>

            ${renderImagesHtml}

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2F81F7; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>Next Steps:</strong><br>
                Review the design and let us know if you'd like to approve it or request any changes.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #2F81F7 0%, #15D1FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View & Approve Design
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              Have questions? Simply reply to this email or chat with us in your portal.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Best regards,<br>
              <strong>The ${businessName} Design Team</strong>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
            <p>This email was sent regarding your order with us. If you have any questions, please contact support.</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ApproveFlow <onboarding@resend.dev>',
        to: [customerEmail],
        subject: `Your Design Proof is Ready - Order #${orderNumber}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log("Proof email sent successfully:", emailData);

    // Log email to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('approveflow_email_logs').insert({
      project_id: projectId,
      email_type: 'proof_delivered',
      recipient_email: customerEmail,
      subject: `Your Design Proof is Ready - Order #${orderNumber}`,
      status: 'sent',
      provider: 'resend',
      metadata: {
        proof_url: proofUrl,
        has_3d_renders: !!renderUrls,
        portal_url: portalUrl,
        email_id: emailData.id
      }
    });

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approveflow-proof function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
