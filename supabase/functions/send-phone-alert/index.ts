import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { callSid, callerPhone, classification } = await req.json();

    console.log(`[send-phone-alert] Sending alert for call ${callSid}`);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const jacksonPhoneNumber = Deno.env.get("JACKSON_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber || !jacksonPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Format phone number for display
    const formatPhone = (phone: string) => {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      if (cleaned.length === 11 && cleaned.startsWith("1")) {
        return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      return phone;
    };

    // Build SMS message
    const isHotLead = classification.is_hot_lead;
    const intent = classification.intent;
    const emoji = isHotLead ? "🔥" : intent === "upset_customer" ? "⚠️" : "📞";
    
    let alertType = "New Call";
    if (isHotLead) alertType = "HOT LEAD";
    if (intent === "upset_customer") alertType = "UPSET CUSTOMER";

    const vehicleInfo = classification.vehicle_info;
    const vehicleStr = vehicleInfo && (vehicleInfo.year || vehicleInfo.make || vehicleInfo.model)
      ? `\n🚗 ${[vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(" ")}`
      : "";

    const smsBody = `${emoji} WPW ${alertType}!

📞 ${formatPhone(callerPhone)}
${classification.customer_name ? `👤 ${classification.customer_name}` : ""}${vehicleStr}

"${classification.summary}"

Reply CALL to call back.`;

    console.log(`[send-phone-alert] SMS body:`, smsBody);

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const smsResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: jacksonPhoneNumber,
        From: twilioPhoneNumber,
        Body: smsBody,
      }),
    });

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text();
      console.error("[send-phone-alert] Twilio error:", errorText);
      throw new Error(`Twilio SMS failed: ${errorText}`);
    }

    const smsResult = await smsResponse.json();
    console.log(`[send-phone-alert] SMS sent, SID: ${smsResult.sid}`);

    // Update phone call record with SMS status
    const { error: updateError } = await supabase
      .from("phone_calls")
      .update({
        sms_sent: true,
        sms_sent_at: new Date().toISOString(),
      })
      .eq("twilio_call_sid", callSid);

    if (updateError) {
      console.error("[send-phone-alert] Error updating phone call:", updateError);
    }

    // Create an agent alert for the dashboard
    await supabase.from("agent_alerts").insert({
      agent_id: "taylor_phone",
      alert_type: isHotLead ? "hot_lead" : intent === "upset_customer" ? "upset_customer" : "new_call",
      priority: isHotLead || intent === "upset_customer" ? "high" : "normal",
      customer_name: classification.customer_name,
      message_excerpt: classification.summary,
      metadata: {
        call_sid: callSid,
        caller_phone: callerPhone,
        classification,
        sms_sid: smsResult.sid,
      },
    });

    return new Response(
      JSON.stringify({ success: true, smsSid: smsResult.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-phone-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
