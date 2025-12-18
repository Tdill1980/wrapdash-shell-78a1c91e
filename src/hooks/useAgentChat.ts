import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgentChatMessage {
  id: string;
  sender: "user" | "agent";
  content: string;
  created_at: string;
  metadata?: {
    confirmed?: boolean;
    image_url?: string;
    image_generated?: boolean;
    attachments?: Array<{ url: string; type?: string; name?: string }>;
  };
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
}

interface UseAgentChatReturn {
  chatId: string | null;
  agent: AgentInfo | null;
  messages: AgentChatMessage[];
  loading: boolean;
  sending: boolean;
  confirmed: boolean;
  suggestedTask: { type: string; description: string } | null;
  startChat: (agentId: string, context?: Record<string, unknown>) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  delegateTask: (description: string) => Promise<{ success: boolean; taskId?: string }>;
  closeChat: () => void;
}

export function useAgentChat(): UseAgentChatReturn {
  const [chatId, setChatId] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [suggestedTask, setSuggestedTask] = useState<{ type: string; description: string } | null>(null);

  const startChat = useCallback(async (agentId: string, context?: Record<string, unknown>) => {
    setLoading(true);
    setMessages([]);
    setConfirmed(false);
    setSuggestedTask(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        toast.error("Please sign in to use Agent Chat");
        return;
      }

      // Get organization_id
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: {
          action: "start",
          agent_id: agentId,
          organization_id: orgMember?.organization_id,
          user_id: userId,
          context,
        },
      });

      if (error) throw error;

      setChatId(data.chat_id);
      setAgent(data.agent);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Start chat error:", err);
      toast.error("Failed to start agent chat");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!chatId || !message.trim()) return;

    setSending(true);

    // Optimistically add user message
    const tempUserMsg: AgentChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: {
          action: "send",
          chat_id: chatId,
          message,
        },
      });

      if (error) throw error;

      // Add agent response
      const agentMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        content: data.message,
        created_at: new Date().toISOString(),
        metadata: { 
          confirmed: data.confirmed,
          image_url: data.image_url,
          image_generated: !!data.image_url,
        },
      };
      setMessages((prev) => [...prev, agentMsg]);

      if (data.confirmed) {
        setConfirmed(true);
        setSuggestedTask(data.suggested_task);
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }, [chatId]);

  const delegateTask = useCallback(async (description: string): Promise<{ success: boolean; taskId?: string }> => {
    if (!chatId || !confirmed) {
      toast.error("Cannot delegate: agent has not confirmed understanding");
      return { success: false };
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || null;

      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: {
          action: "delegate",
          chat_id: chatId,
          description,
          // IMPORTANT: `tasks.assigned_to` is a UUID in the database
          assigned_to: userId,
        },
      });

      if (error) throw error;

      toast.success("Task delegated successfully");
      return { success: true, taskId: data.task_id };
    } catch (err) {
      console.error("Delegate error:", err);
      toast.error("Failed to delegate task");
      return { success: false };
    }
  }, [chatId, confirmed]);

  const closeChat = useCallback(() => {
    setChatId(null);
    setAgent(null);
    setMessages([]);
    setConfirmed(false);
    setSuggestedTask(null);
  }, []);

  return {
    chatId,
    agent,
    messages,
    loading,
    sending,
    confirmed,
    suggestedTask,
    startChat,
    sendMessage,
    delegateTask,
    closeChat,
  };
}
