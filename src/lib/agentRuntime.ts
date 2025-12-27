/**
 * Agent Runtime
 * Orchestrates agent turns with memory and protocol
 */

import { parseAgentResponse, detectResponseMode, AgentResponse } from "@/lib/agentProtocol";
import { loadConversationMemory, appendConversationMemory, MemoryMessage } from "@/lib/agentMemory";
import { supabase } from "@/integrations/supabase/client";

// Feature flags - flip these to disable features without code changes
export const AGENT_CONFIG = {
  ENABLE_MEMORY: true,
  ENABLE_PROTOCOL: true,
  MEMORY_LIMIT: 10,
  DEBUG: false,
};

/**
 * Role contracts for each agent
 */
export const AGENT_ROLES = {
  noah_bennett: {
    name: "Noah Bennett",
    role: "Senior Content Producer",
    responsibilities: [
      "Ask clarifying questions before executing if requirements are unclear",
      "Translate strategy into executable content using canonical CREATE_CONTENT schema",
      "Use Saved Views, Caption Library, and MightyEdit for content creation",
      "Validate inputs against content contracts before generating",
    ],
    mayDecide: [
      "Which caption variant to use from the library",
      "Which Saved View to rotate between",
      "Overlay timing within ±2 seconds tolerance",
    ],
    mustAsk: [
      "If content_type is unclear (reel vs story vs ad)",
      "If platform is not specified",
      "If commercial_business vs restyle_personal is ambiguous",
    ],
    mustEscalate: [
      "Schema mismatch or validation errors",
      "Missing legal attribution for UGC",
      "Payment or credit processing issues",
    ],
  },
  emily_carter: {
    name: "Emily Carter",
    role: "Email & Lifecycle Manager",
    responsibilities: [
      "Create email campaigns using Saved Views for hero assets",
      "Use Caption Library for subject lines and preheaders",
      "Never invent offers, pricing, or guarantees",
    ],
    mayDecide: [
      "Email layout and structure",
      "Which saved view to feature",
    ],
    mustAsk: [
      "If offer details are missing",
      "If target segment is unclear",
    ],
    mustEscalate: [
      "Pricing claims without source",
      "Legal/compliance concerns",
    ],
  },
  ryan_mitchell: {
    name: "Ryan Mitchell",
    role: "Editorial Producer",
    responsibilities: [
      "Create editorial content using content_tags for context",
      "Recommend visuals via Saved Views",
      "No claims without source",
    ],
    mayDecide: [
      "Article structure and outline",
      "Featured imagery selection",
    ],
    mustAsk: [
      "If topic or angle is unclear",
      "If source material is needed",
    ],
    mustEscalate: [
      "Factual claims requiring verification",
      "Brand reputation concerns",
    ],
  },
  taylor_brooks: {
    name: "Taylor Brooks",
    role: "Sales Strategy Lead",
    responsibilities: [
      "Align messaging with wrap_type_category",
      "Use pain_signals for positioning",
      "Never accuse materials or competitors",
    ],
    mayDecide: [
      "CTA wording within brand voice",
      "Urgency level of messaging",
    ],
    mustAsk: [
      "If offer or CTA is unclear",
      "If target audience is ambiguous",
    ],
    mustEscalate: [
      "Pricing decisions",
      "Competitor comparisons",
    ],
  },
} as const;

export type AgentName = keyof typeof AGENT_ROLES;

/**
 * Build the response protocol instructions for an agent
 */
export function buildProtocolInstructions(): string {
  return `
=== RESPONSE PROTOCOL ===

You MUST respond in one of three modes:

1. QUESTION MODE (when clarification needed):
   Ask what you need to know. Be specific.
   Example: "Before I create this reel, I need to confirm: Is this for a commercial/business client or a restyle/personal project?"

2. PLAN MODE (when you have enough info but want confirmation):
   Outline what you will do, then ask for approval.
   Example: "I will create an Instagram reel using the attached video with a 'holiday sale' hook. Ready when you say go."

3. EXECUTE MODE (only when ready and confirmed):
   Output the CREATE_CONTENT block and execute.
   Only use this after user confirms your plan OR if all required info is clearly provided.

NEVER jump straight to EXECUTE if any required parameter is unclear.
When in doubt, use QUESTION mode.
`.trim();
}

/**
 * Build role-specific system prompt additions
 */
export function buildRolePrompt(agentName: AgentName): string {
  const role = AGENT_ROLES[agentName];
  if (!role) return "";

  return `
=== YOUR ROLE CONTRACT ===

RESPONSIBILITIES:
${role.responsibilities.map(r => `- ${r}`).join('\n')}

MAY DECIDE (within your authority):
${role.mayDecide.map(r => `- ${r}`).join('\n')}

MUST ASK (clarification required):
${role.mustAsk.map(r => `- ${r}`).join('\n')}

MUST ESCALATE (do not attempt):
${role.mustEscalate.map(r => `- ${r}`).join('\n')}

${buildProtocolInstructions()}
`.trim();
}

/**
 * Process agent response and determine mode
 */
export function processAgentResponse(rawMessage: string): {
  response: AgentResponse;
  mode: "question" | "plan" | "execute";
  hasCreateContent: boolean;
} {
  const hasCreateContent = rawMessage.includes("===CREATE_CONTENT===");
  
  let response: AgentResponse;
  
  if (AGENT_CONFIG.ENABLE_PROTOCOL) {
    response = parseAgentResponse(rawMessage);
  } else {
    // Fallback: detect mode from content
    response = detectResponseMode(rawMessage);
  }

  return {
    response,
    mode: response.type,
    hasCreateContent,
  };
}

/**
 * Run an agent turn with memory support
 * This is a helper that wraps the edge function call
 */
export async function runAgentTurn(params: {
  agentName: AgentName;
  conversationId: string;
  chatId: string;
  userMessage: string;
}): Promise<{
  response: AgentResponse;
  rawMessage: string;
}> {
  const { agentName, conversationId, chatId, userMessage } = params;

  // Load memory if enabled
  let memory: MemoryMessage[] = [];
  if (AGENT_CONFIG.ENABLE_MEMORY) {
    memory = await loadConversationMemory({
      agentName,
      conversationId,
      limit: AGENT_CONFIG.MEMORY_LIMIT,
    });
  }

  if (AGENT_CONFIG.DEBUG) {
    console.log("[AgentRuntime] Memory loaded:", memory.length, "messages");
  }

  // Call the agent-chat edge function
  const { data, error } = await supabase.functions.invoke("agent-chat", {
    body: {
      chat_id: chatId,
      message: userMessage,
      memory_context: memory.length > 0 ? memory : undefined,
    },
  });

  if (error) {
    console.error("[AgentRuntime] Edge function error:", error);
    return {
      response: { type: "question", message: "I encountered an issue. Could you try again?" },
      rawMessage: "",
    };
  }

  const rawMessage = data?.message || "";
  const { response } = processAgentResponse(rawMessage);

  // Save to memory if enabled
  if (AGENT_CONFIG.ENABLE_MEMORY) {
    await appendConversationMemory({
      agentName,
      conversationId,
      messagesToAppend: [
        { role: "user", content: userMessage },
        { role: "assistant", content: rawMessage },
      ],
    });
  }

  return { response, rawMessage };
}
