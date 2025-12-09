import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Internal test recipients only
const TEST_RECIPIENTS = [
  "hello@weprintwraps.com",
  "jackson@weprintwraps.com"
];

interface TestEmailRequest {
  stepId?: string;
  testMode?: boolean;
  // Legacy support
  testEmail?: string;
  campaignName?: string;
  campaignEvent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TestEmailRequest = await req.json();
    console.log("Received test email request:", body);

    // If stepId is provided, fetch the step data
    if (body.stepId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch the step data
      const { data: step, error: stepError } = await supabase
        .from('email_flow_steps')
        .select('*, email_flows(*)')
        .eq('id', body.stepId)
        .single();

      if (stepError || !step) {
        console.error("Failed to fetch step:", stepError);
        return new Response(
          JSON.stringify({ error: "Step not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const flow = step.email_flows;
      const subject = `[TEST] ${step.subject}`;
      const html = wrapEmailHTML(step.body_html, flow?.name || 'MightyMail');

      // Send to all test recipients
      const results = [];
      for (const recipient of TEST_RECIPIENTS) {
        try {
          const emailResponse = await resend.emails.send({
            from: "MightyMail <onboarding@resend.dev>",
            to: [recipient],
            subject: subject,
            html: html,
          });
          results.push({ recipient, success: true, response: emailResponse });
          console.log(`Test email sent to ${recipient}:`, emailResponse);
        } catch (err: any) {
          results.push({ recipient, success: false, error: err.message });
          console.error(`Failed to send to ${recipient}:`, err);
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Legacy support for old request format
    const { testEmail, campaignName, campaignEvent } = body;
    if (!testEmail || !campaignName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: stepId or (testEmail + campaignName)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = generateTestEmailHTML(campaignName, campaignEvent || 'customer_welcome');

    const emailResponse = await resend.emails.send({
      from: "MightyMail <onboarding@resend.dev>",
      to: [testEmail],
      subject: `[TEST] ${campaignName}`,
      html: html,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-mightymail-test function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function wrapEmailHTML(bodyHtml: string, flowName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0A0A0F; }
        .container { max-width: 600px; margin: 0 auto; background-color: #16161E; }
        .header { background: linear-gradient(135deg, #00AFFF 0%, #008CFF 50%, #4EEAFF 100%); padding: 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .test-banner { background: #F59E0B; color: black; text-align: center; padding: 8px; font-weight: bold; font-size: 12px; }
        .content { padding: 30px 20px; color: #E7E7EF; }
        .footer { padding: 20px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="test-banner">⚠️ TEST EMAIL - Not sent to customers</div>
        <div class="header">
          <h1>${flowName}</h1>
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
          <p style="color: #F59E0B; font-weight: bold;">This is a TEST email</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTestEmailHTML(campaignName: string, campaignEvent: string): string {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0A0A0F; }
      .container { max-width: 600px; margin: 0 auto; background-color: #16161E; }
      .header { background: linear-gradient(135deg, #00AFFF 0%, #008CFF 50%, #4EEAFF 100%); padding: 40px 20px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .content { padding: 40px 20px; color: #E7E7EF; }
      .content h2 { color: white; margin-top: 0; }
      .content p { line-height: 1.6; color: #B8B8C7; }
      .button { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #00AFFF 0%, #4EEAFF 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
      .footer { padding: 20px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
      .badge { display: inline-block; background-color: rgba(0, 175, 255, 0.1); color: #00AFFF; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 10px 0; }
    </style>
  `;

  const templates: Record<string, string> = {
    customer_welcome: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Welcome to WrapCommand!</h1>
        </div>
        <div class="content">
          <span class="badge">TEST MODE</span>
          <h2>Your Design Journey Begins</h2>
          <p>Thank you for choosing WrapCommand for your vehicle wrap project. We're excited to bring your vision to life!</p>
          <p>Our design team is already working on your custom proof. You'll receive a notification as soon as it's ready for review.</p>
          <a href="#" class="button">View Your Project</a>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
    default: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>${campaignName}</h1>
        </div>
        <div class="content">
          <span class="badge">TEST MODE</span>
          <h2>Test Email</h2>
          <p>This is a test email for the campaign: ${campaignName}</p>
          <p>Event type: ${campaignEvent}</p>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
  };

  return templates[campaignEvent] || templates.default;
}

serve(handler);
