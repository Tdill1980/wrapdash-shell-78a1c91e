import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ChatConversation {
  id: string;
  contact_id: string | null;
  channel: string;
  status: string | null;
  priority: string | null;
  subject: string | null;
  last_message_at: string | null;
  created_at: string | null;
  unread_count: number | null;
  chat_state: {
    stage?: string;
    customer_email?: string;
    vehicle?: { year?: string; make?: string; model?: string };
    escalations_sent?: string[];
  } | null;
  metadata: {
    session_id?: string;
    page_url?: string;
    org?: string;
    mode?: string;
    geo?: {
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
      country_name?: string;
      timezone?: string;
      latitude?: number;
      longitude?: number;
    };
  } | null;
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    tags: string[] | null;
  } | null;
  messages?: {
    id: string;
    content: string;
    direction: string;
    sender_name: string | null;
    created_at: string | null;
    metadata: unknown;
  }[];
}

// Helper type for message metadata
interface MessageMetadata {
  status?: 'pending_approval' | 'sent' | 'approved';
  instagram_sent?: boolean;
  ai_mode?: string;
}

export function useWebsiteChats() {
  const query = useQuery({
    queryKey: ['website-chats'],
    queryFn: async (): Promise<ChatConversation[]> => {
      // Fetch conversations with website channel
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_id,
          channel,
          status,
          priority,
          subject,
          last_message_at,
          created_at,
          unread_count,
          chat_state,
          metadata
        `)
        .eq('channel', 'website')
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch contacts and messages for each conversation
      const enrichedConversations = await Promise.all(
        (conversations || []).map(async (convo) => {
          // Get contact
          let contact = null;
          if (convo.contact_id) {
            const { data: contactData } = await supabase
              .from('contacts')
              .select('id, name, email, phone, tags')
              .eq('id', convo.contact_id)
              .single();
            contact = contactData;
          }

          // Get messages
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, direction, sender_name, created_at, metadata')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: true });

          return {
            ...convo,
            chat_state: convo.chat_state as ChatConversation['chat_state'],
            metadata: convo.metadata as ChatConversation['metadata'],
            contact,
            messages: messages || []
          };
        })
      );

      return enrichedConversations;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('website-chats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: 'channel=eq.website'
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return {
    conversations: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch
  };
}

// Stats hook
export function useWebsiteChatStats() {
  return useQuery({
    queryKey: ['website-chat-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total chats today
      const { count: totalToday } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('channel', 'website')
        .gte('created_at', today.toISOString());

      // Emails captured today
      const { count: emailsCaptured } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'website_chat')
        .not('email', 'is', null)
        .not('email', 'ilike', '%@capture.local%')
        .gte('created_at', today.toISOString());

      // Active conversations
      const { count: activeConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('channel', 'website')
        .eq('status', 'open');

      return {
        totalToday: totalToday || 0,
        emailsCaptured: emailsCaptured || 0,
        activeConversations: activeConversations || 0
      };
    },
    refetchInterval: 60000
  });
}
