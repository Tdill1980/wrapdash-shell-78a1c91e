import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Resend webhook event types
interface ResendWebhookEvent {
  type: "email.sent" | "email.delivered" | "email.bounced" | "email.complained" | "email.opened" | "email.clicked";
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      message: string;
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const event: ResendWebhookEvent = await req.json();
    
    console.log("Received Resend webhook:", event.type, event.data);

    const email = event.data.to?.[0];
    if (!email) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    switch (event.type) {
      case "email.bounced":
        // Record bounce
        await supabase.from("email_bounces").insert({
          email: email.toLowerCase(),
          bounce_type: "hard",
          reason: event.data.bounce?.message || "Unknown bounce",
          provider_data: event.data,
        });

        // Deactivate enrollments for bounced email
        await supabase
          .from("email_sequence_enrollments")
          .update({ is_active: false })
          .eq("customer_email", email.toLowerCase())
          .eq("is_active", true);

        console.log(`Recorded hard bounce for: ${email}`);
        break;

      case "email.complained":
        // Treat complaints as unsubscribes
        await supabase.from("email_unsubscribes").upsert({
          email: email.toLowerCase(),
          reason: "spam_complaint",
          unsubscribed_at: new Date().toISOString(),
        }, {
          onConflict: "email",
        });

        // Record as complaint bounce
        await supabase.from("email_bounces").insert({
          email: email.toLowerCase(),
          bounce_type: "complaint",
          reason: "Spam complaint",
          provider_data: event.data,
        });

        // Deactivate enrollments
        await supabase
          .from("email_sequence_enrollments")
          .update({
            is_active: false,
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("customer_email", email.toLowerCase())
          .eq("is_active", true);

        console.log(`Recorded spam complaint for: ${email}`);
        break;

      case "email.delivered":
        // Update email tracking status
        console.log(`Email delivered to: ${email}`);
        break;

      case "email.opened":
        console.log(`Email opened by: ${email}`);
        break;

      case "email.clicked":
        console.log(`Email clicked by: ${email}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in resend-bounce-webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});