import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface MagicLinkRequest {
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: MagicLinkRequest = await req.json();

    console.log('Magic link requested for:', email);

    // Fetch founder (don't reveal if email exists in response for security)
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('id, full_name, email')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    // Always return success to prevent email enumeration
    if (founderError || !founder) {
      console.log('Founder not found for email:', email);
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists, a magic link has been sent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1-hour expiry

    // Insert token
    const { error: tokenError } = await supabase
      .from('affiliate_login_tokens')
      .insert({
        founder_id: founder.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      // Still return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists, a magic link has been sent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const magicLink = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/affiliate/dashboard?token=${token}`;
    
    const { error: emailError } = await resend.emails.send({
      from: 'WrapCommand <onboarding@resend.dev>',
      to: [founder.email],
      subject: 'Login to Your Affiliate Dashboard',
      html: `
        <h1>Hello ${founder.full_name},</h1>
        <p>Click the link below to login to your affiliate dashboard:</p>
        <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00AFFF, #008CFF); color: white; text-decoration: none; border-radius: 8px;">Login to Dashboard</a></p>
        <p>This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this login link, please ignore this email.</p>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
    } else {
      console.log('Magic link sent successfully to:', founder.email);
    }

    // Always return success regardless of email send status
    return new Response(
      JSON.stringify({ success: true, message: 'If an account exists, a magic link has been sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in affiliate-magic-link:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});