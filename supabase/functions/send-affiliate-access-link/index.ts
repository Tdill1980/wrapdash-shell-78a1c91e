import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface SendAccessLinkRequest {
  founderEmail: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is admin
    const authToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { founderEmail }: SendAccessLinkRequest = await req.json();

    console.log('Sending access link to founder:', founderEmail);

    // Fetch founder
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('id, full_name, email')
      .eq('email', founderEmail)
      .eq('is_active', true)
      .single();

    if (founderError || !founder) {
      console.error('Founder not found:', founderError);
      return new Response(
        JSON.stringify({ error: 'Founder not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

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
      return new Response(
        JSON.stringify({ error: 'Failed to create access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const magicLink = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/affiliate/dashboard?token=${token}`;
    
    const { error: emailError } = await resend.emails.send({
      from: 'WePrintWraps <hello@weprintwraps.com>',
      to: [founder.email],
      subject: 'Your WePrintWraps Affiliate Dashboard Access',
      html: `
        <h1>Hello ${founder.full_name},</h1>
        <p>Your affiliate dashboard access link is ready!</p>
        <p>Click the link below to access your dashboard:</p>
        <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00AFFF, #008CFF); color: white; text-decoration: none; border-radius: 8px;">Access Dashboard</a></p>
        <p>This link will expire in 24 hours.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this link, please ignore this email.</p>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Access link sent successfully to:', founder.email);

    return new Response(
      JSON.stringify({ success: true, message: 'Access link sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-affiliate-access-link:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});