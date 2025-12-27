/**
 * Agent Conversation Memory
 * Stores and retrieves conversation history for agents
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type MemoryMessage = {
  role: "user" | "assistant";
  content: string;
  ts?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

const DEFAULT_LIMIT = 10;
const MAX_MEMORY_SIZE = 50;

/**
 * Load conversation memory for an agent
 */
export async function loadConversationMemory(params: {
  agentName: string;
  conversationId: string;
  limit?: number;
}): Promise<MemoryMessage[]> {
  const { agentName, conversationId, limit = DEFAULT_LIMIT } = params;

  try {
    const { data, error } = await supabase
      .from("agent_conversations")
      .select("messages")
      .eq("agent_name", agentName)
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error) {
      console.error("[AgentMemory] Load error:", error);
      return [];
    }

    const messages = (data?.messages ?? []) as MemoryMessage[];
    return messages.slice(-limit);
  } catch (err) {
    console.error("[AgentMemory] Unexpected error:", err);
    return [];
  }
}

/**
 * Append messages to conversation memory
 */
export async function appendConversationMemory(params: {
  agentName: string;
  conversationId: string;
  messagesToAppend: MemoryMessage[];
}): Promise<void> {
  const { agentName, conversationId, messagesToAppend } = params;

  try {
    // Fetch existing messages
    const { data, error } = await supabase
      .from("agent_conversations")
      .select("messages")
      .eq("agent_name", agentName)
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[AgentMemory] Fetch error:", error);
      return;
    }

    const existing = (data?.messages ?? []) as MemoryMessage[];
    
    // Append new messages with timestamps
    const merged = [
      ...existing,
      ...messagesToAppend.map(m => ({ 
        role: m.role,
        content: m.content,
        ts: m.ts ?? new Date().toISOString() 
      }))
    ].slice(-MAX_MEMORY_SIZE);

    // Convert to Json type
    const messagesJson = merged as unknown as Json;

    // Check if record exists
    if (data) {
      // Update existing
      const { error: updateError } = await supabase
        .from("agent_conversations")
        .update({
          messages: messagesJson,
          updated_at: new Date().toISOString(),
        })
        .eq("agent_name", agentName)
        .eq("conversation_id", conversationId);

      if (updateError) {
        console.error("[AgentMemory] Update error:", updateError);
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from("agent_conversations")
        .insert({
          agent_name: agentName,
          conversation_id: conversationId,
          messages: messagesJson,
        });

      if (insertError) {
        console.error("[AgentMemory] Insert error:", insertError);
      }
    }
  } catch (err) {
    console.error("[AgentMemory] Unexpected error:", err);
  }
}

/**
 * Clear conversation memory for an agent
 */
export async function clearConversationMemory(params: {
  agentName: string;
  conversationId: string;
}): Promise<void> {
  const { agentName, conversationId } = params;

  try {
    const { error } = await supabase
      .from("agent_conversations")
      .delete()
      .eq("agent_name", agentName)
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("[AgentMemory] Clear error:", error);
    }
  } catch (err) {
    console.error("[AgentMemory] Unexpected error:", err);
  }
}

/**
 * Get memory summary for debugging
 */
export async function getMemorySummary(params: {
  agentName: string;
  conversationId: string;
}): Promise<{ messageCount: number; lastUpdated: string | null }> {
  const { agentName, conversationId } = params;

  try {
    const { data, error } = await supabase
      .from("agent_conversations")
      .select("messages, updated_at")
      .eq("agent_name", agentName)
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error || !data) {
      return { messageCount: 0, lastUpdated: null };
    }

    const messages = (data.messages ?? []) as MemoryMessage[];
    return { 
      messageCount: messages.length, 
      lastUpdated: data.updated_at 
    };
  } catch {
    return { messageCount: 0, lastUpdated: null };
  }
}
