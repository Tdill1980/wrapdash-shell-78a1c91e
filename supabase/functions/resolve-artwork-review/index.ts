// Resolve Artwork Review Edge Function
// Handles artwork review resolution with optional email response

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      action_id,
      resolution_type, // 'quote' | 'design_fee' | 'reviewed_only'
      quote_id,
      quote_number,
      send_email,
      email_subject,
      email_body,
      customer_email,
      customer_name,
    } = body;

    console.log('[ResolveArtwork] Received:', { 
      action_id, 
      resolution_type, 
      send_email, 
      customer_email 
    });

    // Validate required fields
    if (!action_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'action_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the artwork review record
    const { data: actionRecord, error: fetchError } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('id', action_id)
      .single();

    if (fetchError || !actionRecord) {
      console.error('[ResolveArtwork] Failed to fetch action:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Artwork review not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Mark as resolved
    const { error: updateError } = await supabase
      .from('ai_actions')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        status: resolution_type === 'quote' ? 'quote_sent' : 
                resolution_type === 'design_fee' ? 'design_fee_sent' : 'reviewed',
      })
      .eq('id', action_id);

    if (updateError) {
      console.error('[ResolveArtwork] Failed to update action:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to resolve review' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Send email if requested
    let emailSent = false;
    if (send_email && customer_email && email_body && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const payload = actionRecord.action_payload as any;
        
        // Build email HTML
        const emailHtml = `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#e6007e,#ff4d94);padding:20px;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:20px;">📎 Artwork Review Complete</h1>
            </div>
            <div style="background:#f8fafc;padding:20px;border:1px solid #e2e8f0;border-top:none;">
              <p style="margin:0 0 16px;color:#374151;">Hi ${customer_name || 'there'},</p>
              
              <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;">
                <p style="margin:0;white-space:pre-wrap;">${email_body}</p>
              </div>

              ${quote_number ? `
                <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin-bottom:16px;">
                  <h3 style="margin:0 0 8px;font-size:14px;color:#065f46;">📋 Quote Attached</h3>
                  <p style="margin:0;">Quote #${quote_number}</p>
                </div>
              ` : ''}

              <p style="margin:16px 0 0;color:#6b7280;font-size:14px;">
                Questions? Reply to this email or visit weprintwraps.com
              </p>
            </div>
            <div style="padding:12px;text-align:center;color:#94a3b8;font-size:12px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
              WePrintWraps Design Team
            </div>
          </div>
        `;

        await resend.emails.send({
          from: 'WePrintWraps Design <hello@weprintwraps.com>',
          to: [customer_email],
          subject: email_subject || 'Your Artwork Review is Complete',
          html: emailHtml
        });

        emailSent = true;
        console.log('[ResolveArtwork] Email sent to:', customer_email);
      } catch (emailErr) {
        console.error('[ResolveArtwork] Email send failed:', emailErr);
      }
    }

    // If quote was attached, update quote status to 'sent' if applicable
    if (quote_id) {
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', quote_id)
        .eq('status', 'draft'); // Only update if still in draft

      if (quoteError) {
        console.error('[ResolveArtwork] Failed to update quote status:', quoteError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resolved: true,
        email_sent: emailSent,
        resolution_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ResolveArtwork] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
