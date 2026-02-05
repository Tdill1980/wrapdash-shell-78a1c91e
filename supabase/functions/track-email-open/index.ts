import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const utim = url.searchParams.get("utim");

    if (!utim) {
      console.error("No UTIM provided");
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Decode UTIM
    const decoded = atob(utim);
    const [customerId, quoteId, stage, emailId, timestamp] = decoded.split(":");

    console.log("Tracking email open:", { customerId, quoteId, stage });

    const supabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL') || Deno.env.get("SUPABASE_URL")!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert email event
    const { error: eventError } = await supabase.from("email_events").insert({
      event_type: "opened",
      customer_id: customerId,
      quote_id: quoteId,
      utim_data: { stage, emailId, timestamp },
      metadata: { user_agent: req.headers.get("user-agent") },
    });

    if (eventError) {
      console.error("Error inserting event:", eventError);
    }

    // Update quote engagement metrics
    const { data: quote } = await supabase
      .from("quotes")
      .select("open_count, click_count")
      .eq("id", quoteId)
      .single();

    if (quote) {
      const newOpenCount = (quote.open_count || 0) + 1;
      const clickCount = quote.click_count || 0;
      const utimScore = newOpenCount + clickCount * 3;
      const engagementLevel = clickCount >= 1 ? "hot" : newOpenCount >= 3 ? "warm" : "cold";

      await supabase
        .from("quotes")
        .update({
          open_count: newOpenCount,
          utim_score: utimScore,
          engagement_level: engagementLevel,
          last_activity: new Date().toISOString(),
        })
        .eq("id", quoteId);
    }

    // Return 1x1 transparent pixel
    const pixel = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));
    return new Response(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in track-email-open:", error);
    // Return pixel even on error
    const pixel = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));
    return new Response(pixel, {
      status: 200,
      headers: { "Content-Type": "image/gif", ...corsHeaders },
    });
  }
});
