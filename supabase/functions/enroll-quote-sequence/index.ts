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

interface EnrollRequest {
  quoteId: string;
  customerEmail: string;
  customerName?: string;
  sequenceId?: string; // Optional - uses default "New Quote Follow-up" if not provided
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, customerEmail, customerName, sequenceId }: EnrollRequest = await req.json();

    if (!quoteId || !customerEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Enrolling ${customerEmail} in sequence for quote ${quoteId}`);

    // Check if already unsubscribed
    const { data: unsubscribe } = await supabase
      .from("email_unsubscribes")
      .select("id")
      .eq("email", customerEmail.toLowerCase())
      .single();

    if (unsubscribe) {
      console.log(`${customerEmail} is unsubscribed, skipping enrollment`);
      return new Response(JSON.stringify({ 
        success: false, 
        reason: "email_unsubscribed" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check for hard bounces
    const { data: bounce } = await supabase
      .from("email_bounces")
      .select("id")
      .eq("email", customerEmail.toLowerCase())
      .eq("bounce_type", "hard")
      .single();

    if (bounce) {
      console.log(`${customerEmail} has hard bounce, skipping enrollment`);
      return new Response(JSON.stringify({ 
        success: false, 
        reason: "email_bounced" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if already enrolled in this sequence
    const { data: existingEnrollment } = await supabase
      .from("email_sequence_enrollments")
      .select("id")
      .eq("quote_id", quoteId)
      .eq("is_active", true)
      .single();

    if (existingEnrollment) {
      console.log(`Quote ${quoteId} already enrolled in active sequence`);
      return new Response(JSON.stringify({ 
        success: false, 
        reason: "already_enrolled",
        enrollment_id: existingEnrollment.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get sequence (default to "New Quote Follow-up")
    let targetSequenceId = sequenceId;
    if (!targetSequenceId) {
      const { data: defaultSequence } = await supabase
        .from("email_sequences")
        .select("id")
        .eq("name", "New Quote Follow-up")
        .eq("is_active", true)
        .single();

      if (defaultSequence) {
        targetSequenceId = defaultSequence.id;
      }
    }

    if (!targetSequenceId) {
      return new Response(JSON.stringify({ 
        error: "No active sequence found" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("email_sequence_enrollments")
      .insert({
        quote_id: quoteId,
        sequence_id: targetSequenceId,
        customer_email: customerEmail.toLowerCase(),
        customer_name: customerName,
        is_active: true,
      })
      .select()
      .single();

    if (enrollError) {
      console.error("Error creating enrollment:", enrollError);
      throw enrollError;
    }

    console.log(`Successfully enrolled ${customerEmail} in sequence:`, enrollment.id);

    return new Response(JSON.stringify({ 
      success: true, 
      enrollment_id: enrollment.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in enroll-quote-sequence:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});