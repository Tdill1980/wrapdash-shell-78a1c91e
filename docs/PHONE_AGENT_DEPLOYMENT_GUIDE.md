# Multi-Tenant AI Phone Agent System - Deployment Guide

## Overview

The AI Phone Agent System is a multi-tenant, Twilio-powered automated call handling system that:
- Answers incoming calls with AI-generated greetings
- Transcribes and classifies call intent using Lovable AI (Gemini)
- Routes hot leads and urgent calls via SMS alerts
- Integrates with MightyChat for unified inbox management

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Edge Functions](#edge-functions)
5. [Frontend Components](#frontend-components)
6. [Twilio Setup](#twilio-setup)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Call Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer Dials ──► Twilio ──► receive-phone-call               │
│                                      │                          │
│                          ┌───────────┴───────────┐              │
│                          │                       │              │
│                    Lookup Org by          Create phone_calls    │
│                    phone number              record             │
│                          │                       │              │
│                          └───────────┬───────────┘              │
│                                      │                          │
│                              Return TwiML                       │
│                           (Dynamic Greeting)                    │
│                                      │                          │
│                              ◄───────┘                          │
│                                      │                          │
│                         Customer Speaks                         │
│                                      │                          │
│                                      ▼                          │
│                         process-phone-speech                    │
│                                      │                          │
│                          ┌───────────┴───────────┐              │
│                          │                       │              │
│                    AI Classifies          Create MightyChat     │
│                       Intent              conversation          │
│                          │                       │              │
│                          └───────────┬───────────┘              │
│                                      │                          │
│                        (if hot lead or upset)                   │
│                                      │                          │
│                                      ▼                          │
│                          send-phone-alert                       │
│                                      │                          │
│                          ┌───────────┴───────────┐              │
│                          │                       │              │
│                    Lookup Org's           Send SMS via          │
│                    alert settings            Twilio             │
│                          │                       │              │
│                          └───────────┬───────────┘              │
│                                      │                          │
│                           Update Records                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Secrets (Supabase Edge Function Secrets)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | ✅ Auto-configured |
| `LOVABLE_API_KEY` | Lovable AI gateway key | ✅ Auto-configured |
| `TWILIO_ACCOUNT_SID` | Platform Twilio Account SID | ✅ For fallback |
| `TWILIO_AUTH_TOKEN` | Platform Twilio Auth Token | ✅ For fallback |
| `TWILIO_PHONE_NUMBER` | Platform/WPW Twilio number | ✅ For fallback |
| `JACKSON_PHONE_NUMBER` | WPW fallback alert number | Optional |

### Twilio Account Requirements

- Active Twilio account with verified phone numbers
- Voice-enabled phone number(s)
- SMS-enabled phone number(s)
- Webhook configuration access

---

## Database Schema

### Table 1: `organization_phone_settings`

Stores per-organization phone agent configuration.

```sql
-- Create the table
CREATE TABLE public.organization_phone_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  twilio_phone_number TEXT,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  alert_phone_number TEXT NOT NULL,
  alert_email TEXT,
  company_name TEXT DEFAULT 'our company',
  ai_agent_name TEXT DEFAULT 'Jordan',
  greeting_message TEXT,
  phone_agent_enabled BOOLEAN DEFAULT false,
  sms_alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE organization_phone_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view phone settings" 
  ON organization_phone_settings FOR SELECT 
  USING (public.is_member_of_organization(auth.uid(), organization_id));

CREATE POLICY "Org owners can insert phone settings" 
  ON organization_phone_settings FOR INSERT 
  WITH CHECK (public.is_organization_owner(organization_id));

CREATE POLICY "Org owners can update phone settings" 
  ON organization_phone_settings FOR UPDATE 
  USING (public.is_organization_owner(organization_id));

CREATE POLICY "Org owners can delete phone settings" 
  ON organization_phone_settings FOR DELETE 
  USING (public.is_organization_owner(organization_id));

-- Timestamp trigger
CREATE TRIGGER update_organization_phone_settings_updated_at
  BEFORE UPDATE ON organization_phone_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Table 2: `phone_calls`

Stores call metadata, transcripts, and AI classifications.

```sql
-- Create the table
CREATE TABLE public.phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  organization_id UUID REFERENCES organizations(id),
  twilio_call_sid TEXT NOT NULL UNIQUE,
  caller_phone TEXT NOT NULL,
  call_duration_seconds INTEGER,
  transcript TEXT,
  ai_classification JSONB DEFAULT '{}',
  is_hot_lead BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress',
  customer_name TEXT,
  vehicle_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your needs)
CREATE POLICY "Org members can view phone calls" 
  ON phone_calls FOR SELECT 
  USING (organization_id IS NULL OR public.is_member_of_organization(auth.uid(), organization_id));

CREATE POLICY "Service role can insert" 
  ON phone_calls FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service role can update" 
  ON phone_calls FOR UPDATE 
  USING (true);

-- Timestamp trigger
CREATE TRIGGER update_phone_calls_updated_at
  BEFORE UPDATE ON phone_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Edge Functions

### Function 1: `receive-phone-call`

**Purpose**: Twilio webhook entry point. Answers calls, performs multi-tenant lookup, returns TwiML.

**File**: `supabase/functions/receive-phone-call/index.ts`

```typescript
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
```

---

### Function 2: `process-phone-speech`

**Purpose**: AI classification of call intent, creates MightyChat records, triggers alerts.

**File**: `supabase/functions/process-phone-speech/index.ts`

```typescript
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
  urgency?: "low" | "medium" | "high";
  messages?: Array<{ role: "ai" | "caller"; content: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { callSid, callerPhone, speechResult, organizationId } = await req.json();

    console.log(`[process-phone-speech] Processing call ${callSid} for org ${organizationId}`);
    console.log(`[process-phone-speech] Speech: ${speechResult}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get org info for context
    let companyName = "a vehicle wrap shop";
    let aiAgentName = "Jordan";
    
    if (organizationId) {
      const { data: phoneSettings } = await supabase
        .from("organization_phone_settings")
        .select("company_name, ai_agent_name, organizations(name)")
        .eq("organization_id", organizationId)
        .maybeSingle();
      
      if (phoneSettings) {
        companyName = phoneSettings.company_name || (phoneSettings.organizations as any)?.name || "a vehicle wrap shop";
        aiAgentName = phoneSettings.ai_agent_name || "Jordan";
      }
    }

    // Use Lovable AI to classify the call
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const classificationPrompt = `You are an AI assistant for ${companyName}, a vehicle wrap printing company.

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
  },
  "urgency": "low" | "medium" | "high"
}

Rules:
- quote_request: Caller is asking about pricing, quotes, or wants to get a wrap
- upset_customer: Caller sounds frustrated, angry, or is complaining
- order_status: Caller is asking about an existing order
- general_inquiry: Any other type of call
- is_hot_lead = true for: fleet mentions, multiple vehicles, commercial projects, wrap shops, or urgent timelines`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a JSON-only response bot. Output valid JSON only, no markdown." },
          { role: "user", content: classificationPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[process-phone-speech] AI error:", errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || "{}";
    
    let classification: PhoneCallClassification;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      classification = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        intent: "general_inquiry",
        summary: speechResult?.substring(0, 100) || "Unable to process",
        is_hot_lead: false,
      };
    } catch {
      console.error("[process-phone-speech] Failed to parse AI response:", responseContent);
      classification = {
        intent: "general_inquiry",
        summary: speechResult?.substring(0, 100) || "Unable to process",
        is_hot_lead: false,
      };
    }

    // Add the conversation messages
    classification.messages = [
      { role: "ai", content: `Hi, thanks for calling ${companyName}! I'm ${aiAgentName}, our AI assistant. How can I help you today?` },
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

    // Create a conversation record for MightyChat inbox
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        organization_id: organizationId,
        channel: "phone",
        subject: classification.summary,
        customer_name: classification.customer_name || "Phone Caller",
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

    // If hot lead or upset customer, send SMS alert
    if (classification.is_hot_lead || classification.intent === "upset_customer") {
      console.log(`[process-phone-speech] Triggering SMS alert for ${classification.intent}`);
      
      const { error: alertError } = await supabase.functions.invoke("send-phone-alert", {
        body: {
          callSid,
          callerPhone,
          classification,
          organizationId,
        },
      });

      if (alertError) {
        console.error("[process-phone-speech] Error sending alert:", alertError);
      }
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
```

---

### Function 3: `send-phone-alert`

**Purpose**: Sends SMS alerts to organization's configured alert number.

**File**: `supabase/functions/send-phone-alert/index.ts`

```typescript
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
    const { callSid, callerPhone, classification, organizationId } = await req.json();

    console.log(`[send-phone-alert] Sending alert for call ${callSid}, org ${organizationId}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up organization's phone settings
    let alertPhoneNumber: string | null = null;
    let twilioPhoneNumber: string | null = null;
    let twilioAccountSid: string | null = null;
    let twilioAuthToken: string | null = null;
    let companyName = "WPW";
    let smsAlertsEnabled = true;

    if (organizationId) {
      const { data: phoneSettings } = await supabase
        .from("organization_phone_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (phoneSettings) {
        alertPhoneNumber = phoneSettings.alert_phone_number;
        twilioPhoneNumber = phoneSettings.twilio_phone_number;
        twilioAccountSid = phoneSettings.twilio_account_sid;
        twilioAuthToken = phoneSettings.twilio_auth_token;
        companyName = phoneSettings.company_name || "Your Shop";
        smsAlertsEnabled = phoneSettings.sms_alerts_enabled !== false;
        console.log(`[send-phone-alert] Using org settings for ${companyName}`);
      }
    }

    // Fallback to environment variables (WPW legacy support)
    if (!alertPhoneNumber) {
      alertPhoneNumber = Deno.env.get("JACKSON_PHONE_NUMBER") || null;
      console.log(`[send-phone-alert] Using fallback JACKSON_PHONE_NUMBER`);
    }
    if (!twilioPhoneNumber) {
      twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER") || null;
    }
    if (!twilioAccountSid) {
      twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || null;
    }
    if (!twilioAuthToken) {
      twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN") || null;
    }

    if (!smsAlertsEnabled) {
      console.log(`[send-phone-alert] SMS alerts disabled for org ${organizationId}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "SMS alerts disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber || !alertPhoneNumber) {
      throw new Error("Twilio credentials or alert phone not configured");
    }

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

    const smsBody = `${emoji} ${companyName} ${alertType}!

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
        To: alertPhoneNumber,
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
      organization_id: organizationId,
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
```

---

### Config.toml Entries

Add to `supabase/config.toml`:

```toml
[functions.receive-phone-call]
verify_jwt = false

[functions.process-phone-speech]
verify_jwt = false

[functions.send-phone-alert]
verify_jwt = false
```

---

## Frontend Components

### Component 1: Settings Page

**File**: `src/pages/settings/PhoneSettings.tsx`

```tsx
import { MainLayout } from "@/layouts/MainLayout";
import { PhoneAgentSettings } from "@/components/settings/PhoneAgentSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Loader2 } from "lucide-react";

export default function PhoneSettings() {
  const { data: organizationId, isLoading } = useQuery({
    queryKey: ["user-organization"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      return data?.organization_id ?? null;
    },
  });

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-amber-500" />
            Phone Agent Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your AI phone agent for automated call handling
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PhoneAgentSettings organizationId={organizationId} />
        )}
      </div>
    </MainLayout>
  );
}
```

### Component 2: Settings Form

**File**: `src/components/settings/PhoneAgentSettings.tsx`

(See full code in the codebase - 265 lines)

### Hook: usePhoneSettings

**File**: `src/hooks/usePhoneSettings.ts`

(See full code in the codebase - 120 lines)

### Route Entry

**File**: `src/App.tsx`

```tsx
import PhoneSettings from "./pages/settings/PhoneSettings";

// Add to routes:
<Route path="/settings/phone" element={<PhoneSettings />} />
```

---

## Twilio Setup

### Step 1: Get Your Twilio Credentials

1. Log in to [Twilio Console](https://console.twilio.com)
2. Copy your **Account SID** and **Auth Token** from the dashboard
3. Purchase or use an existing phone number with Voice and SMS capabilities

### Step 2: Configure Voice Webhook

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. Under **Voice Configuration**:
   - Set **Configure with**: Webhooks
   - Set **A call comes in**: Webhook
   - **URL**: `https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/receive-phone-call`
   - **HTTP Method**: `POST`
4. Click **Save Configuration**

### Step 3: For Multi-Tenant SaaS

Each organization configures their own Twilio number:

1. Organization owner goes to `/settings/phone`
2. Enters their Twilio phone number
3. Optionally provides their own Twilio Account SID and Auth Token
4. If no custom credentials, the platform's shared Twilio account is used

---

## Testing & Verification

### Test 1: Verify Webhook Endpoint

```bash
curl -X POST "https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/receive-phone-call" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST123&From=+15551234567&To=+15559876543"
```

Expected: TwiML response with greeting

### Test 2: Verify AI Classification

```bash
curl -X POST "https://wzwqhfbmymrengjqikjl.supabase.co/functions/v1/process-phone-speech" \
  -H "Content-Type: application/json" \
  -d '{"callSid":"TEST123","callerPhone":"+15551234567","speechResult":"I need a quote for wrapping my Ford F-150","organizationId":"your-org-id"}'
```

Expected: JSON with classification

### Test 3: Make a Real Call

1. Call your configured Twilio number
2. Listen for the AI greeting
3. Speak your request
4. Verify call appears in MightyChat inbox
5. Verify SMS alert received (if hot lead)

---

## Troubleshooting

### Issue: "No org found for number"

**Cause**: The Twilio number isn't registered in `organization_phone_settings`

**Solution**: 
1. Add the phone number to settings at `/settings/phone`
2. Ensure `phone_agent_enabled` is true

### Issue: "Twilio credentials not configured"

**Cause**: Missing Twilio secrets or org settings

**Solution**:
1. Verify environment secrets are set
2. Or configure org-specific Twilio credentials

### Issue: "AI API error"

**Cause**: LOVABLE_API_KEY not configured or rate limited

**Solution**:
1. Verify LOVABLE_API_KEY secret exists
2. Check AI gateway logs for rate limiting

### Issue: No SMS received

**Cause**: SMS alerts disabled or wrong alert number

**Solution**:
1. Check `sms_alerts_enabled` in org settings
2. Verify `alert_phone_number` is correct
3. Check Twilio SMS logs for delivery status

---

## Summary

| Component | Type | Location |
|-----------|------|----------|
| `receive-phone-call` | Edge Function | `supabase/functions/receive-phone-call/index.ts` |
| `process-phone-speech` | Edge Function | `supabase/functions/process-phone-speech/index.ts` |
| `send-phone-alert` | Edge Function | `supabase/functions/send-phone-alert/index.ts` |
| `organization_phone_settings` | DB Table | PostgreSQL |
| `phone_calls` | DB Table | PostgreSQL |
| `PhoneAgentSettings` | UI Component | `src/components/settings/PhoneAgentSettings.tsx` |
| `usePhoneSettings` | React Hook | `src/hooks/usePhoneSettings.ts` |
| `PhoneSettings` | Page | `src/pages/settings/PhoneSettings.tsx` |

---

## Deployment Checklist

- [ ] Database tables created with RLS
- [ ] Edge functions deployed (automatic with Lovable)
- [ ] Twilio secrets configured in Supabase
- [ ] Twilio webhook configured to point to `receive-phone-call`
- [ ] Route added to App.tsx
- [ ] Settings UI accessible at `/settings/phone`
- [ ] Test call completed successfully
- [ ] SMS alerts working for hot leads
