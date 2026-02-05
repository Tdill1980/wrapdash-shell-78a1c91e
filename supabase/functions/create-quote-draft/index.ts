import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateIntent, createIntent, enforceExecutionGate } from "../_shared/execution-gate.ts";
import { calculateQuickQuote } from "../_shared/wpw-pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDraftRequest {
  source_agent: string;
  confidence?: number;
  customer_name?: string;
  customer_email: string;
  customer_phone?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  material?: string;
  sqft?: number;
  original_message?: string;
  source?: string;
  conversation_id?: string;
  organization_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CreateDraftRequest = await req.json();
    console.log('📝 Creating quote draft:', body);

    // 1. Enforce execution gate - channel agents cannot execute, only create drafts
    const gate = enforceExecutionGate(body.source_agent, 'create_quote');
    console.log('🚪 Gate result:', gate);

    // If agent has execution authority, we still create a draft (for audit trail)
    // but we could fast-track it. For now, all quotes go through drafts.

    // 2. Calculate pricing if we have sqft
    let totalPrice = 0;
    let pricePerSqft = 5.27;
    let productName = 'Avery MPI 1105 EGRS with DOL 1460Z Lamination';

    if (body.sqft && body.sqft > 0) {
      const quoteCalc = calculateQuickQuote(body.sqft, body.material || 'avery');
      totalPrice = quoteCalc.materialCost;
      pricePerSqft = quoteCalc.pricePerSqft;
      productName = quoteCalc.productName;
    }

    // 3. Create the draft
    const draftData = {
      source_agent: body.source_agent,
      confidence: body.confidence || 0.85,
      customer_name: body.customer_name || 'Unknown',
      customer_email: body.customer_email,
      customer_phone: body.customer_phone || null,
      vehicle_year: body.vehicle_year || null,
      vehicle_make: body.vehicle_make || null,
      vehicle_model: body.vehicle_model || null,
      material: productName,
      sqft: body.sqft || 0,
      price_per_sqft: pricePerSqft,
      total_price: totalPrice,
      original_message: body.original_message || null,
      source: body.source || 'chat',
      conversation_id: body.conversation_id || null,
      organization_id: body.organization_id || null,
      status: 'draft'
    };

    const { data: draft, error: draftError } = await supabase
      .from('quote_drafts')
      .insert(draftData)
      .select()
      .single();

    if (draftError) {
      console.error('❌ Draft creation failed:', draftError);
      return new Response(
        JSON.stringify({ success: false, error: draftError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Quote draft created:', draft.id);

    // 4. Create AI action for visibility in approvals dashboard
    await supabase.from('ai_actions').insert({
      action_type: 'quote_draft_created',
      priority: 'normal',
      resolved: false,
      action_payload: {
        draft_id: draft.id,
        source_agent: body.source_agent,
        confidence: body.confidence || 0.85,
        vehicle: body.vehicle_year && body.vehicle_make && body.vehicle_model
          ? `${body.vehicle_year} ${body.vehicle_make} ${body.vehicle_model}`
          : 'Unknown Vehicle',
        total_price: totalPrice,
        customer_email: body.customer_email,
        customer_name: body.customer_name,
        original_message: body.original_message,
        gate_result: gate
      },
      organization_id: body.organization_id
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: 'draft_created',
        draft_id: draft.id,
        draft: draft,
        message: 'Quote draft created. Awaiting Ops Desk approval before sending.',
        gate_result: gate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Create Quote Draft Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
