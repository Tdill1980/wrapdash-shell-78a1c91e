# Multi-Tenant AI Phone Agent System - Deployment Guide

## Overview

The AI Phone Agent System is a multi-tenant, Twilio-powered automated call handling system that:
- Answers incoming calls with AI-generated greetings
- Transcribes and classifies call intent using Lovable AI (Gemini)
- Routes hot leads and urgent calls via SMS alerts
- Integrates with MightyChat for unified inbox management
- **Supports existing business numbers via call forwarding or porting**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Edge Functions](#edge-functions)
5. [Frontend Components](#frontend-components)
6. [Twilio Setup](#twilio-setup)
7. [Connecting Existing Phone Numbers](#connecting-existing-phone-numbers)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Call Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Customer dials existing business number                 │   │
│  │              OR                                          │   │
│  │  Customer dials new AI-assigned number                   │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  (If forwarded) Carrier forwards → Twilio Number         │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│               receive-phone-call                                │
│                          │                                      │
│          ┌───────────────┴───────────────┐                      │
│          │                               │                      │
│    Lookup Org by              Create phone_calls                │
│    phone number               record with                       │
│    (detect forwarding)        forwarding info                   │
│          │                               │                      │
│          └───────────────┬───────────────┘                      │
│                          │                                      │
│                  Return TwiML                                   │
│               (Dynamic Greeting)                                │
│                          │                                      │
│                  ◄───────┘                                      │
│                          │                                      │
│                 Customer Speaks                                 │
│                          │                                      │
│                          ▼                                      │
│             process-phone-speech                                │
│                          │                                      │
│          ┌───────────────┴───────────────┐                      │
│          │                               │                      │
│    AI Classifies              Create MightyChat                 │
│       Intent                  conversation                      │
│          │                               │                      │
│          └───────────────┬───────────────┘                      │
│                          │                                      │
│            (if hot lead or upset)                               │
│                          │                                      │
│                          ▼                                      │
│              send-phone-alert                                   │
│                          │                                      │
│          ┌───────────────┴───────────────┐                      │
│          │                               │                      │
│    Lookup Org's               Send SMS via                      │
│    alert settings                Twilio                         │
│          │                               │                      │
│          └───────────────┬───────────────┘                      │
│                          │                                      │
│                   Update Records                                │
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

Stores per-organization phone agent configuration including connection method.

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
  -- Connection method fields
  connection_method TEXT DEFAULT 'new_number' CHECK (connection_method IN ('new_number', 'port_number', 'forward_calls')),
  original_business_number TEXT,
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
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

#### Connection Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `new_number` | Get a new dedicated number from the platform | Fastest setup, recommended for new businesses |
| `forward_calls` | Keep existing number, forward calls to AI | Existing business number, no carrier change |
| `port_number` | Transfer existing number to platform | Full control, takes 1-3 business days |

### Table 2: `phone_calls`

Stores call metadata, transcripts, AI classifications, and forwarding information.

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
  -- Call forwarding detection fields
  forwarded_from TEXT,              -- Original number that forwarded the call
  original_called_number TEXT,      -- The original number the customer dialed
  forwarding_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE phone_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Index for faster forwarded call lookups
CREATE INDEX idx_phone_calls_forwarded ON phone_calls(forwarded_from) WHERE forwarded_from IS NOT NULL;
```

---

## Edge Functions

### Function 1: `receive-phone-call`

**Purpose**: Twilio webhook entry point. Answers calls, performs multi-tenant lookup, detects forwarding, returns TwiML.

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
    
    // Twilio forwarding headers - detect if call was forwarded
    const forwardedFrom = formData.get("ForwardedFrom") as string | null;
    const sipHeader = formData.get("SipHeader_X-Forwarded-For") as string | null;
    const callerIdName = formData.get("CallerName") as string | null;
    
    // Some carriers pass the original number in different headers
    const diversionHeader = formData.get("SipHeader_Diversion") as string | null;
    
    // Determine if this is a forwarded call
    const isForwarded = !!(forwardedFrom || sipHeader || diversionHeader);
    const detectedForwardedFrom = forwardedFrom || sipHeader || diversionHeader;

    console.log(`[receive-phone-call] Call from ${callerPhone} to ${calledPhone}, SID: ${callSid}`);
    if (isForwarded) {
      console.log(`[receive-phone-call] Forwarded call detected from: ${detectedForwardedFrom}`);
    }

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
      forwarded_from: detectedForwardedFrom || null,
      original_called_number: isForwarded ? calledPhone : null,
      forwarding_detected: isForwarded,
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

**Purpose**: Sends SMS alerts to organization owners for hot leads and urgent calls.

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

## Frontend Components

### Component 1: `PhoneSetupWizard.tsx`

**Purpose**: Guided setup wizard for connecting phone numbers via new number, forwarding, or porting.

**File**: `src/components/settings/PhoneSetupWizard.tsx`

```typescript
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  PhoneForwarded, 
  RefreshCw, 
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectionMethod = "new_number" | "port_number" | "forward_calls";

interface PhoneSetupWizardProps {
  onComplete: (data: {
    connectionMethod: ConnectionMethod;
    originalBusinessNumber?: string;
    twilioPhoneNumber?: string;
  }) => void;
  onCancel: () => void;
  assignedPlatformNumber?: string;
}

const STEPS = [
  { id: 1, title: "Choose Method", description: "How to connect your number" },
  { id: 2, title: "Configuration", description: "Set up your connection" },
  { id: 3, title: "Verify", description: "Test your setup" },
];

export function PhoneSetupWizard({ 
  onComplete, 
  onCancel,
  assignedPlatformNumber = "+1 (555) 123-4567" 
}: PhoneSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>("new_number");
  const [originalBusinessNumber, setOriginalBusinessNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        connectionMethod,
        originalBusinessNumber: connectionMethod !== "new_number" ? originalBusinessNumber : undefined,
        twilioPhoneNumber: connectionMethod === "new_number" ? assignedPlatformNumber : 
                          connectionMethod === "port_number" ? originalBusinessNumber : assignedPlatformNumber,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(assignedPlatformNumber.replace(/\D/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateVerification = () => {
    setVerificationStatus("testing");
    setTimeout(() => {
      setVerificationStatus("success");
    }, 2000);
  };

  const canProceed = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      if (connectionMethod === "new_number") return true;
      return originalBusinessNumber.length >= 10;
    }
    if (currentStep === 3) {
      return verificationStatus === "success" || connectionMethod === "new_number";
    }
    return false;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <CardTitle>Phone Agent Setup Wizard</CardTitle>
        </div>
        <CardDescription>
          Connect your phone number to enable AI-powered call answering.
        </CardDescription>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > step.id 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep === step.id 
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 text-muted-foreground">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 w-16 mx-2",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step 1: Choose Connection Method */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">How would you like to connect?</h3>
            <RadioGroup 
              value={connectionMethod} 
              onValueChange={(v) => setConnectionMethod(v as ConnectionMethod)}
              className="space-y-3"
            >
              <label 
                htmlFor="new_number"
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  connectionMethod === "new_number" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="new_number" id="new_number" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">Get a New Number</span>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll assign you a dedicated phone number. Fastest setup - ready in minutes.
                  </p>
                </div>
              </label>

              <label 
                htmlFor="forward_calls"
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  connectionMethod === "forward_calls" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="forward_calls" id="forward_calls" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <PhoneForwarded className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Forward Your Existing Number</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep your existing business number and forward calls to our AI. No carrier changes needed.
                  </p>
                </div>
              </label>

              <label 
                htmlFor="port_number"
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  connectionMethod === "port_number" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="port_number" id="port_number" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Port Your Existing Number</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transfer your existing number to our system. Takes 1-3 business days.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Configuration - See full component for details */}
        {/* Step 3: Verification - See full component for details */}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? onCancel : handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === 3 ? "Complete Setup" : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Component 2: `PhoneAgentSettings.tsx`

**Purpose**: Main settings panel for phone agent configuration.

**File**: `src/components/settings/PhoneAgentSettings.tsx`

```typescript
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Shield, Loader2, Sparkles, PhoneForwarded, RefreshCw, Settings2 } from "lucide-react";
import { usePhoneSettings, PhoneSettingsInput } from "@/hooks/usePhoneSettings";
import { PhoneSetupWizard, ConnectionMethod } from "./PhoneSetupWizard";

interface PhoneAgentSettingsProps {
  organizationId: string | null;
}

export function PhoneAgentSettings({ organizationId }: PhoneAgentSettingsProps) {
  const { settings, isLoading, saveSettings, isSaving } = usePhoneSettings(organizationId);
  const [showWizard, setShowWizard] = useState(false);
  
  const [formData, setFormData] = useState<PhoneSettingsInput>({
    twilio_phone_number: "",
    twilio_account_sid: "",
    twilio_auth_token: "",
    alert_phone_number: "",
    alert_email: "",
    company_name: "",
    ai_agent_name: "Jordan",
    greeting_message: "",
    phone_agent_enabled: false,
    sms_alerts_enabled: true,
    connection_method: "new_number",
    original_business_number: "",
    setup_completed: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        twilio_phone_number: settings.twilio_phone_number || "",
        twilio_account_sid: settings.twilio_account_sid || "",
        twilio_auth_token: settings.twilio_auth_token || "",
        alert_phone_number: settings.alert_phone_number || "",
        alert_email: settings.alert_email || "",
        company_name: settings.company_name || "",
        ai_agent_name: settings.ai_agent_name || "Jordan",
        greeting_message: settings.greeting_message || "",
        phone_agent_enabled: settings.phone_agent_enabled || false,
        sms_alerts_enabled: settings.sms_alerts_enabled !== false,
        connection_method: settings.connection_method || "new_number",
        original_business_number: settings.original_business_number || "",
        setup_completed: settings.setup_completed || false,
      });
    }
  }, [settings]);

  const handleWizardComplete = async (data: {
    connectionMethod: ConnectionMethod;
    originalBusinessNumber?: string;
    twilioPhoneNumber?: string;
  }) => {
    await saveSettings({
      ...formData,
      connection_method: data.connectionMethod,
      original_business_number: data.originalBusinessNumber || null,
      twilio_phone_number: data.twilioPhoneNumber || null,
      setup_completed: true,
    });
    setShowWizard(false);
  };

  // Show wizard if setup not completed
  if (showWizard || !formData.setup_completed) {
    return (
      <PhoneSetupWizard
        onComplete={handleWizardComplete}
        onCancel={() => {
          if (formData.setup_completed) {
            setShowWizard(false);
          }
        }}
        assignedPlatformNumber={formData.twilio_phone_number || "+1 (555) 123-4567"}
      />
    );
  }

  // Full settings UI - see complete component for details
  return (
    <div className="space-y-6">
      {/* Connection Method Card */}
      {/* Phone Agent Settings Card */}
      {/* Twilio Configuration Card */}
      {/* Alert Settings Card */}
      {/* AI Greeting Customization Card */}
    </div>
  );
}
```

---

### Hook: `usePhoneSettings.ts`

**Purpose**: React Query hook for managing phone settings CRUD operations.

**File**: `src/hooks/usePhoneSettings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ConnectionMethod = "new_number" | "port_number" | "forward_calls";

export interface PhoneSettings {
  id: string;
  organization_id: string;
  twilio_phone_number: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  alert_phone_number: string;
  alert_email: string | null;
  company_name: string;
  ai_agent_name: string;
  greeting_message: string | null;
  phone_agent_enabled: boolean;
  sms_alerts_enabled: boolean;
  connection_method: ConnectionMethod | null;
  original_business_number: string | null;
  setup_completed: boolean;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhoneSettingsInput {
  twilio_phone_number?: string | null;
  twilio_account_sid?: string | null;
  twilio_auth_token?: string | null;
  alert_phone_number: string;
  alert_email?: string | null;
  company_name?: string;
  ai_agent_name?: string;
  greeting_message?: string | null;
  phone_agent_enabled?: boolean;
  sms_alerts_enabled?: boolean;
  connection_method?: ConnectionMethod;
  original_business_number?: string | null;
  setup_completed?: boolean;
}

export function usePhoneSettings(organizationId: string | null) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["phone-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from("organization_phone_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) throw error;
      return data as PhoneSettings | null;
    },
    enabled: !!organizationId,
  });

  const createSettings = useMutation({
    mutationFn: async (input: PhoneSettingsInput) => {
      if (!organizationId) throw new Error("No organization ID");
      
      const { data, error } = await supabase
        .from("organization_phone_settings")
        .insert({
          organization_id: organizationId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-settings", organizationId] });
      toast.success("Phone settings created");
    },
    onError: (error) => {
      console.error("Error creating phone settings:", error);
      toast.error("Failed to create phone settings");
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (input: Partial<PhoneSettingsInput>) => {
      if (!organizationId) throw new Error("No organization ID");
      
      const { data, error } = await supabase
        .from("organization_phone_settings")
        .update(input)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phone-settings", organizationId] });
      toast.success("Phone settings updated");
    },
    onError: (error) => {
      console.error("Error updating phone settings:", error);
      toast.error("Failed to update phone settings");
    },
  });

  const saveSettings = async (input: PhoneSettingsInput) => {
    if (settings) {
      return updateSettings.mutateAsync(input);
    } else {
      return createSettings.mutateAsync(input);
    }
  };

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    isSaving: createSettings.isPending || updateSettings.isPending,
  };
}
```

---

## Connecting Existing Phone Numbers

### Option 1: Call Forwarding (Recommended for Quick Setup)

1. **Keep your existing number** with your current carrier
2. **Set up call forwarding** to your assigned platform number
3. **How it works**: Customer calls your business number → Carrier forwards to AI → AI answers

**Carrier-Specific Instructions:**

| Carrier | Forward All Calls | Forward When Busy |
|---------|-------------------|-------------------|
| AT&T | `*21*[number]#` | `*67*[number]#` |
| Verizon | `*72[number]` | `*71[number]` |
| T-Mobile | `**21*[number]#` | `**67*[number]#` |
| Most VoIP | Settings → Call Forwarding |

### Option 2: Number Porting (Full Transfer)

1. **Submit port request** through the setup wizard
2. **Keep service active** with current carrier during transfer
3. **Wait 1-3 business days** for completion
4. **Number moves to Twilio** - full AI control

### Forwarding Detection

The system automatically detects forwarded calls using Twilio headers:
- `ForwardedFrom` - Standard forwarding header
- `SipHeader_Diversion` - SIP diversion header
- `SipHeader_X-Forwarded-For` - Custom forwarding header

---

## Twilio Setup

### 1. Configure Webhook URLs

In your Twilio Console, set the following webhook for your phone number:

**Voice Configuration:**
- **A Call Comes In**: `https://[your-project-id].supabase.co/functions/v1/receive-phone-call`
- **HTTP Method**: `POST`

### 2. Phone Number Settings

Ensure your Twilio number has:
- Voice enabled ✅
- SMS enabled ✅
- Region appropriate for your customers

---

## Testing & Verification

### Test Call Flow

1. Call the configured Twilio number
2. Listen for AI greeting with company name
3. Speak a test phrase (e.g., "I need a quote for a fleet of 10 trucks")
4. Verify SMS alert is received (if hot lead)
5. Check MightyChat inbox for conversation

### Verify Database Records

```sql
-- Check recent phone calls
SELECT * FROM phone_calls ORDER BY created_at DESC LIMIT 5;

-- Check forwarding detection
SELECT caller_phone, forwarded_from, forwarding_detected 
FROM phone_calls 
WHERE forwarding_detected = true;

-- Check organization settings
SELECT organization_id, company_name, connection_method, setup_completed
FROM organization_phone_settings;
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No greeting plays | Webhook not configured | Verify Twilio webhook URL |
| Wrong company name | Org lookup failed | Check `twilio_phone_number` in settings |
| SMS not sent | Twilio creds missing | Verify env secrets or org settings |
| Forwarding not detected | Carrier doesn't send headers | Use porting instead |
| AI classification fails | LOVABLE_API_KEY missing | Add secret in Supabase |

### Debug Logs

Check edge function logs:
```bash
# Via Supabase Dashboard or CLI
supabase functions logs receive-phone-call
supabase functions logs process-phone-speech
supabase functions logs send-phone-alert
```

---

## Summary of Changes

### Edge Functions Modified/Created

| Function | Status | Changes |
|----------|--------|---------|
| `receive-phone-call` | **Modified** | Added forwarding detection (`ForwardedFrom`, `SipHeader_Diversion`), stores `forwarded_from` and `forwarding_detected` in phone_calls |
| `process-phone-speech` | **Existing** | No changes required |
| `send-phone-alert` | **Existing** | No changes required |

### Database Tables Modified

| Table | Changes |
|-------|---------|
| `organization_phone_settings` | Added: `connection_method`, `original_business_number`, `setup_completed`, `setup_completed_at` |
| `phone_calls` | Added: `forwarded_from`, `original_called_number`, `forwarding_detected`; Added index on `forwarded_from` |

### Frontend Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| `PhoneSetupWizard` | `src/components/settings/PhoneSetupWizard.tsx` | Guided setup for new/forward/port |
| `PhoneAgentSettings` | `src/components/settings/PhoneAgentSettings.tsx` | Main settings panel |
| `usePhoneSettings` | `src/hooks/usePhoneSettings.ts` | React Query hook for CRUD |
| `PhoneSettings` | `src/pages/settings/PhoneSettings.tsx` | Page wrapper |
