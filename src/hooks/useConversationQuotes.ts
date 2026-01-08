import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConversationQuote {
  id: string;
  quote_number: string;
  customer_name: string | null;
  customer_email: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  sqft: number | null;
  material_cost: number | null;
  total_price: number | null;
  status: string | null;
  email_sent: boolean | null;
  created_at: string;
}

export function useConversationQuotes(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation-quotes', conversationId],
    queryFn: async (): Promise<ConversationQuote[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          customer_name,
          customer_email,
          vehicle_year,
          vehicle_make,
          vehicle_model,
          sqft,
          material_cost,
          total_price,
          status,
          email_sent,
          created_at
        `)
        .eq('source_conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ConversationQuote[];
    },
    enabled: !!conversationId,
  });
}
