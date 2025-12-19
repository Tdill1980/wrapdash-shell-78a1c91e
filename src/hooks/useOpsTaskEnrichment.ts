import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EnrichedOpsTask {
  id: string;
  action_type: string;
  action_payload: Record<string, unknown> | null;
  priority: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string | null;
  // Enriched fields
  channel: 'instagram' | 'email' | 'unknown';
  recipient_inbox: string | null;
  customer_name: string;
  customer_handle: string;
  original_message: string;
  file_urls: string[];
  conversation_id: string | null;
}

export function useOpsTaskEnrichment() {
  const [tasks, setTasks] = useState<EnrichedOpsTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    
    // Get unresolved ai_actions
    const { data: actions, error } = await supabase
      .from('ai_actions')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    if (error || !actions) {
      setLoading(false);
      return;
    }

    // Extract conversation IDs for batch lookup
    const conversationIds = actions
      .map(a => (a.action_payload as Record<string, unknown>)?.conversation_id as string)
      .filter(Boolean);

    // Fetch conversations with contacts
    let conversationsMap: Record<string, { channel: string; recipient_inbox: string | null; contact_name: string; contact_email: string }> = {};
    
    if (conversationIds.length > 0) {
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          channel,
          recipient_inbox,
          contacts!conversations_contact_id_fkey (
            name,
            email
          )
        `)
        .in('id', conversationIds);

      if (conversations) {
        conversations.forEach((conv: unknown) => {
          const c = conv as { 
            id: string; 
            channel: string; 
            recipient_inbox: string | null; 
            contacts: { name: string; email: string } | null 
          };
          conversationsMap[c.id] = {
            channel: c.channel,
            recipient_inbox: c.recipient_inbox,
            contact_name: c.contacts?.name || 'Unknown',
            contact_email: c.contacts?.email || ''
          };
        });
      }
    }

    // Enrich each action
    const enrichedTasks: EnrichedOpsTask[] = actions.map(action => {
      const payload = action.action_payload as Record<string, unknown> || {};
      const conversationId = payload.conversation_id as string;
      const convData = conversationsMap[conversationId];
      
      // Determine channel and customer info
      let channel: 'instagram' | 'email' | 'unknown' = 'unknown';
      let customerName = (payload.customer_name as string) || 'Unknown';
      let customerHandle = '';
      
      if (convData) {
        channel = convData.channel as 'instagram' | 'email' | 'unknown';
        customerName = convData.contact_name || customerName;
        customerHandle = channel === 'instagram' 
          ? `@${convData.contact_name}` 
          : convData.contact_email;
      } else if (payload.source === 'instagram') {
        channel = 'instagram';
        customerName = (payload.sender_username as string) || 'Unknown';
        customerHandle = `@${payload.sender_username}`;
      }

      // Get file URLs
      const fileUrls = (payload.file_urls as string[]) || [];
      
      // Get original message
      const originalMessage = (payload.message as string) || '';

      return {
        id: action.id,
        action_type: action.action_type,
        action_payload: payload,
        priority: action.priority,
        resolved: action.resolved || false,
        resolved_at: action.resolved_at,
        resolved_by: action.resolved_by,
        created_at: action.created_at,
        channel,
        recipient_inbox: convData?.recipient_inbox || null,
        customer_name: customerName,
        customer_handle: customerHandle,
        original_message: originalMessage,
        file_urls: fileUrls,
        conversation_id: conversationId || null
      };
    });

    setTasks(enrichedTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
    
    const channel = supabase
      .channel('ops-desk-enriched')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_actions' },
        () => loadTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { tasks, loading, refresh: loadTasks };
}
