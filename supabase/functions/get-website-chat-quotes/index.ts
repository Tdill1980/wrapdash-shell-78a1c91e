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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query params
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');

    // Build query
    let query = supabase
      .from('quotes')
      .select('id, quote_number, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, sqft, material_cost, status, created_at, email_sent, ai_message, source_conversation_id')
      .eq('source', 'website_chat')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: quotes, error } = await query;

    if (error) {
      console.error('[get-website-chat-quotes] Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate stats
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todayQuotes = (quotes || []).filter(
      (q) => new Date(q.created_at) >= today
    );

    const needsReview = (quotes || []).filter((q) => {
      return q.ai_message?.includes('⚠️') || q.ai_message?.includes('review');
    });

    const totalValue = (quotes || []).reduce((sum, q) => sum + (q.material_cost || 0), 0);

    return new Response(JSON.stringify({
      quotes: quotes || [],
      stats: {
        total: quotes?.length || 0,
        today: todayQuotes.length,
        needsReview: needsReview.length,
        totalValue
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[get-website-chat-quotes] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
