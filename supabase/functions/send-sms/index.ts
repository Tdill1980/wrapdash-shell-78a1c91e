// Send SMS via Twilio
// Used by Website Quotes Manager to send follow-up texts to customers

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, quote_id } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: to, message'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('[SendSMS] Missing Twilio credentials');
      return new Response(JSON.stringify({
        error: 'SMS service not configured. Please add Twilio credentials to Supabase secrets.',
        missing: {
          TWILIO_ACCOUNT_SID: !twilioAccountSid,
          TWILIO_AUTH_TOKEN: !twilioAuthToken,
          TWILIO_PHONE_NUMBER: !twilioPhoneNumber
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format phone number (ensure it starts with +1 for US)
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log(`[SendSMS] Sending to ${formattedPhone}`);

    // Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('[SendSMS] Twilio error:', twilioResult);
      return new Response(JSON.stringify({
        error: 'Failed to send SMS',
        details: twilioResult.message || twilioResult.error_message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[SendSMS] Success! SID: ${twilioResult.sid}`);

    // Log SMS in database if quote_id provided
    if (quote_id) {
      try {
        const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Update quote with SMS activity
        await supabase
          .from('quotes')
          .update({
            last_activity: new Date().toISOString(),
            follow_up_count: supabase.rpc('increment_follow_up', { quote_id })
          })
          .eq('id', quote_id);

        // Log the SMS as an AI action
        await supabase
          .from('ai_actions')
          .insert({
            action_type: 'sms_sent',
            action_payload: {
              quote_id,
              to: formattedPhone,
              message_preview: message.substring(0, 100),
              twilio_sid: twilioResult.sid
            },
            organization_id: '51aa96db-c06d-41ae-b3cb-25b045c75caf',
            priority: 'normal',
            resolved: true,
            resolved_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.warn('[SendSMS] Failed to log SMS activity:', dbError);
        // Don't fail the request - SMS was sent successfully
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message_sid: twilioResult.sid,
      to: formattedPhone
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SendSMS] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
