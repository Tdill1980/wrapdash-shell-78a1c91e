import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Backfill Quote Links
 * 
 * Links existing quotes to conversations by matching customer email.
 * Also creates conversation_events for email_sent tracking.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all quotes with source=wren that have no conversation link
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select("id, customer_email, customer_name, created_at, source_conversation_id, email_sent")
      .eq("source", "wren")
      .is("source_conversation_id", null)
      .not("customer_email", "is", null);

    if (quotesError) throw quotesError;

    console.log(`[backfill] Found ${quotes?.length || 0} unlinked quotes`);

    const results = {
      processed: 0,
      linked: 0,
      events_created: 0,
      errors: [] as string[],
    };

    for (const quote of quotes || []) {
      results.processed++;

      // Skip test emails
      if (quote.customer_email?.includes('test') || 
          quote.customer_email?.includes('invalid') ||
          quote.customer_email?.includes('@weprintwraps.com')) {
        continue;
      }

      // Find conversation by customer email in chat_state
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id, organization_id, chat_state")
        .or(`chat_state->>customer_email.eq.${quote.customer_email},chat_state->>email.eq.${quote.customer_email}`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (convError) {
        results.errors.push(`Quote ${quote.id}: ${convError.message}`);
        continue;
      }

      if (!conversations || conversations.length === 0) {
        console.log(`[backfill] No conversation found for ${quote.customer_email}`);
        continue;
      }

      const conv = conversations[0];
      console.log(`[backfill] Linking quote ${quote.id} to conversation ${conv.id} for ${quote.customer_email}`);

      // Update quote with conversation link
      const { error: updateError } = await supabase
        .from("quotes")
        .update({ source_conversation_id: conv.id })
        .eq("id", quote.id);

      if (updateError) {
        results.errors.push(`Quote update ${quote.id}: ${updateError.message}`);
      } else {
        results.linked++;
      }

      // Create email_sent event if email was sent
      if (quote.email_sent) {
        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from("conversation_events")
          .select("id")
          .eq("conversation_id", conv.id)
          .eq("event_type", "email_sent")
          .eq("metadata->>quote_id", quote.id)
          .limit(1);

        if (!existingEvent || existingEvent.length === 0) {
          const { error: eventError } = await supabase
            .from("conversation_events")
            .insert({
              conversation_id: conv.id,
              organization_id: conv.organization_id,
              event_type: "email_sent",
              event_subtype: "quote_email",
              actor: "wren",
              metadata: {
                quote_id: quote.id,
                customer_email: quote.customer_email,
                customer_name: quote.customer_name,
                sent_at: quote.created_at,
              },
              created_at: quote.created_at,
            });

          if (eventError) {
            results.errors.push(`Event create for ${quote.id}: ${eventError.message}`);
          } else {
            results.events_created++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[backfill] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
