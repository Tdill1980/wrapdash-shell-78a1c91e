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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find test conversations
    const { data: testConvos, error: findError } = await supabase
      .from("conversations")
      .select("id, chat_state")
      .or("chat_state->>customer_email.ilike.%test%,chat_state->>customer_email.ilike.%healthcheck%,chat_state->>customer_email.ilike.%invalid%,chat_state->>customer_email.ilike.%@weprintwraps.com%");

    if (findError) throw findError;

    const ids = testConvos?.map(c => c.id) || [];
    console.log(`[Cleanup] Found ${ids.length} test conversations`);

    if (ids.length === 0) {
      return new Response(JSON.stringify({ deleted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Delete messages first (foreign key)
    const { error: msgError } = await supabase
      .from("messages")
      .delete()
      .in("conversation_id", ids);
    
    if (msgError) console.error("[Cleanup] Messages delete error:", msgError);

    // Delete conversation events
    const { error: evtError } = await supabase
      .from("conversation_events")
      .delete()
      .in("conversation_id", ids);
    
    if (evtError) console.error("[Cleanup] Events delete error:", evtError);

    // Delete conversations
    const { error: convError } = await supabase
      .from("conversations")
      .delete()
      .in("id", ids);

    if (convError) throw convError;

    // Also clean up test contacts
    const { error: contactError } = await supabase
      .from("command_contacts")
      .delete()
      .or("email.ilike.%test%,email.ilike.%healthcheck%,email.ilike.%invalid%,email.ilike.%@weprintwraps.com%");

    console.log(`[Cleanup] Deleted ${ids.length} test conversations`);

    return new Response(JSON.stringify({ 
      deleted_conversations: ids.length,
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[Cleanup] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
