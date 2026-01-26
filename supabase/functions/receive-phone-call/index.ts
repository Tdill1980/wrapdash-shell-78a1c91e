import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// WPW organization ID for fallback
const WPW_ORG_ID = "51aa96db-c06d-41ae-b3cb-25b045c75caf";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const callerPhone = formData.get("From") as string;
    const calledPhone = formData.get("To") as string;
    const speechResult = formData.get("SpeechResult") as string | null;

    console.log(`[receive-phone-call] Call from ${callerPhone} to ${calledPhone}, SID: ${callSid}`);

    // Look up organization by the Twilio number that received the call
    let phoneSettings: any = null;
    let organizationId: string | null = null;
    let companyName = "WePrintWraps";
    let agentName = "Jordan";

    // Clean phone number for lookup (remove + prefix variations)
    const cleanedCalledPhone = calledPhone.replace(/^\+/, "");
    
    const { data: settingsData } = await supabase
      .from("organization_phone_settings")
      .select("*, organizations(name, subdomain)")
      .or(`twilio_phone_number.eq.${calledPhone},twilio_phone_number.eq.${cleanedCalledPhone},twilio_phone_number.eq.+${cleanedCalledPhone}`)
      .eq("phone_agent_enabled", true)
      .maybeSingle();

    if (settingsData) {
      phoneSettings = settingsData;
      organizationId = settingsData.organization_id;
      companyName = settingsData.company_name || settingsData.organizations?.name || "our company";
      agentName = settingsData.ai_agent_name || "Jordan";
      console.log(`[receive-phone-call] Found org settings for ${companyName}`);
    } else {
      // Fallback: Check if this is the WPW Twilio number from env
      const wpwTwilioNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
      if (wpwTwilioNumber && (calledPhone === wpwTwilioNumber || calledPhone.includes(wpwTwilioNumber.replace(/^\+/, "")))) {
        organizationId = WPW_ORG_ID;
        companyName = "WePrintWraps";
        agentName = "Jordan";
        console.log(`[receive-phone-call] Using WPW fallback`);
      } else {
        console.log(`[receive-phone-call] No org found for number ${calledPhone}, using defaults`);
      }
    }

    if (speechResult) {
      console.log(`[receive-phone-call] Speech result: ${speechResult}`);

      const { error: invokeError } = await supabase.functions.invoke("process-phone-speech", {
        body: {
          callSid,
          callerPhone,
          speechResult,
          organizationId,
        },
      });

      if (invokeError) {
        console.error("[receive-phone-call] Error invoking process-phone-speech:", invokeError);
      }

      const thankYouTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Thank you for calling ${companyName}! One of our team members will reach out to you shortly. Have a great day!
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
      organization_id: organizationId,
      status: "in_progress",
    });

    if (insertError) {
      console.error("[receive-phone-call] Error inserting phone call:", insertError);
    }

    // Return TwiML greeting with speech gathering
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const actionUrl = `${supabaseUrl}/functions/v1/receive-phone-call`;

    // Use custom greeting if provided, otherwise use default
    const customGreeting = phoneSettings?.greeting_message;
    const greetingText = customGreeting || 
      `Hi, thanks for calling ${companyName}! I'm ${agentName}, our AI assistant. 
       How can I help you today? Just tell me what you're looking for, 
       like a quote for a vehicle wrap, and I'll make sure the right person gets back to you.`;

    const greetingTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    ${greetingText}
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
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    I'm sorry, we're experiencing technical difficulties. Please try calling back later.
  </Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});
