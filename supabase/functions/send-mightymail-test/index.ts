import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  testEmail: string;
  campaignName: string;
  campaignEvent: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail, campaignName, campaignEvent }: TestEmailRequest = await req.json();

    if (!testEmail || !campaignName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: testEmail, campaignName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate test email HTML based on campaign type
    const html = generateTestEmailHTML(campaignName, campaignEvent);

    const emailResponse = await resend.emails.send({
      from: "MightyMail <onboarding@resend.dev>",
      to: [testEmail],
      subject: `[TEST] ${campaignName}`,
      html: html,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-mightymail-test function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

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
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our designers create your custom proof</li>
            <li>You review and approve the design</li>
            <li>We print and ship your wrap</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
    proof_ready: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Your Proof is Ready! 🎨</h1>
        </div>
        <div class="content">
          <span class="badge">TEST MODE</span>
          <h2>Time to Review Your Design</h2>
          <p>Great news! Your custom wrap design is ready for review.</p>
          <p>Click the button below to view your proof and let us know what you think. You can approve it or request revisions.</p>
          <a href="#" class="button">Review Your Proof</a>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Review the design carefully</li>
            <li>Request changes if needed (unlimited revisions)</li>
            <li>Approve when you're 100% satisfied</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
    design_approved: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Design Approved! ✓</h1>
        </div>
        <div class="content">
          <span class="badge">TEST MODE</span>
          <h2>Moving to Production</h2>
          <p>Excellent! Your design has been approved and is now moving into production.</p>
          <p>Our production team will print your wrap with precision and care. You'll receive a shipping notification with tracking information as soon as your order ships.</p>
          <a href="#" class="button">Track Your Order</a>
          <p><strong>Production Timeline:</strong></p>
          <ul>
            <li>Printing: 2-3 business days</li>
            <li>Quality check: 1 business day</li>
            <li>Shipping: 2-5 business days</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
    shipping_notification: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>Your Order Has Shipped! 📦</h1>
        </div>
        <div class="content">
          <span class="badge">TEST MODE</span>
          <h2>On Its Way to You</h2>
          <p>Great news! Your wrap has been shipped and is on its way.</p>
          <p><strong>Tracking Number:</strong> TEST123456789</p>
          <a href="#" class="button">Track Package</a>
          <p><strong>Installation Tips:</strong></p>
          <ul>
            <li>Clean surface thoroughly before application</li>
            <li>Work in a temperature-controlled environment (70-80°F)</li>
            <li>Use a heat gun for best results</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
    '3d_render_ready': `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <h1>3D Render Complete! 🚗</h1>
        </div>
        <div class="content">
          <span class="badge">TEST MODE</span>
          <h2>See Your Wrap in 3D</h2>
          <p>Your custom 3D render is now available! See exactly how your wrap will look on your vehicle from every angle.</p>
          <a href="#" class="button">View 3D Render</a>
          <p><strong>Included Views:</strong></p>
          <ul>
            <li>Hero shot (front 3/4 view)</li>
            <li>Side profile</li>
            <li>Rear view</li>
            <li>Detail shots</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2025 WrapCommand™. Powered by MightyMail™</p>
        </div>
      </div>
    `,
  };

  return templates[campaignEvent] || templates.customer_welcome;
}

serve(handler);
