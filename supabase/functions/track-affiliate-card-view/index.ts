import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface TrackViewRequest {
  affiliateCode: string;
  visitorIp?: string;
  visitorCountry?: string;
  referrerUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { affiliateCode, visitorIp, visitorCountry, referrerUrl }: TrackViewRequest = await req.json();

    console.log('Tracking card view for affiliate code:', affiliateCode);

    // Fetch founder by affiliate code
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('id')
      .eq('affiliate_code', affiliateCode)
      .eq('is_active', true)
      .single();

    if (founderError || !founder) {
      console.error('Founder not found:', founderError);
      return new Response(
        JSON.stringify({ error: 'Affiliate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert view record
    const { error: insertError } = await supabase
      .from('affiliate_card_views')
      .insert({
        founder_id: founder.id,
        viewer_ip: visitorIp,
        viewer_country: visitorCountry,
        referrer_url: referrerUrl,
      });

    if (insertError) {
      console.error('Error inserting view:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total view count
    const { count, error: countError } = await supabase
      .from('affiliate_card_views')
      .select('*', { count: 'exact', head: true })
      .eq('founder_id', founder.id);

    console.log('View tracked successfully. Total views:', count);

    return new Response(
      JSON.stringify({ success: true, totalViews: count || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-affiliate-card-view:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});