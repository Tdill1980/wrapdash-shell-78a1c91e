import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, founderId, returnUrl } = await req.json();
    console.log(`[affiliate-stripe-connect] Action: ${action}, FounderId: ${founderId}`);

    // Get founder info
    const { data: founder, error: founderError } = await supabase
      .from('affiliate_founders')
      .select('*')
      .eq('id', founderId)
      .single();

    if (founderError || !founder) {
      console.error('[affiliate-stripe-connect] Founder not found:', founderError);
      throw new Error('Affiliate founder not found');
    }

    switch (action) {
      case 'create_account': {
        // Check if already has an account
        if (founder.stripe_account_id) {
          console.log('[affiliate-stripe-connect] Account already exists:', founder.stripe_account_id);
          return new Response(JSON.stringify({ 
            accountId: founder.stripe_account_id,
            alreadyExists: true 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create Stripe Connect Express account
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: founder.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          metadata: {
            founder_id: founderId,
            affiliate_code: founder.affiliate_code,
          },
        });

        console.log('[affiliate-stripe-connect] Created account:', account.id);

        // Save account ID to database
        const { error: updateError } = await supabase
          .from('affiliate_founders')
          .update({ stripe_account_id: account.id })
          .eq('id', founderId);

        if (updateError) {
          console.error('[affiliate-stripe-connect] Error saving account:', updateError);
        }

        return new Response(JSON.stringify({ accountId: account.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_onboarding_link': {
        const accountId = founder.stripe_account_id;
        if (!accountId) {
          throw new Error('No Stripe account found. Create one first.');
        }

        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: returnUrl || `${req.headers.get('origin')}/affiliate/onboarding?refresh=true`,
          return_url: returnUrl || `${req.headers.get('origin')}/affiliate/onboarding?success=true`,
          type: 'account_onboarding',
        });

        console.log('[affiliate-stripe-connect] Generated onboarding link');

        return new Response(JSON.stringify({ url: accountLink.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_status': {
        const accountId = founder.stripe_account_id;
        if (!accountId) {
          return new Response(JSON.stringify({ 
            connected: false,
            onboardingComplete: false 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const account = await stripe.accounts.retrieve(accountId);
        const onboardingComplete = account.details_submitted && account.charges_enabled;

        console.log('[affiliate-stripe-connect] Status check:', { 
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          onboardingComplete 
        });

        // Update database if onboarding is complete
        if (onboardingComplete && !founder.stripe_onboarding_complete) {
          await supabase
            .from('affiliate_founders')
            .update({ stripe_onboarding_complete: true })
            .eq('id', founderId);
        }

        return new Response(JSON.stringify({ 
          connected: true,
          onboardingComplete,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_balance': {
        const accountId = founder.stripe_account_id;
        if (!accountId) {
          return new Response(JSON.stringify({ balance: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const balance = await stripe.balance.retrieve({
          stripeAccount: accountId,
        });

        const availableBalance = balance.available.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0) / 100;
        const pendingBalance = balance.pending.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0) / 100;

        return new Response(JSON.stringify({ 
          available: availableBalance,
          pending: pendingBalance,
          total: availableBalance + pendingBalance
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_payout': {
        const accountId = founder.stripe_account_id;
        if (!accountId) {
          throw new Error('No Stripe account connected');
        }

        // Get approved unpaid commissions
        const { data: commissions, error: commError } = await supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('founder_id', founderId)
          .eq('status', 'approved')
          .is('paid_at', null);

        if (commError || !commissions?.length) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'No approved commissions to pay out' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const totalAmount = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
        const amountInCents = Math.round(totalAmount * 100);

        // Create transfer to connected account
        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: 'usd',
          destination: accountId,
          metadata: {
            founder_id: founderId,
            commission_ids: commissions.map(c => c.id).join(','),
          },
        });

        console.log('[affiliate-stripe-connect] Created transfer:', transfer.id);

        // Mark commissions as paid
        const commissionIds = commissions.map(c => c.id);
        await supabase
          .from('affiliate_commissions')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString() 
          })
          .in('id', commissionIds);

        return new Response(JSON.stringify({ 
          success: true,
          transferId: transfer.id,
          amount: totalAmount,
          commissionsCount: commissions.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error('[affiliate-stripe-connect] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
