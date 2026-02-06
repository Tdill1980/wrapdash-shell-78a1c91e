import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("EXTERNAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get most recent conversations with their messages
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, channel, chat_state, created_at")
      .eq("channel", "website")
      .order("created_at", { ascending: false })
      .limit(5);

    if (convError) {
      return new Response(JSON.stringify({ error: convError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // For each conversation, get message count
    const results = [];
    for (const conv of conversations || []) {
      const { count, error: msgError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id);

      // Get actual messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id, content, direction, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true })
        .limit(5);

      results.push({
        id: conv.id,
        email: conv.chat_state?.customer_email || null,
        created_at: conv.created_at,
        message_count: count || 0,
        messages: messages || []
      });
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
