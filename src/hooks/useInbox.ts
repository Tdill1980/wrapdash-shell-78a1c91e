import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Contact {
  id: string;
  organization_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  tags: string[];
  priority: string;
  last_contacted_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  organization_id: string | null;
  channel: string;
  subject: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  last_message_at: string | null;
  unread_count: number;
  metadata: Record<string, any>;
  created_at: string;
  contact?: Contact;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: string;
  channel: string;
  content: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  metadata: Record<string, any>;
  status: string;
  created_at: string;
}

export const useInbox = (selectedConversationId?: string) => {
  const queryClient = useQueryClient();

  // Fetch all conversations with contact info
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(*)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as (Conversation & { contact: Contact })[];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['inbox-messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversationId,
  });

  // Fetch all contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['inbox-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
  });

  // Send a new message
  const sendMessage = useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      channel 
    }: { 
      conversationId: string; 
      content: string; 
      channel: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          channel,
          direction: 'outbound',
          status: 'sent',
          sender_name: 'You',
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
    },
  });

  // Create a new contact
  const createContact = useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          name: contact.name!,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          source: contact.source || 'manual',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-contacts'] });
    },
  });

  // Create a new conversation
  const createConversation = useMutation({
    mutationFn: async ({ 
      contactId, 
      channel, 
      subject 
    }: { 
      contactId: string; 
      channel: string; 
      subject?: string;
    }) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          contact_id: contactId,
          channel,
          subject,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
    },
  });

  // Update conversation status
  const updateConversationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
    },
  });

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inbox-messages'] });
          queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    conversations,
    messages,
    contacts,
    conversationsLoading,
    messagesLoading,
    contactsLoading,
    sendMessage: sendMessage.mutate,
    createContact: createContact.mutate,
    createConversation: createConversation.mutate,
    updateConversationStatus: updateConversationStatus.mutate,
    isSending: sendMessage.isPending,
  };
};
