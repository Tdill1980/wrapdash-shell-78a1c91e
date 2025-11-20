import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Edge function to manually log ApproveFlow emails
 * Can be called from frontend or other edge functions
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      projectId,
      emailType,
      recipientEmail,
      subject,
      status = 'sent',
      provider = 'klaviyo',
      metadata = {},
      errorMessage,
    } = await req.json();

    // Validate required fields
    if (!projectId || !emailType || !recipientEmail || !subject) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: projectId, emailType, recipientEmail, subject" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert email log
    const { data, error } = await supabase
      .from("approveflow_email_logs")
      .insert({
        project_id: projectId,
        email_type: emailType,
        recipient_email: recipientEmail,
        subject: subject,
        status: status,
        provider: provider,
        metadata: metadata,
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailLog: data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in log-approveflow-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
