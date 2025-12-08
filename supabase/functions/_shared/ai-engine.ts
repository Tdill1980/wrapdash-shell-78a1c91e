// supabase/functions/_shared/ai-engine.ts
// Multi-workspace AI Engine for WrapCommandAI

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// -------------------------
// LOADERS
// -------------------------

export async function loadTradeDNA(organization_id: string) {
  const { data } = await supabase
    .from("organization_tradedna")
    .select("tradedna_profile")
    .eq("organization_id", organization_id)
    .single();

  return data?.tradedna_profile || {};
}

export async function loadChatbotScripts(organization_id: string) {
  const { data } = await supabase
    .from("chatbot_scripts")
    .select("script_json")
    .eq("organization_id", organization_id)
    .eq("is_active", true)
    .maybeSingle();

  return data?.script_json || {};
}

export async function loadMemory(organization_id: string, contact_id: string) {
  const { data } = await supabase
    .from("workspace_ai_memory")
    .select("*")
    .eq("organization_id", organization_id)
    .eq("contact_id", contact_id)
    .maybeSingle();

  return data || {};
}

// -------------------------
// INTENT CLASSIFIER
// -------------------------

export async function classifyIntent(message: string, tradeDNA: any) {
  const systemPrompt = `
You are WrapCommandAI's Intent Classifier.
Classify user messages into one of: quote, design, support, general.

Also extract any data mentioned:
- vehicle: {year, make, model}
- wrapType: color_change, printed, commercial, ppf, chrome
- budget: price range mentioned
- orderNumber: if they reference an order

Return ONLY valid JSON:
{"type":"quote","confidence":0.93,"extractedData":{}}
  `;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Intent classification failed:", res.status);
      return { type: "general", confidence: 0.5, extractedData: {} };
    }

    const out = await res.json();
    const content = out.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON, handling potential markdown code blocks
    let jsonStr = content;
    if (content.includes("```")) {
      jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Intent classification error:", error);
    return { type: "general", confidence: 0.5, extractedData: {} };
  }
}

// -------------------------
// AI REPLY GENERATOR
// -------------------------

const channelTone: Record<string, string> = {
  instagram: "Fast, short, casual. Use emojis sparingly.",
  website: "Friendly, clear, helpful. Professional but approachable.",
  mightychat: "Professional yet warm. Concise responses.",
  sms: "Very short and direct. No fluff.",
  email: "Professional, complete sentences. Warm closing."
};

export async function generateAIReply({
  message,
  tradeDNA,
  scripts,
  intent,
  memory,
  channel,
}: {
  message: string;
  tradeDNA: any;
  scripts: any;
  intent: any;
  memory: any;
  channel: string;
}) {
  const tone = channelTone[channel] || channelTone.website;

  const systemPrompt = `
You are the AI Chat Agent for this workspace. Your personality and tone must match this brand voice:

BRAND VOICE (TradeDNA):
${JSON.stringify(tradeDNA, null, 2)}

CHATBOT SCRIPTS (use these phrases when appropriate):
${JSON.stringify(scripts, null, 2)}

CONVERSATION MEMORY (what we know about this customer):
${JSON.stringify(memory, null, 2)}

CHANNEL TONE: ${tone}

DETECTED INTENT: ${intent.type} (confidence: ${intent.confidence})

RULES:
1. Reply in 1-2 sentences maximum
2. Ask only ONE question at a time
3. Stay exactly in the TradeDNA brand voice
4. NEVER mention TradeDNA, AI, scripts, or that you're a bot
5. If quote intent: collect vehicle info (year/make/model), wrap type, then photos
6. If design intent: ask about wrap style preferences or request photos
7. If support intent: ask for order number
8. Be helpful, friendly, and move toward completing the customer's goal
9. If memory shows partial quote data, continue from where we left off
  `;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) {
      console.error("AI reply generation failed:", res.status);
      return "Thanks for reaching out! How can I help you today?";
    }

    const out = await res.json();
    return out.choices?.[0]?.message?.content || "Got it! How can I help?";
  } catch (error) {
    console.error("AI reply error:", error);
    return "Thanks for your message! Let me help you out.";
  }
}

// -------------------------
// MEMORY UPSERT
// -------------------------

export async function saveMemory({
  organization_id,
  contact_id,
  intent,
  extractedData,
}: {
  organization_id: string;
  contact_id: string;
  intent: any;
  extractedData: any;
}) {
  try {
    const { error } = await supabase
      .from("workspace_ai_memory")
      .upsert({
        organization_id,
        contact_id,
        last_intent: intent.type,
        last_vehicle: extractedData?.vehicle || null,
        last_wrap_type: extractedData?.wrapType || null,
        last_budget: extractedData?.budget || null,
        ai_state: extractedData || {},
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,contact_id'
      });

    if (error) {
      console.error("Memory save error:", error);
    }
  } catch (error) {
    console.error("Memory upsert failed:", error);
  }
}

// -------------------------
// SMART CONTINUATION LOGIC
// -------------------------

export function applySmartContinuation(intent: any, memory: any): any {
  // If user was in quote mode and new message doesn't clearly change intent,
  // continue the quote flow
  if (memory?.last_intent === "quote" && intent.type === "general" && intent.confidence < 0.8) {
    return { ...intent, type: "quote", continued: true };
  }
  
  // If memory has partial vehicle data and user is providing more info
  if (memory?.last_vehicle && intent.type === "general") {
    return { ...intent, type: "quote", continued: true };
  }

  return intent;
}

// -------------------------
// ORCHESTRATOR INSIGHTS GENERATOR
// -------------------------

export async function generateOrchestratorInsights(organization_id: string) {
  try {
    // Get recent leads (last 48 hours)
    const { data: leads } = await supabase
      .from("contacts")
      .select("id, name, email, created_at, priority")
      .eq("organization_id", organization_id)
      .gte("created_at", new Date(Date.now() - 48 * 3600 * 1000).toISOString())
      .limit(20);

    // Get pending quotes
    const { data: quotes } = await supabase
      .from("quotes")
      .select("id, customer_name, total_price, status, created_at")
      .eq("organization_id", organization_id)
      .in("status", ["draft", "pending"])
      .limit(20);

    // Get open conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, subject, priority, last_message_at")
      .eq("organization_id", organization_id)
      .eq("status", "open")
      .limit(20);

    const context = { leads, quotes, conversations };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an AI assistant for a wrap shop operations manager. 
Analyze the provided data and generate 3-5 actionable recommendations.
Each recommendation should be specific, actionable, and prioritized.
Format as a JSON array of objects: [{"text": "recommendation", "priority": "high|medium|low", "type": "follow_up|quote|lead|design"}]`
          },
          { role: "user", content: JSON.stringify(context) },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Insights generation failed:", res.status);
      return [];
    }

    const out = await res.json();
    const content = out.choices?.[0]?.message?.content || "[]";
    
    let jsonStr = content;
    if (content.includes("```")) {
      jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const insights = JSON.parse(jsonStr);

    // Save insights to database
    for (const insight of insights) {
      await supabase.from("orchestrator_insights").insert({
        organization_id,
        insight_type: insight.type || "ai_recommendation",
        insight_text: insight.text,
        priority: insight.priority || "normal",
        context,
      });
    }

    return insights;
  } catch (error) {
    console.error("Insights generation error:", error);
    return [];
  }
}
