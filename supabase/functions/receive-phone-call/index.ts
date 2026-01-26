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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const callerPhone = formData.get("From") as string;
    const calledPhone = formData.get("To") as string;
    const speechResult = formData.get("SpeechResult") as string | null;

    console.log(`[receive-phone-call] Call from ${callerPhone}, SID: ${callSid}`);

    if (speechResult) {
      // This is a callback after gathering speech - process it
      console.log(`[receive-phone-call] Speech result: ${speechResult}`);

      // Call process-phone-speech function
      const { error: invokeError } = await supabase.functions.invoke("process-phone-speech", {
        body: {
          callSid,
          callerPhone,
          speechResult,
        },
      });

      if (invokeError) {
        console.error("[receive-phone-call] Error invoking process-phone-speech:", invokeError);
      }

      // Thank the caller and end
      const thankYouTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Thank you for calling WePrintWraps! One of our team members will reach out to you shortly. Have a great day!
  </Say>
  <Hangup/>
</Response>`;

      return new Response(thankYouTwiml, {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    // First call - create record and gather speech
    const { error: insertError } = await supabase.from("phone_calls").insert({
      twilio_call_sid: callSid,
      caller_phone: callerPhone,
      status: "in_progress",
    });

    if (insertError) {
      console.error("[receive-phone-call] Error inserting phone call:", insertError);
    }

    // Return TwiML greeting with speech gathering
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const actionUrl = `${supabaseUrl}/functions/v1/receive-phone-call`;

    const greetingTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi, thanks for calling WePrintWraps! I'm Jordan, our AI assistant. 
    How can I help you today? Just tell me what you're looking for, 
    like a quote for a vehicle wrap, and I'll make sure the right person gets back to you.
  </Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${actionUrl}">
    <Say voice="Polly.Joanna">
      Go ahead, I'm listening.
    </Say>
  </Gather>
  <Say voice="Polly.Joanna">
    I didn't catch that. If you need help, please leave a message after the beep or call us back during business hours.
  </Say>
  <Record maxLength="120" action="${actionUrl}" />
</Response>`;

    return new Response(greetingTwiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[receive-phone-call] Error:", error);
    
    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    I'm sorry, we're experiencing technical difficulties. Please try calling back later or visit our website at weprintwraps.com.
  </Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});
