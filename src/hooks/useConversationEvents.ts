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
    resolution_notes?: string;
    // Call scheduling fields
    assigned_to?: string;
    call_reason?: string;
    alex_instruction?: string;
    scheduled_time?: string;
    call_notes?: string;
    call_outcome?: string;
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
  const callsRequested = events?.filter(e => e.event_type === 'call_requested') || [];
  const callsScheduled = events?.filter(e => e.event_type === 'call_scheduled') || [];
  const callsCompleted = events?.filter(e => e.event_type === 'call_completed') || [];

  return {
    escalations,
    emailsSent,
    assetsUploaded,
    quotesAttached,
    callsRequested,
    callsScheduled,
    callsCompleted,
    hasEscalations: escalations.length > 0,
    hasEmailsSent: emailsSent.length > 0,
    hasCallScheduled: callsScheduled.length > 0,
  };
}

// Global escalation stats across all conversations
// Counts UNIQUE conversations that were escalated, not raw event count
export function useEscalationStats() {
  return useQuery({
    queryKey: ['escalation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_events')
        .select('conversation_id, subtype, created_at')
        .eq('event_type', 'escalation_sent');

      if (error) throw error;

      const events = data || [];
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Get unique conversation IDs (total ever escalated)
      const uniqueConversations = new Set(events.map(e => e.conversation_id));
      
      // Get unique conversation IDs escalated today
      const todayEvents = events.filter(e => new Date(e.created_at) >= today);
      const uniqueConversationsToday = new Set(todayEvents.map(e => e.conversation_id));

      // Count unique conversations by subtype (use first escalation type per conversation)
      const conversationTypes: Record<string, Set<string>> = {};
      events.forEach(e => {
        const type = e.subtype || 'other';
        if (!conversationTypes[type]) {
          conversationTypes[type] = new Set();
        }
        conversationTypes[type].add(e.conversation_id);
      });

      const byType: Record<string, number> = {};
      Object.entries(conversationTypes).forEach(([type, ids]) => {
        byType[type] = ids.size;
      });

      return {
        total: uniqueConversations.size,
        today: uniqueConversationsToday.size,
        byType,
      };
    },
    refetchInterval: 60000,
  });
}
