import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface FollowUpRequest {
  organization_id: string;
  trigger_type: "quote_created" | "design_generated" | "order_shipped" | "customer_silent" | "manual";
  context: {
    contact_id?: string;
    quote_id?: string;
    approveflow_id?: string;
    order_id?: string;
    customer_name?: string;
    customer_email?: string;
    vehicle?: string;
    last_activity?: string;
  };
}

// Load TradeDNA brand voice
async function loadBrandVoice(supabase: any, organizationId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("organization_tradedna")
      .select("tradedna_profile")
      .eq("organization_id", organizationId)
      .single();
    
    if (data?.tradedna_profile?.brand_voice?.tone) {
      return data.tradedna_profile.brand_voice.tone.join(", ");
    }
  } catch (e) {
    console.log("No TradeDNA found");
  }
  return "friendly, professional, helpful";
}

// Generate follow-up message using AI
async function generateFollowUpMessage(
  triggerType: string,
  context: any,
  brandVoice: string
): Promise<{ subject: string; message: string }> {
  const defaultMessages: Record<string, { subject: string; message: string }> = {
    quote_created: {
      subject: "Still considering your wrap?",
      message: `Hey${context.customer_name ? ` ${context.customer_name}` : ""}! Still thinking about wrapping your ${context.vehicle || "vehicle"}? I'd love to help finalize your design or walk you through options. Let me know if you have any questions!`
    },
    design_generated: {
      subject: "Your wrap concept is ready!",
      message: `Your custom wrap design is ready to view! Take a look and let me know your thoughts. Want any changes or ready to move forward?`
    },
    order_shipped: {
      subject: "Your wrap is on the way!",
      message: `Great news - your wrap kit has shipped! Need installation tips or have any questions? We're here to help make your install smooth.`
    },
    customer_silent: {
      subject: "Picking up where we left off",
      message: `Hey${context.customer_name ? ` ${context.customer_name}` : ""}! I noticed we haven't connected in a bit. Want me to pick up where we left off on your wrap project?`
    },
    manual: {
      subject: "Quick follow-up",
      message: `Just checking in to see if there's anything I can help with on your wrap project!`
    }
  };

  const defaults = defaultMessages[triggerType] || defaultMessages.manual;

  if (!LOVABLE_API_KEY) {
    return defaults;
  }

  try {
    const prompt = `Generate a short, personalized follow-up message for a vehicle wrap customer.

Context:
- Trigger: ${triggerType}
- Customer: ${context.customer_name || "Unknown"}
- Vehicle: ${context.vehicle || "Not specified"}
- Last Activity: ${context.last_activity || "Unknown"}

Brand voice: ${brandVoice}

Return JSON with:
{
  "subject": "email subject line (max 60 chars)",
  "message": "friendly follow-up message (2-3 sentences max)"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful wrap shop assistant. Keep messages short and friendly." },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_followup",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string" },
                message: { type: "string" }
              },
              required: ["subject", "message"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_followup" } }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return JSON.parse(toolCall.function.arguments);
      }
    }
  } catch (error) {
    console.error("AI follow-up generation error:", error);
  }

  return defaults;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: FollowUpRequest = await req.json();
    const { organization_id, trigger_type, context } = payload;

    console.log("Follow-up request:", { organization_id, trigger_type, context });

    if (!organization_id || !trigger_type) {
      return new Response(
        JSON.stringify({ error: "organization_id and trigger_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load brand voice
    const brandVoice = await loadBrandVoice(supabase, organization_id);

    // Generate follow-up message
    const followUp = await generateFollowUpMessage(trigger_type, context, brandVoice);
    console.log("Generated follow-up:", followUp);

    // Create or find conversation for this contact
    let conversationId: string | null = null;
    
    if (context.contact_id) {
      // Check for existing conversation
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("contact_id", context.contact_id)
        .eq("organization_id", organization_id)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            organization_id,
            contact_id: context.contact_id,
            channel: "internal_chat",
            subject: followUp.subject,
            status: "open",
          })
          .select()
          .single();

        if (!convError && newConv) {
          conversationId = newConv.id;
        }
      }
    }

    // Insert follow-up message into MightyChat
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        channel: "internal_chat",
        direction: "outbound",
        content: followUp.message,
        sender_name: "AI Assistant",
        status: "pending",
      });

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          subject: followUp.subject,
        })
        .eq("id", conversationId);
    }

    // Create AI action for MCP visibility
    await supabase.from("ai_actions").insert({
      organization_id,
      action_type: "followup",
      action_payload: {
        trigger_type,
        contact_id: context.contact_id,
        customer_name: context.customer_name,
        vehicle: context.vehicle,
        subject: followUp.subject,
        message: followUp.message,
        conversation_id: conversationId,
      },
      priority: trigger_type === "customer_silent" ? "medium" : "high",
    });

    return new Response(
      JSON.stringify({
        success: true,
        followup: followUp,
        conversation_id: conversationId,
        trigger_type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to generate follow-up";
    console.error("Follow-up engine error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});