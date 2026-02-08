// Create affiliate tables if they don't exist
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: any[] = [];

    // Create affiliate_founders table
    const { error: e1 } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.affiliate_founders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          affiliate_code TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          company_name TEXT,
          bio TEXT,
          avatar_url TEXT,
          social_links JSONB DEFAULT '{}'::jsonb,
          commission_rate NUMERIC DEFAULT 5.00,
          stripe_account_id TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    results.push({ table: 'affiliate_founders', error: e1?.message || null });

    // Create affiliate_commissions table  
    const { error: e2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          founder_id UUID REFERENCES public.affiliate_founders(id) ON DELETE CASCADE NOT NULL,
          order_number TEXT NOT NULL,
          customer_email TEXT,
          commission_amount NUMERIC NOT NULL,
          order_total NUMERIC NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
          paid_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    results.push({ table: 'affiliate_commissions', error: e2?.message || null });

    // Create affiliate_login_tokens table
    const { error: e3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.affiliate_login_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          founder_id UUID REFERENCES public.affiliate_founders(id) ON DELETE CASCADE NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    results.push({ table: 'affiliate_login_tokens', error: e3?.message || null });

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      note: 'Tables created. Now need to add RLS policies and configure Stripe.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
