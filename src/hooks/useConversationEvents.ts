import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConversationEvent {
  id: string;
  conversation_id: string;
  event_type: string;
  subtype: string | null;
  actor: string;
  payload: {
    email_sent_to?: string[];
    email_sent_at?: string;
    email_subject?: string;
    email_body?: string;
    message_excerpt?: string;
    customer_email?: string;
    customer_name?: string;
    order_number?: string;
    priority?: string;
    file_url?: string;
    filename?: string;
    file_type?: string;
    quote_id?: string;
    quote_number?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
  created_at: string;
}

export function useConversationEvents(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation-events', conversationId],
    queryFn: async (): Promise<ConversationEvent[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('conversation_events')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ConversationEvent[];
    },
    enabled: !!conversationId,
  });
}

// Get escalation stats for a single conversation
export function useConversationEscalationSummary(conversationId: string | null) {
  const { data: events } = useConversationEvents(conversationId);

  const escalations = events?.filter(e => e.event_type === 'escalation_sent') || [];
  const emailsSent = events?.filter(e => e.event_type === 'email_sent') || [];
  const assetsUploaded = events?.filter(e => e.event_type === 'asset_uploaded') || [];
  const quotesAttached = events?.filter(e => e.event_type === 'quote_attached') || [];

  return {
    escalations,
    emailsSent,
    assetsUploaded,
    quotesAttached,
    hasEscalations: escalations.length > 0,
    hasEmailsSent: emailsSent.length > 0,
  };
}

// Global escalation stats across all conversations
export function useEscalationStats() {
  return useQuery({
    queryKey: ['escalation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_events')
        .select('event_type, subtype, created_at')
        .eq('event_type', 'escalation_sent');

      if (error) throw error;

      const events = data || [];
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const todayEvents = events.filter(e => new Date(e.created_at) >= today);

      // Count by subtype
      const byType: Record<string, number> = {};
      events.forEach(e => {
        const type = e.subtype || 'other';
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        total: events.length,
        today: todayEvents.length,
        byType,
      };
    },
    refetchInterval: 60000,
  });
}
