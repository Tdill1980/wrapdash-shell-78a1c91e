import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wpw-embed-secret",
};

// External WPW Quote Database
const EXTERNAL_SUPABASE_URL = "https://lqxnwskrrshythrydzcs.supabase.co";
const TENANT_ID = "wpw";

interface QuoteStatusUpdate {
  quote_id: string;
  quote_number: string;
  new_status: string;
  previous_status?: string;
  updated_by: string;
  notes?: string;
  callback_date?: string;
  phone_contacted_at?: string;
  sms_sent_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate embed secret
    const embedSecret = req.headers.get("x-wpw-embed-secret");
    const expectedSecret = Deno.env.get("WPW_EMBED_SECRET");

    if (!embedSecret || embedSecret !== expectedSecret) {
      console.error("[quote-status-webhook] Invalid or missing embed secret");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Get service key for external database
    const externalServiceKey = Deno.env.get("EXTERNAL_QUOTE_DB_SERVICE_KEY");
    
    if (!externalServiceKey) {
      console.error("[quote-status-webhook] Missing EXTERNAL_QUOTE_DB_SERVICE_KEY");
      return new Response(
        JSON.stringify({ success: false, error: "External database not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, externalServiceKey);

    const body: QuoteStatusUpdate = await req.json();
    const { 
      quote_id,
      quote_number,
      new_status,
      previous_status,
      updated_by,
      notes,
      callback_date,
      phone_contacted_at,
      sms_sent_at
    } = body;

    console.log("[quote-status-webhook] Updating quote:", { quote_id, quote_number, new_status, updated_by });

    if (!quote_id && !quote_number) {
      return new Response(
        JSON.stringify({ success: false, error: "quote_id or quote_number required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      status: new_status,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) updateData.notes = notes;
    if (callback_date !== undefined) updateData.callback_date = callback_date;
    if (phone_contacted_at !== undefined) updateData.phone_contacted_at = phone_contacted_at;
    if (sms_sent_at !== undefined) updateData.sms_sent_at = sms_sent_at;

    // Update by ID or quote number
    let query = externalSupabase.from("quotes").update(updateData);
    
    if (quote_id) {
      query = query.eq("id", quote_id);
    } else {
      query = query.eq("quote_number", quote_number);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error("[quote-status-webhook] Update error:", error);
      throw error;
    }

    console.log("[quote-status-webhook] Quote updated successfully:", data?.quote_number);

    // Log the status change to local WrapCommand database for audit
    const localSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await localSupabase.from("ai_actions").insert({
      action_type: "external_quote_status_update",
      status: "completed",
      action_payload: {
        tenant_id: TENANT_ID,
        quote_id: data?.id,
        quote_number: data?.quote_number,
        previous_status,
        new_status,
        updated_by,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: TENANT_ID,
        quote: data,
        message: `Quote ${data?.quote_number} status updated to ${new_status}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[quote-status-webhook] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
