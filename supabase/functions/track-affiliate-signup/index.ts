import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface TrackSignupRequest {
  refCode: string;
  email: string;
  orderNumber?: string;
  orderTotal?: number;
  productType?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { refCode, email, orderNumber, orderTotal, productType }: TrackSignupRequest = await req.json();

    console.log('Tracking signup for ref code:', refCode, 'email:', email);

    // Fetch founder by affiliate code
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('id, commission_rate')
      .eq('affiliate_code', refCode)
      .eq('is_active', true)
      .single();

    if (founderError || !founder) {
      console.error('Founder not found:', founderError);
      return new Response(
        JSON.stringify({ error: 'Affiliate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasOrder = orderNumber && orderTotal;
    const converted = hasOrder;
    const conversionDate = hasOrder ? new Date().toISOString() : null;

    // Insert referral record
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert({
        founder_id: founder.id,
        referred_email: email,
        converted,
        conversion_date: conversionDate,
      })
      .select()
      .single();

    if (referralError) {
      console.error('Error inserting referral:', referralError);
      return new Response(
        JSON.stringify({ error: 'Failed to track referral' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If order included, create commission record
    let commissionId = null;
    if (hasOrder && orderTotal) {
      const commissionRate = founder.commission_rate || 10;
      const commissionAmount = (orderTotal * commissionRate) / 100;

      const { data: commission, error: commissionError } = await supabase
        .from('affiliate_commissions')
        .insert({
          founder_id: founder.id,
          customer_email: email,
          order_number: orderNumber,
          order_total: orderTotal,
          commission_amount: commissionAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (commissionError) {
        console.error('Error creating commission:', commissionError);
      } else {
        commissionId = commission?.id;
        console.log('Commission created:', commissionAmount, 'at rate:', commissionRate + '%');
      }
    }

    console.log('Signup tracked successfully. Referral ID:', referral.id);

    return new Response(
      JSON.stringify({
        success: true,
        referralId: referral.id,
        commissionId,
        converted,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-affiliate-signup:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});