import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhoneCallClassification {
  intent: "quote_request" | "upset_customer" | "order_status" | "general_inquiry";
  summary: string;
  is_hot_lead: boolean;
  customer_name?: string;
  vehicle_info?: {
    year?: string;
    make?: string;
    model?: string;
  };
  messages?: Array<{ role: "ai" | "caller"; content: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { callSid, callerPhone, speechResult } = await req.json();

    console.log(`[process-phone-speech] Processing call ${callSid}`);
    console.log(`[process-phone-speech] Speech: ${speechResult}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Use OpenAI to classify the speech
    const classificationPrompt = `You are an AI assistant for WePrintWraps, a vehicle wrap printing company.

Analyze this phone call transcript and extract key information:

TRANSCRIPT: "${speechResult}"

Respond in JSON format with these fields:
{
  "intent": "quote_request" | "upset_customer" | "order_status" | "general_inquiry",
  "summary": "Brief 1-2 sentence summary of what the caller wants",
  "is_hot_lead": true/false (true if they mention fleet, multiple vehicles, commercial, or seem ready to buy),
  "customer_name": "Name if mentioned, or null",
  "vehicle_info": {
    "year": "Year if mentioned or null",
    "make": "Make if mentioned or null",
    "model": "Model if mentioned or null"
  }
}

Rules:
- quote_request: Caller is asking about pricing, quotes, or wants to get a wrap
- upset_customer: Caller sounds frustrated, angry, or is complaining
- order_status: Caller is asking about an existing order
- general_inquiry: Any other type of call
- is_hot_lead = true for: fleet mentions, multiple vehicles, commercial projects, wrap shops, or urgent timelines`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a JSON-only response bot. Output valid JSON only, no markdown." },
          { role: "user", content: classificationPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const responseContent = openaiData.choices?.[0]?.message?.content || "{}";
    
    let classification: PhoneCallClassification;
    try {
      classification = JSON.parse(responseContent.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      console.error("[process-phone-speech] Failed to parse OpenAI response:", responseContent);
      classification = {
        intent: "general_inquiry",
        summary: speechResult?.substring(0, 100) || "Unable to process",
        is_hot_lead: false,
      };
    }

    // Add the conversation messages
    classification.messages = [
      { role: "ai", content: "Hi, thanks for calling WePrintWraps! I'm Jordan, our AI assistant. How can I help you today?" },
      { role: "caller", content: speechResult },
    ];

    console.log(`[process-phone-speech] Classification:`, classification);

    // Update the phone call record
    const { error: updateError } = await supabase
      .from("phone_calls")
      .update({
        transcript: speechResult,
        ai_classification: classification,
        is_hot_lead: classification.is_hot_lead,
        customer_name: classification.customer_name,
        vehicle_info: classification.vehicle_info,
        status: "completed",
      })
      .eq("twilio_call_sid", callSid);

    if (updateError) {
      console.error("[process-phone-speech] Error updating phone call:", updateError);
    }

    // If hot lead or upset customer, send SMS alert
    if (classification.is_hot_lead || classification.intent === "upset_customer") {
      console.log(`[process-phone-speech] Triggering SMS alert for ${classification.intent}`);
      
      const { error: alertError } = await supabase.functions.invoke("send-phone-alert", {
        body: {
          callSid,
          callerPhone,
          classification,
        },
      });

      if (alertError) {
        console.error("[process-phone-speech] Error sending alert:", alertError);
      }
    }

    // Create a conversation record for MightyChat inbox
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        channel: "phone",
        subject: classification.summary,
        priority: classification.is_hot_lead ? "high" : classification.intent === "upset_customer" ? "urgent" : "normal",
        review_status: "needs_response",
        metadata: {
          phone: callerPhone,
          call_sid: callSid,
          intent: classification.intent,
          vehicle_info: classification.vehicle_info,
        },
      })
      .select()
      .single();

    if (convError) {
      console.error("[process-phone-speech] Error creating conversation:", convError);
    } else if (conversation) {
      // Link the phone call to the conversation
      await supabase
        .from("phone_calls")
        .update({ conversation_id: conversation.id })
        .eq("twilio_call_sid", callSid);

      // Create a message for the transcript
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        content: speechResult,
        direction: "inbound",
        sender_name: classification.customer_name || "Caller",
        metadata: { source: "phone_transcript" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, classification }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[process-phone-speech] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
