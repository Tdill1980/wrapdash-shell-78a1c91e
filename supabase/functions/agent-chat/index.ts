import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadSalesGoalContext, formatSalesContextForPrompt } from "../_shared/sales-goal-loader.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agent configurations for clarification mode
const AGENT_CONFIGS: Record<string, { name: string; role: string; systemPrompt: string }> = {
  alex_morgan: {
    name: "Alex Morgan",
    role: "Quotes & Pricing",
    systemPrompt: `You are Alex Morgan, the quoting specialist at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand what the user wants
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create tasks or quotes
- Only say you're ready when you FULLY understand

WPW PRICING:
- Avery MPI 1105: $5.27/sqft
- 3M IJ180Cv3: $6.32/sqft
- Window Perf 50/50: $5.32/sqft
- Custom Design: Starting at $750

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  grant_miller: {
    name: "Grant Miller", 
    role: "Design & Files",
    systemPrompt: `You are Grant Miller, the design specialist at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the design/file request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create projects or review files yet

FILE REQUIREMENTS:
- Formats: PDF, AI, EPS only
- Resolution: Minimum 72 DPI at full scale
- Color mode: CMYK
- Text: Convert to outlines

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  casey_ramirez: {
    name: "Casey Ramirez",
    role: "Social & DMs", 
    systemPrompt: `You are Casey Ramirez, handling social media and DMs at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the social/engagement request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT send messages or engage yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  jordan_lee: {
    name: "Jordan Lee",
    role: "Website & Sales",
    systemPrompt: `You are Jordan Lee, handling website chat and sales at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the lead/sales request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT send messages or create leads yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  taylor_brooks: {
    name: "Taylor Brooks",
    role: "Partnerships & Sales",
    systemPrompt: `You are Taylor Brooks, handling partnerships and field sales at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the partnership/sales opportunity
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT reach out or commit anything yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  evan_porter: {
    name: "Evan Porter",
    role: "Affiliates",
    systemPrompt: `You are Evan Porter, handling the affiliate program at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the affiliate-related request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT send invites or update records yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  emily_carter: {
    name: "Emily Carter",
    role: "Marketing Content",
    systemPrompt: `You are Emily Carter, handling marketing content at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the content request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create content yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  noah_bennett: {
    name: "Noah Bennett",
    role: "Social Content",
    systemPrompt: `You are Noah Bennett, handling social content at WePrintWraps.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the social content request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT create posts or reels yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
  ryan_mitchell: {
    name: "Ryan Mitchell",
    role: "Editorial (Ink & Edge)",
    systemPrompt: `You are Ryan Mitchell, editorial authority for Ink & Edge Magazine.

CRITICAL: You are in CLARIFICATION MODE.
- Ask questions to understand the editorial request
- Restate your understanding before confirming
- Do NOT execute any actions
- Do NOT write or publish content yet

When you understand the request, end with:
"I understand. I will [exact actions]. Ready when you say go."
Then set confirmed: true in your response.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, agent_id, message, chat_id, context, organization_id, user_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ACTION: start - Create new chat
    if (action === "start") {
      const { data: chat, error } = await supabase
        .from("agent_chats")
        .insert({
          organization_id,
          user_id,
          agent_id,
          status: "clarifying",
          context: context || {},
        })
        .select()
        .single();

      if (error) throw error;

      const agentConfig = AGENT_CONFIGS[agent_id] || { name: agent_id, role: "Agent" };

      return new Response(
        JSON.stringify({
          success: true,
          chat_id: chat.id,
          agent: {
            id: agent_id,
            name: agentConfig.name,
            role: agentConfig.role,
          },
          messages: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: send - Send message and get AI response
    if (action === "send") {
      if (!chat_id || !message) {
        throw new Error("Missing chat_id or message");
      }

      // Save user message
      await supabase.from("agent_chat_messages").insert({
        agent_chat_id: chat_id,
        sender: "user",
        content: message,
      });

      // Get chat history
      const { data: chatHistory } = await supabase
        .from("agent_chat_messages")
        .select("*")
        .eq("agent_chat_id", chat_id)
        .order("created_at", { ascending: true });

      // Get chat details
      const { data: chat } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      const agentConfig = AGENT_CONFIGS[chat?.agent_id] || {
        name: "Agent",
        role: "Assistant",
        systemPrompt: "You are a helpful assistant in CLARIFICATION MODE. Ask questions to understand before executing.",
      };

      // Load sales goal context to give agents revenue awareness
      let salesContext = "";
      try {
        const salesData = await loadSalesGoalContext(chat?.organization_id);
        salesContext = formatSalesContextForPrompt(salesData);
        console.log("Sales context loaded:", salesData.status, salesData.percentComplete.toFixed(1) + "%");
      } catch (e) {
        console.error("Failed to load sales context:", e);
      }

      // Build system prompt with sales context
      const enhancedSystemPrompt = `${agentConfig.systemPrompt}

${salesContext}

Use this sales context when relevant:
- If creating content/emails, consider incorporating urgency if we're behind on goals
- If quoting, prioritize closing deals that help hit targets
- Suggest proactive actions when appropriate based on goal status
`;

      // Build messages for AI
      const aiMessages = [
        { role: "system", content: enhancedSystemPrompt },
        ...(chatHistory || []).map((m: any) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content,
        })),
      ];

      // Call AI
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: aiMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      const aiData = await aiResponse.json();
      const agentMessage = aiData.choices?.[0]?.message?.content || "I'm not sure how to respond.";

      // Check if agent confirmed understanding
      const confirmed = agentMessage.toLowerCase().includes("ready when you say go") ||
                       agentMessage.toLowerCase().includes("i understand. i will");

      // Save agent response
      await supabase.from("agent_chat_messages").insert({
        agent_chat_id: chat_id,
        sender: "agent",
        content: agentMessage,
        metadata: { confirmed },
      });

      // Update chat status if confirmed
      if (confirmed && chat?.status === "clarifying") {
        await supabase
          .from("agent_chats")
          .update({ status: "confirmed", updated_at: new Date().toISOString() })
          .eq("id", chat_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: agentMessage,
          confirmed,
          suggested_task: confirmed ? extractSuggestedTask(agentMessage) : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: delegate - Create task and update status
    if (action === "delegate") {
      if (!chat_id) throw new Error("Missing chat_id");

      const { data: chat } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      if (!chat) throw new Error("Chat not found");
      if (chat.status !== "confirmed") {
        throw new Error("Cannot delegate: agent has not confirmed understanding");
      }

      const { task_type, description, assigned_to } = await req.json();

      // Create task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          organization_id: chat.organization_id,
          title: description || `Task delegated to ${AGENT_CONFIGS[chat.agent_id]?.name || chat.agent_id}`,
          description: `Delegated from agent chat. Agent: ${chat.agent_id}`,
          assigned_agent: chat.agent_id,
          status: "pending",
          priority: "normal",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create delegation log
      await supabase.from("delegation_log").insert({
        agent_chat_id: chat_id,
        task_id: task.id,
        delegated_by: assigned_to || "Unknown",
        summary: description || "Task delegated from agent chat",
      });

      // Update chat status
      await supabase
        .from("agent_chats")
        .update({ status: "delegated", updated_at: new Date().toISOString() })
        .eq("id", chat_id);

      return new Response(
        JSON.stringify({
          success: true,
          task_id: task.id,
          message: "Task delegated successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: history - Get chat history
    if (action === "history") {
      if (!chat_id) throw new Error("Missing chat_id");

      const { data: messages } = await supabase
        .from("agent_chat_messages")
        .select("*")
        .eq("agent_chat_id", chat_id)
        .order("created_at", { ascending: true });

      const { data: chat } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("id", chat_id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          chat,
          messages: messages || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Agent chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper to extract suggested task from agent message
function extractSuggestedTask(message: string): { type: string; description: string } | null {
  const match = message.match(/I will ([^.]+)\./i);
  if (match) {
    return {
      type: "general",
      description: match[1].trim(),
    };
  }
  return null;
}
