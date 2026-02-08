/**
 * send-wotw-winner - Announce Wrap of the Week winner via email
 * 
 * Sends branded email with:
 * - Hero wrap image (the actual wrap!)
 * - Artist IG handle
 * - Vehicle info
 * - ClubWPW × Paint Is Dead branding
 * - Social share links
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WinnerRequest {
  nominee_id: string;
  winner_type: 'weekly' | 'monthly';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resendKey = Deno.env.get('RESEND_API_KEY');

    const { nominee_id, winner_type = 'weekly' }: WinnerRequest = await req.json();

    // Fetch winner details
    const { data: winner, error } = await supabase
      .from('wotw_nominees')
      .select('*')
      .eq('id', nominee_id)
      .single();

    if (error || !winner) {
      throw new Error('Winner not found');
    }

    console.log(`🏆 Announcing ${winner_type} winner: @${winner.artist_instagram}`);

    const wrapImage = winner.hero_image_url || winner.image_urls?.[0];
    const artistHandle = winner.artist_instagram.replace('@', '');
    const vehicleInfo = [winner.vehicle_year, winner.vehicle_make, winner.vehicle_model].filter(Boolean).join(' ');
    const votingPageUrl = 'https://wrapcommandai.com/wrap-of-the-week';
    const winnerTitle = winner_type === 'monthly' ? '🏆 MONTHLY CHAMPION' : '🏆 WRAP OF THE WEEK';

    // Build winner announcement email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0;">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #E91E8C 0%, #9D4EDD 50%, #2F81F7 100%); padding: 24px; text-align: center;">
      <div style="margin-bottom: 8px;">
        <span style="color: #FFD700; font-size: 20px;">🏆</span>
        <span style="color: white; font-size: 14px; font-weight: 600; letter-spacing: 2px;">CLUB</span>
        <span style="color: white; font-size: 14px; font-weight: 800; letter-spacing: 2px;">WPW</span>
      </div>
      <h1 style="color: white; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
        ${winner_type === 'monthly' ? 'MONTHLY CHAMPION' : 'WRAP OF THE WEEK'}
      </h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 8px 0 0 0; font-style: italic;">
        Curated by Paint Is Dead®
      </p>
    </div>

    <!-- HERO WRAP IMAGE - THE STAR OF THE SHOW -->
    <div style="position: relative;">
      <img 
        src="${wrapImage}" 
        alt="Winning Wrap by @${artistHandle}" 
        style="width: 100%; height: auto; display: block;"
      />
      <!-- Winner Badge Overlay -->
      <div style="position: absolute; top: 16px; right: 16px; background: linear-gradient(135deg, #FFD700, #FFA500); padding: 8px 16px; border-radius: 20px;">
        <span style="color: #000; font-weight: 800; font-size: 12px; text-transform: uppercase;">
          ${winner_type === 'monthly' ? '👑 Champion' : '🏆 Winner'}
        </span>
      </div>
    </div>

    <!-- Winner Info Card -->
    <div style="background: #0a0a0f; padding: 32px 24px; text-align: center;">
      
      <!-- Instagram Handle - BIG -->
      <a href="https://instagram.com/${artistHandle}" style="text-decoration: none; display: inline-block; margin-bottom: 16px;">
        <div style="background: linear-gradient(135deg, #E91E8C, #9D4EDD); padding: 12px 32px; border-radius: 30px; display: inline-block;">
          <span style="color: white; font-size: 24px; font-weight: 800;">@${artistHandle}</span>
        </div>
      </a>

      <!-- Vehicle Info -->
      <p style="color: rgba(255,255,255,0.6); font-size: 16px; margin: 0 0 24px 0;">
        ${vehicleInfo || 'Custom Wrap'}
      </p>

      <!-- Vote Count -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">
          Total Votes
        </p>
        <p style="color: #E91E8C; font-size: 36px; font-weight: 800; margin: 0;">
          ${winner.vote_count || 0}
        </p>
      </div>

      <!-- Congrats Message -->
      <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        Congratulations to <strong style="color: #E91E8C;">@${artistHandle}</strong> for winning 
        ${winner_type === 'monthly' ? 'Monthly Champion' : 'Wrap of the Week'}! 
        This wrap stood out from the competition and earned the most votes from the community.
      </p>

      <!-- CTA Buttons -->
      <div style="margin-bottom: 24px;">
        <a href="https://instagram.com/${artistHandle}" style="display: inline-block; background: linear-gradient(135deg, #E91E8C, #9D4EDD); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 4px;">
          Follow @${artistHandle}
        </a>
        <a href="${votingPageUrl}" style="display: inline-block; background: rgba(255,255,255,0.1); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 4px; border: 1px solid rgba(255,255,255,0.2);">
          See All Winners
        </a>
      </div>

      <!-- Submit Your Wrap CTA -->
      <div style="background: linear-gradient(135deg, rgba(233,30,140,0.1), rgba(157,78,221,0.1)); border: 1px solid rgba(233,30,140,0.3); border-radius: 12px; padding: 20px; margin-top: 24px;">
        <p style="color: white; font-weight: 600; font-size: 16px; margin: 0 0 8px 0;">
          Want to be featured?
        </p>
        <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 16px 0;">
          Tag <span style="color: #E91E8C;">@weprintwraps</span> + <span style="color: #E91E8C;">@paintisdead</span> on Instagram
        </p>
        <a href="https://instagram.com/weprintwraps" style="display: inline-block; background: white; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 12px;">
          Submit Your Wrap →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #050507; padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0 0 8px 0;">
        A <span style="color: rgba(255,255,255,0.6);">ClubWPW</span> × <span style="color: rgba(255,255,255,0.6);">Paint Is Dead</span> collaboration
      </p>
      <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 0;">
        Powered by WrapCommand™ • WePrintWraps.com
      </p>
    </div>

  </div>
</body>
</html>
`;

    // Send via Resend if configured
    if (resendKey) {
      // Send to winner if we have their email
      if (winner.artist_email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ClubWPW <hello@weprintwraps.com>',
            to: winner.artist_email,
            subject: `🏆 Congrats! You won ${winner_type === 'monthly' ? 'Monthly Champion' : 'Wrap of the Week'}!`,
            html: emailHtml,
            reply_to: 'hello@weprintwraps.com',
          }),
        });
        console.log(`✅ Winner email sent to ${winner.artist_email}`);
      }

      // Send announcement to marketing list (optional)
      // Could also send to a "WOTW Subscribers" list here
    }

    // Update winner status in database
    await supabase
      .from('wotw_nominees')
      .update({ 
        is_winner: true, 
        status: winner_type === 'monthly' ? 'monthly_champion' : 'winner',
        notified_at: new Date().toISOString()
      })
      .eq('id', nominee_id);

    // Log the announcement
    await supabase.from('shopflow_logs').insert({
      event_type: 'wotw_winner_announced',
      payload: {
        nominee_id,
        winner_type,
        artist_instagram: winner.artist_instagram,
        vote_count: winner.vote_count,
      },
    });

    // Send Klaviyo event
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (klaviyoKey && winner.artist_email) {
      await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              profile: { data: { type: 'profile', attributes: { email: winner.artist_email } } },
              metric: { data: { type: 'metric', attributes: { name: `WOTW ${winner_type === 'monthly' ? 'Monthly Champion' : 'Winner'}` } } },
              properties: {
                artist_instagram: winner.artist_instagram,
                vehicle: vehicleInfo,
                vote_count: winner.vote_count,
                wrap_image: wrapImage,
              },
              time: new Date().toISOString()
            }
          }
        })
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        winner: {
          instagram: winner.artist_instagram,
          votes: winner.vote_count,
          type: winner_type
        },
        email_html: emailHtml // Return HTML for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Winner announcement error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
