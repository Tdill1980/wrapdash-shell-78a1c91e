import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch website conversations with latest message preview
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        id,
        channel,
        status,
        chat_state,
        metadata,
        created_at,
        updated_at,
        last_message_at,
        contact_id
      `)
      .eq("channel", "website")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[get-website-chats] Query error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich with customer info from chat_state
    const enrichedChats = (conversations || []).map((conv) => {
      const chatState = conv.chat_state || {};
      const metadata = conv.metadata || {};

      return {
        id: conv.id,
        channel: conv.channel,
        status: conv.status,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        // Extract customer info from chat_state
        customer_name: chatState.customer_name || chatState.name || null,
        customer_email: chatState.customer_email || chatState.email || null,
        customer_phone: chatState.customer_phone || chatState.phone || null,
        // Vehicle info
        vehicle: chatState.vehicle || null,
        // Conversation state
        stage: chatState.stage || "initial",
        intent: chatState.intent || null,
        // Escalation tracking
        escalations_sent: chatState.escalations_sent || [],
        escalation_sent: chatState.escalation_sent || null, // Legacy field
        // Message preview from chat_state
        last_message: chatState.last_message || chatState.last_customer_message || null,
        ai_summary: chatState.ai_summary || null,
        // Session info from metadata
        session_id: metadata.session_id || null,
        page_url: metadata.page_url || null,
        // Full objects for detailed view
        chat_state: chatState,
        metadata: metadata,
      };
    });

    return new Response(
      JSON.stringify(enrichedChats),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("[get-website-chats] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
