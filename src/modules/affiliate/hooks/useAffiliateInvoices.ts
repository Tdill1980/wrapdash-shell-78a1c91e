import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AffiliateInvoice {
  id: string;
  founder_id: string;
  invoice_number: string;
  invoice_date: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  commission_ids: string[];
  pdf_url?: string;
  sent_at?: string;
  sent_to_email?: string;
  status: string;
  notes?: string;
  created_at: string;
  affiliate_founders?: {
    full_name: string;
    email: string;
    affiliate_code: string;
  };
}

export const useAffiliateInvoices = () => {
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['affiliate-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_payout_invoices')
        .select(`
          *,
          affiliate_founders (
            full_name,
            email,
            affiliate_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AffiliateInvoice[];
    },
  });

  const generateInvoice = useMutation({
    mutationFn: async ({
      founderId,
      commissionIds,
      periodStart,
      periodEnd,
    }: {
      founderId: string;
      commissionIds: string[];
      periodStart: string;
      periodEnd: string;
    }) => {
      const { data, error } = await lovableFunctions.functions.invoke('generate-affiliate-invoice', {
        body: { founderId, commissionIds, periodStart, periodEnd },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-invoices'] });
      toast.success('Invoice generated successfully');
    },
    onError: (error: Error) => {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await lovableFunctions.functions.invoke('send-affiliate-invoice', {
        body: { invoiceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-invoices'] });
      toast.success('Invoice sent successfully');
    },
    onError: (error: Error) => {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    },
  });

  return {
    invoices,
    isLoading,
    generateInvoice: generateInvoice.mutate,
    sendInvoice: sendInvoice.mutate,
    isGenerating: generateInvoice.isPending,
    isSending: sendInvoice.isPending,
  };
};