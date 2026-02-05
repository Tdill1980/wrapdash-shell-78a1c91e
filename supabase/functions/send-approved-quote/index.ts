import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveQuoteRequest {
  actionId: string;
  quoteId?: string;
  customerEmail?: string;
  customerName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ApproveQuoteRequest = await req.json();
    const { actionId, quoteId: providedQuoteId, customerEmail: providedEmail, customerName: providedName } = body;

    console.log('📧 Approving quote and sending email:', { actionId, providedQuoteId });

    if (!actionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing actionId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the AI action to find quote details
    const { data: action, error: actionError } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('id', actionId)
      .single();

    if (actionError || !action) {
      console.error('Action not found:', actionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Action not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const payload = action.action_payload as Record<string, any>;
    
    // Get quote ID from action payload or provided
    const quoteId = providedQuoteId || payload?.auto_quote?.quote_id || payload?.quote_id;
    const customerEmail = providedEmail || payload?.auto_quote?.customer_email || payload?.customer_email;
    const customerName = providedName || payload?.auto_quote?.customer_name || payload?.customer_name || payload?.sender_username || 'Valued Customer';

    console.log('Quote details:', { quoteId, customerEmail, customerName });

    if (!quoteId) {
      // No quote ID - just mark as resolved (might be a partial lead)
      await supabase
        .from('ai_actions')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: 'approved_without_email'
        })
        .eq('id', actionId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false, 
          message: 'Action approved (no quote to send)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Quote not found:', quoteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const finalEmail = customerEmail || quote.customer_email;
    const finalName = customerName || quote.customer_name;

    // Send email if we have an email address
    let emailSent = false;
    if (finalEmail && !finalEmail.includes('@capture.local') && !finalEmail.includes('pending-')) {
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-mightymail-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            customerEmail: finalEmail,
            customerName: finalName,
            quoteData: {
              vehicle_year: quote.vehicle_year,
              vehicle_make: quote.vehicle_make,
              vehicle_model: quote.vehicle_model,
              product_name: quote.product_name,
              sqft: quote.sqft,
              material_cost: quote.material_cost,
              labor_cost: quote.labor_cost,
              quote_total: quote.total_price,
            },
            tone: 'installer',
            design: 'performance',
            quoteId: quote.id
          })
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('✅ Quote email sent to:', finalEmail);
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Failed to send quote email:', errorText);
        }
      } catch (emailError) {
        console.error('❌ Email error:', emailError);
      }
    } else {
      console.log('⚠️ No valid email address for quote - skipping email');
    }

    // Update quote status
    await supabase
      .from('quotes')
      .update({ 
        status: emailSent ? 'sent' : 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    // Mark AI action as resolved
    await supabase
      .from('ai_actions')
      .update({ 
        resolved: true, 
        resolved_at: new Date().toISOString(),
        resolved_by: 'approved',
        action_payload: {
          ...payload,
          email_sent: emailSent,
          email_sent_to: emailSent ? finalEmail : null,
          approved_at: new Date().toISOString()
        }
      })
      .eq('id', actionId);

    console.log('✅ Quote approved and processed:', { quoteId, emailSent });

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        quoteId,
        message: emailSent 
          ? `Quote approved and emailed to ${finalEmail}` 
          : 'Quote approved (no valid email to send to)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Send Approved Quote Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
