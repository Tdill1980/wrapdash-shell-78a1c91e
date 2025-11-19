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
    const redirect = url.searchParams.get("redirect");

    if (!utim || !redirect) {
      return new Response("Missing parameters", { status: 400, headers: corsHeaders });
    }

    // Decode UTIM
    const decoded = atob(utim);
    const [customerId, quoteId, stage, emailId, timestamp] = decoded.split(":");

    console.log("Tracking email click:", { customerId, quoteId, stage, redirect });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert email event
    const { error: eventError } = await supabase.from("email_events").insert({
      event_type: "clicked",
      customer_id: customerId,
      quote_id: quoteId,
      utim_data: { stage, emailId, timestamp },
      metadata: {
        redirect_url: redirect,
        user_agent: req.headers.get("user-agent"),
      },
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
      const openCount = quote.open_count || 0;
      const newClickCount = (quote.click_count || 0) + 1;
      const utimScore = openCount + newClickCount * 3;
      const engagementLevel = newClickCount >= 1 ? "hot" : openCount >= 3 ? "warm" : "cold";

      await supabase
        .from("quotes")
        .update({
          click_count: newClickCount,
          utim_score: utimScore,
          engagement_level: engagementLevel,
          last_activity: new Date().toISOString(),
        })
        .eq("id", quoteId);
    }

    // Redirect to original URL
    return Response.redirect(redirect, 302);
  } catch (error) {
    console.error("Error in track-email-click:", error);
    return new Response("Error processing click", { status: 500, headers: corsHeaders });
  }
});
