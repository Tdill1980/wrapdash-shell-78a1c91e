/**
 * notify-art-upload - Sends SMS + Email when customer uploads artwork
 * 
 * ShopFlow 2.0: Upload = Source of Truth notification
 * Triggered after successful file upload to shopflow-files bucket
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  file_count: number;
  file_names: string[];
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER') || '+18885551234';

  if (!twilioSid || !twilioToken) {
    console.log('Twilio not configured, skipping SMS');
    return false;
  }

  // Clean phone number
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '1' + cleanPhone;
  }
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: cleanPhone,
          From: twilioFrom,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return false;
    }

    console.log(`✅ SMS sent to ${cleanPhone}`);
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

async function sendEmail(email: string, orderNumber: string, customerName: string, fileCount: number): Promise<boolean> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendKey) {
    console.log('Resend not configured, skipping email');
    return false;
  }

  const trackingUrl = `https://wrapcommandai.com/track/${orderNumber}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://weprintwraps.com/wp-content/uploads/2023/01/wpw-logo-white.png" alt="WePrintWraps" style="height: 40px; width: auto;">
    </div>
    
    <!-- Main Card -->
    <div style="background: linear-gradient(135deg, rgba(255,0,255,0.1) 0%, rgba(157,78,221,0.1) 50%, rgba(47,129,247,0.1) 100%); border: 1px solid rgba(255,0,255,0.3); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
          Files Received!
        </h1>
        <p style="color: rgba(255,255,255,0.7); font-size: 16px; margin: 0 0 24px 0;">
          We got your artwork for Order #${orderNumber}
        </p>
        
        <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: rgba(255,0,255,0.9); font-size: 32px; font-weight: 700; margin: 0;">
            ${fileCount} ${fileCount === 1 ? 'File' : 'Files'}
          </p>
          <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 8px 0 0 0;">
            Successfully uploaded
          </p>
        </div>
        
        <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(90deg, #FF00FF 0%, #9D4EDD 50%, #2F81F7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Track Your Order →
        </a>
      </div>
    </div>
    
    <!-- What's Next -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        What happens next?
      </h2>
      <ol style="color: rgba(255,255,255,0.7); font-size: 14px; padding-left: 20px; margin: 0;">
        <li style="margin-bottom: 8px;">Our design team reviews your files</li>
        <li style="margin-bottom: 8px;">We prepare your print-ready artwork</li>
        <li style="margin-bottom: 8px;">You'll get a proof to approve (if applicable)</li>
        <li style="margin-bottom: 0;">Production begins once approved!</li>
      </ol>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 8px 0;">
        Questions? Reply to this email or text us at (480) 360-7177
      </p>
      <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">
        WePrintWraps.com • Premium Wrap Printing
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WePrintWraps <hello@weprintwraps.com>',
        to: email,
        subject: `✅ Files Received - Order #${orderNumber}`,
        html: htmlContent,
        reply_to: 'hello@weprintwraps.com',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return false;
    }

    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotifyRequest = await req.json();
    const { order_number, customer_name, customer_email, customer_phone, file_count, file_names } = payload;

    console.log(`📤 Notifying customer for order ${order_number}: ${file_count} files uploaded`);

    const results = {
      sms_sent: false,
      email_sent: false,
    };

    // Send SMS if phone available
    if (customer_phone) {
      const firstName = customer_name.split(' ')[0] || 'there';
      const smsMessage = `Hey ${firstName}! ✅ We got your ${file_count} file${file_count !== 1 ? 's' : ''} for Order #${order_number}. Track your order: wrapcommandai.com/track/${order_number} - WePrintWraps`;
      results.sms_sent = await sendSMS(customer_phone, smsMessage);
    }

    // Send email
    if (customer_email) {
      results.email_sent = await sendEmail(customer_email, order_number, customer_name, file_count);
    }

    // Log to shopflow_logs
    await supabase.from('shopflow_logs').insert({
      order_id: null, // Will be linked via order_number if needed
      event_type: 'art_upload_notification',
      payload: {
        order_number,
        customer_email,
        customer_phone,
        file_count,
        file_names,
        ...results,
      },
    });

    // Send Klaviyo event
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (klaviyoKey && customer_email) {
      await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              profile: { data: { type: 'profile', attributes: { email: customer_email } } },
              metric: { data: { type: 'metric', attributes: { name: 'ShopFlow Art Uploaded' } } },
              properties: {
                order_number,
                file_count,
                file_names,
                tracking_url: `https://wrapcommandai.com/track/${order_number}`,
              },
              time: new Date().toISOString()
            }
          }
        })
      });
    }

    console.log(`✅ Notification complete:`, results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
