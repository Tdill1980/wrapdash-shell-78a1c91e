// Send Admin Reply Edge Function
// Sends email replies to customers and logs to conversation_events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, to_email, to_name, subject, body } = await req.json();

    console.log('[SendAdminReply] Received request:', { conversation_id, to_email, subject: subject?.substring(0, 50) });

    // Validate required fields
    if (!conversation_id || !to_email || !subject || !body) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: conversation_id, to_email, subject, body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!resendKey) {
      console.error('[SendAdminReply] RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resend = new Resend(resendKey);

    // Build HTML email
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .logo { text-align: center; margin-bottom: 20px; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <strong>WePrintWraps</strong>
    </div>
    <div class="content">
      ${to_name ? `<p>Hi ${to_name},</p>` : '<p>Hi there,</p>'}
      ${body.split('\n').map((p: string) => p.trim() ? `<p>${p}</p>` : '').join('')}
    </div>
    <div class="footer">
      <p>WePrintWraps.com | Premium Vehicle Wraps</p>
      <p>This email was sent in response to your inquiry.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email via Resend
    console.log('[SendAdminReply] Sending email to:', to_email);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'WePrintWraps Team <hello@weprintwraps.com>',
      to: [to_email],
      subject: subject,
      html: htmlBody,
    });

    if (emailError) {
      console.error('[SendAdminReply] Resend error:', emailError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to send email: ${emailError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[SendAdminReply] Email sent successfully:', emailData?.id);

    // Log email_sent event to conversation_events
    const sentAt = new Date().toISOString();
    
    const { error: eventError } = await supabase
      .from('conversation_events')
      .insert({
        conversation_id: conversation_id,
        event_type: 'email_sent',
        actor: 'admin',
        payload: {
          email_sent_to: [to_email],
          email_subject: subject,
          email_body: body.substring(0, 2000), // Truncate for storage
          email_sent_at: sentAt,
          customer_email: to_email,
          customer_name: to_name || null,
          resend_id: emailData?.id || null,
        },
      });

    if (eventError) {
      console.error('[SendAdminReply] Failed to log event:', eventError);
      // Don't fail the request - email was sent successfully
    } else {
      console.log('[SendAdminReply] Event logged successfully');
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: sentAt })
      .eq('id', conversation_id);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailData?.id,
      sent_at: sentAt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[SendAdminReply] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
