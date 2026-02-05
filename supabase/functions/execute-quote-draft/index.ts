import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceExecutionGate, canCreateIntent } from "../_shared/execution-gate.ts";
import { canExecute } from "../_shared/agent-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecuteDraftRequest {
  draft_id: string;
  approving_agent?: string; // defaults to 'ops_desk'
  approved_by_user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ExecuteDraftRequest = await req.json();
    const { draft_id, approving_agent = 'ops_desk', approved_by_user_id } = body;

    console.log('🚀 Execute quote draft request:', { draft_id, approving_agent });

    if (!draft_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing draft_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 1. ENFORCE EXECUTION GATE - Only ops_desk or human can execute
    const gate = enforceExecutionGate(approving_agent, 'execute_quote');
    console.log('🚪 Execution gate:', gate);

    if (!gate.proceed) {
      console.log('⛔ Agent not authorized for execution:', gate.reason);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Forbidden - Agent not authorized for quote execution',
          reason: gate.reason,
          convert_to_pending: gate.convert_to_pending
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // 2. Get the draft
    const { data: draft, error: draftError } = await supabase
      .from('quote_drafts')
      .select('*')
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) {
      console.error('Draft not found:', draftError);
      return new Response(
        JSON.stringify({ success: false, error: 'Draft not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (draft.status !== 'draft') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Draft already processed with status: ${draft.status}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Create official quote from draft
    const quoteNumber = `WPW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const quoteData = {
      quote_number: quoteNumber,
      customer_name: draft.customer_name || 'Unknown',
      customer_email: draft.customer_email,
      customer_phone: draft.customer_phone,
      vehicle_year: draft.vehicle_year,
      vehicle_make: draft.vehicle_make,
      vehicle_model: draft.vehicle_model,
      product_name: draft.material,
      sqft: draft.sqft,
      material_cost: draft.total_price,
      labor_cost: 0, // WPW is print-only
      margin: 0,
      total_price: draft.total_price,
      status: 'approved',
      ai_generated: true,
      source: draft.source,
      source_message: draft.original_message,
      source_conversation_id: draft.conversation_id,
      organization_id: draft.organization_id
    };

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single();

    if (quoteError) {
      console.error('Quote creation failed:', quoteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create quote', details: quoteError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Quote created from draft:', quote.id);

    // 4. Send email if valid email
    let emailSent = false;
    const validEmail = draft.customer_email && 
      !draft.customer_email.includes('@capture.local') && 
      !draft.customer_email.includes('pending-');

    if (validEmail) {
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-mightymail-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            customerEmail: draft.customer_email,
            customerName: draft.customer_name,
            quoteData: {
              vehicle_year: draft.vehicle_year,
              vehicle_make: draft.vehicle_make,
              vehicle_model: draft.vehicle_model,
              product_name: draft.material,
              sqft: draft.sqft,
              material_cost: draft.total_price,
              labor_cost: 0,
              quote_total: draft.total_price,
            },
            tone: 'installer',
            design: 'performance',
            quoteId: quote.id
          })
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('✅ Quote email sent to:', draft.customer_email);
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Email send failed:', errorText);
        }
      } catch (emailError) {
        console.error('❌ Email error:', emailError);
      }
    }

    // 5. Update quote status based on email result
    await supabase
      .from('quotes')
      .update({ status: emailSent ? 'sent' : 'approved' })
      .eq('id', quote.id);

    // 6. Update draft status
    await supabase
      .from('quote_drafts')
      .update({
        status: emailSent ? 'sent' : 'approved',
        approved_by: approved_by_user_id || null,
        approved_at: new Date().toISOString(),
        sent_at: emailSent ? new Date().toISOString() : null
      })
      .eq('id', draft_id);

    // 7. Resolve any related AI actions
    await supabase
      .from('ai_actions')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: approved_by_user_id || 'ops_desk'
      })
      .eq('action_payload->>draft_id', draft_id);

    console.log('✅ Quote execution complete:', { quote_id: quote.id, emailSent });

    return new Response(
      JSON.stringify({
        success: true,
        status: emailSent ? 'sent' : 'approved',
        quote_id: quote.id,
        quote_number: quoteNumber,
        email_sent: emailSent,
        email_to: emailSent ? draft.customer_email : null,
        message: emailSent 
          ? `Quote approved and sent to ${draft.customer_email}`
          : 'Quote approved (no valid email to send)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Execute Quote Draft Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
