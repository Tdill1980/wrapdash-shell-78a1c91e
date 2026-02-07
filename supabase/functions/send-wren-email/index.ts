// Send Wren Re-engagement Email - Personalized follow-ups for neglected leads
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  customer_name?: string;
  email_type: 'courtesy' | 'frustrated' | 'bulk' | 'followup';
  coupon_code?: string;     // e.g., "WREN5" or "WREN10"
  discount_amount?: string; // e.g., "5%" or "10%"
  vehicle_info?: string;    // If we have it
  sqft?: number;
}

const buildEmailHTML = (params: EmailRequest): string => {
  const name = params.customer_name?.split(' ')[0] || 'there';
  const couponSection = params.coupon_code ? `
    <div style="background: linear-gradient(135deg, #e6007e 0%, #ff4d94 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <div style="color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Code</div>
      <div style="color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 3px; margin: 10px 0;">${params.coupon_code}</div>
      <div style="color: #fff; font-size: 16px;">${params.discount_amount} OFF your order</div>
    </div>
  ` : '';

  let subject = "Still thinking about that wrap?";
  let mainMessage = "";

  switch (params.email_type) {
    case 'frustrated':
      subject = "We want to make this right";
      mainMessage = `
        <p>Hey ${name},</p>
        <p>I noticed your chat experience on our site wasn't as smooth as it should have been. That's on us, and I want to make it right.</p>
        <p>Here's a <strong>${params.discount_amount} discount</strong> as our apology. No strings attached.</p>
        ${couponSection}
        <p>If you want to give us another shot, just reply to this email with your vehicle details (year, make, model) and I'll personally make sure you get accurate pricing fast.</p>
      `;
      break;

    case 'bulk':
      subject = "Big project? Here's 10% off";
      mainMessage = `
        <p>Hey ${name},</p>
        <p>I saw you were looking at wrapping ${params.vehicle_info || 'a larger vehicle'} — that's a solid project!</p>
        <p>For jobs over 500 sqft, we want to hook you up with our bulk pricing: <strong>${params.discount_amount} OFF</strong>.</p>
        ${couponSection}
        <p>Ready to move forward? Just reply to this email or hop back on chat and I'll get you squared away.</p>
      `;
      break;

    case 'courtesy':
      subject = "Still thinking about that wrap?";
      mainMessage = `
        <p>Hey ${name},</p>
        <p>We noticed you were checking out wrap pricing on our site but didn't finish your quote. No pressure — just wanted to make sure you got what you needed.</p>
        ${params.coupon_code ? `<p>As a thank you for your interest, here's a little something:</p>${couponSection}` : ''}
        <p>If you let us know your vehicle (year, make, model), I can send you exact pricing in about 30 seconds.</p>
        <p>Just reply to this email with your vehicle info, or hop back on chat:</p>
        <p><a href="https://weprintwraps.com" style="color: #e6007e; font-weight: bold;">weprintwraps.com</a></p>
      `;
      break;

    default: // followup
      subject = "Your wrap quote is waiting";
      mainMessage = `
        <p>Hey ${name},</p>
        <p>Just following up on your wrap inquiry. If you're still interested, I'd love to help you get this project rolling.</p>
        ${params.vehicle_info ? `<p>For your <strong>${params.vehicle_info}</strong>:</p>` : '<p>Just tell me your vehicle (year, make, model) and I\'ll get you exact pricing.</p>'}
        <p>Reply to this email or chat with us at <a href="https://weprintwraps.com" style="color: #e6007e;">weprintwraps.com</a></p>
      `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <!-- Header -->
    <div style="background: #0a0a0a; padding: 24px; text-align: center;">
      <img src="https://weprintwraps.com/wp-content/uploads/2024/01/wpw-logo-white.png" alt="WePrintWraps" style="height: 40px;">
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px; color: #333;">
      ${mainMessage}
      
      <p style="margin-top: 32px;">
        — Wren<br>
        <span style="color: #666; font-size: 14px;">WePrintWraps.com</span>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #fafafa; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e5e5;">
      <div style="margin-bottom: 12px;">
        <a href="https://weprintwraps.com" style="color: #e6007e; text-decoration: none; font-size: 13px; font-weight: 500;">Shop Now</a>
        <span style="color: #d4d4d4; margin: 0 10px;">|</span>
        <a href="https://weprintwraps.com/faqs/" style="color: #737373; text-decoration: none; font-size: 13px;">FAQs</a>
      </div>
      <div style="font-size: 11px; color: #a3a3a3;">
        WePrintWraps • We print. You install. Let's go.
      </div>
    </div>
  </div>
</body>
</html>
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();
    
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html = buildEmailHTML(body);
    
    // Determine subject based on email type
    let subject = "Still thinking about that wrap?";
    switch (body.email_type) {
      case 'frustrated': subject = "We want to make this right"; break;
      case 'bulk': subject = "Big project? Here's 10% off"; break;
      case 'courtesy': subject = body.coupon_code ? "A little something for you" : "Still thinking about that wrap?"; break;
    }

    console.log('[send-wren-email] Sending to:', body.to, 'type:', body.email_type);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wren at WePrintWraps <hello@weprintwraps.com>',
        to: [body.to],
        subject,
        html
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[send-wren-email] Resend error:', result);
      return new Response(JSON.stringify({ error: result.message || 'Failed to send email', details: result }), {
        status: response.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('[send-wren-email] Email sent:', result.id);

    return new Response(JSON.stringify({ success: true, email_id: result.id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error('[send-wren-email] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
