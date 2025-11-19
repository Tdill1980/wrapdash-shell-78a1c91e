import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface VerifyLoginRequest {
  token: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyLoginRequest = await req.json();

    console.log('Verifying login token');

    // Query token - must be unused and not expired
    const { data: tokenData, error: tokenError } = await supabase
      .from('affiliate_login_tokens')
      .select('id, founder_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found or invalid:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.error('Token expired');
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch founder data
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('id, affiliate_code, full_name, email, commission_rate, avatar_url, bio, company_name, phone, social_links')
      .eq('id', tokenData.founder_id)
      .eq('is_active', true)
      .single();

    if (founderError || !founder) {
      console.error('Founder not found:', founderError);
      return new Response(
        JSON.stringify({ error: 'Founder not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('affiliate_login_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
    }

    console.log('Login verified successfully for founder:', founder.email);

    return new Response(
      JSON.stringify({
        success: true,
        founder: {
          id: founder.id,
          affiliateCode: founder.affiliate_code,
          fullName: founder.full_name,
          email: founder.email,
          commissionRate: founder.commission_rate,
          avatarUrl: founder.avatar_url,
          bio: founder.bio,
          companyName: founder.company_name,
          phone: founder.phone,
          socialLinks: founder.social_links,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in affiliate-verify-login:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});