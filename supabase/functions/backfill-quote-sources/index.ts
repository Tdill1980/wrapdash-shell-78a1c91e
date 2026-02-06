// Backfill quote sources - Sets source='commandchat' for quotes created from chat
// Run once to fix historical quotes missing the source field

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[BackfillQuoteSources] Starting...');

    // Strategy 1: Quotes with source_conversation_id (came from chat)
    const { data: chatQuotes, error: chatError } = await supabase
      .from('quotes')
      .update({ source: 'commandchat' })
      .not('source_conversation_id', 'is', null)
      .is('source', null)
      .select('id, quote_number');

    if (chatError) {
      console.error('[BackfillQuoteSources] Error updating chat quotes:', chatError);
    } else {
      console.log(`[BackfillQuoteSources] Updated ${chatQuotes?.length || 0} quotes with source_conversation_id`);
    }

    // Strategy 2: Quotes with quote_number starting with WPW-CHAT (from website-chat)
    const { data: webChatQuotes, error: webChatError } = await supabase
      .from('quotes')
      .update({ source: 'website_chat' })
      .like('quote_number', 'WPW-CHAT-%')
      .is('source', null)
      .select('id, quote_number');

    if (webChatError) {
      console.error('[BackfillQuoteSources] Error updating website chat quotes:', webChatError);
    } else {
      console.log(`[BackfillQuoteSources] Updated ${webChatQuotes?.length || 0} quotes with WPW-CHAT prefix`);
    }

    // Strategy 3: AI-generated quotes without source
    const { data: aiQuotes, error: aiError } = await supabase
      .from('quotes')
      .update({ source: 'ai_website_agent' })
      .eq('ai_generated', true)
      .is('source', null)
      .select('id, quote_number');

    if (aiError) {
      console.error('[BackfillQuoteSources] Error updating AI quotes:', aiError);
    } else {
      console.log(`[BackfillQuoteSources] Updated ${aiQuotes?.length || 0} AI-generated quotes`);
    }

    // Get summary of all quote sources
    const { data: summary, error: summaryError } = await supabase
      .from('quotes')
      .select('source')
      .not('source', 'is', null);

    const sourceCounts: Record<string, number> = {};
    if (summary) {
      for (const q of summary) {
        const src = q.source || 'unknown';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      }
    }

    // Count remaining null sources
    const { count: nullCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .is('source', null);

    return new Response(JSON.stringify({
      success: true,
      updated: {
        chat_quotes: chatQuotes?.length || 0,
        website_chat_quotes: webChatQuotes?.length || 0,
        ai_quotes: aiQuotes?.length || 0
      },
      source_summary: sourceCounts,
      remaining_null_sources: nullCount || 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[BackfillQuoteSources] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
