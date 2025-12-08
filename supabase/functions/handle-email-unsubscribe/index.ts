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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const reason = url.searchParams.get("reason") || "user_requested";

    if (!email) {
      return new Response("Email parameter required", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Processing unsubscribe for: ${email}`);

    // Add to unsubscribes table
    const { error: insertError } = await supabase
      .from("email_unsubscribes")
      .upsert({
        email: email.toLowerCase(),
        reason,
        unsubscribed_at: new Date().toISOString(),
      }, {
        onConflict: "email",
      });

    if (insertError) {
      console.error("Error inserting unsubscribe:", insertError);
    }

    // Deactivate any active enrollments for this email
    const { error: updateError } = await supabase
      .from("email_sequence_enrollments")
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("customer_email", email.toLowerCase())
      .eq("is_active", true);

    if (updateError) {
      console.error("Error updating enrollments:", updateError);
    }

    // Return a nice HTML confirmation page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed - WrapCommand</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #0A0A0F 0%, #16161E 100%);
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #E7E7EF;
            }
            .container {
              text-align: center;
              padding: 40px;
              max-width: 500px;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #00AFFF;
              margin-bottom: 16px;
            }
            p {
              color: #B8B8C7;
              line-height: 1.6;
            }
            .email {
              background: rgba(0, 175, 255, 0.1);
              border: 1px solid rgba(0, 175, 255, 0.3);
              padding: 10px 20px;
              border-radius: 8px;
              display: inline-block;
              margin: 20px 0;
              color: #00AFFF;
            }
            .footer {
              margin-top: 40px;
              font-size: 14px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>You've Been Unsubscribed</h1>
            <div class="email">${email}</div>
            <p>You will no longer receive marketing emails from WrapCommand. We're sorry to see you go!</p>
            <p>If this was a mistake, simply reply to any previous email to resubscribe.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WrapCommand™</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in handle-email-unsubscribe:", error);
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;">
          <h1>Oops!</h1>
          <p>Something went wrong. Please try again or contact support.</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  }
});