import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommissionWithFounder {
  id: string;
  founder_id: string;
  customer_email: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
  founder: {
    full_name: string;
    email: string;
    affiliate_code: string;
  };
}

export interface PaymentStats {
  totalPending: number;
  totalApproved: number;
  totalPaidThisMonth: number;
  activeAffiliates: number;
}

export const useAffiliatePayments = () => {
  const queryClient = useQueryClient();

  // Fetch all commissions with founder data
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['affiliate-commissions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          founder:affiliate_founders(full_name, email, affiliate_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommissionWithFounder[];
    },
  });

  // Calculate payment stats
  const stats: PaymentStats = {
    totalPending: commissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.commission_amount, 0),
    totalApproved: commissions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.commission_amount, 0),
    totalPaidThisMonth: commissions
      .filter((c) => {
        if (!c.paid_at) return false;
        const paidDate = new Date(c.paid_at);
        const now = new Date();
        return (
          paidDate.getMonth() === now.getMonth() &&
          paidDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, c) => sum + c.commission_amount, 0),
    activeAffiliates: new Set(
      commissions
        .filter((c) => c.status === 'pending' || c.status === 'approved')
        .map((c) => c.founder_id)
    ).size,
  };

  // Approve commissions
  const approveCommissions = useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .in('id', commissionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions-admin'] });
      toast.success('Commissions approved successfully');
    },
    onError: (error) => {
      console.error('Error approving commissions:', error);
      toast.error('Failed to approve commissions');
    },
  });

  // Mark as paid
  const markAsPaid = useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', commissionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions-admin'] });
      toast.success('Commissions marked as paid');
    },
    onError: (error) => {
      console.error('Error marking commissions as paid:', error);
      toast.error('Failed to mark commissions as paid');
    },
  });

  // Cancel commissions
  const cancelCommissions = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({
          status: 'cancelled',
          notes: reason,
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions-admin'] });
      toast.success('Commissions cancelled');
    },
    onError: (error) => {
      console.error('Error cancelling commissions:', error);
      toast.error('Failed to cancel commissions');
    },
  });

  // Update commission notes
  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions-admin'] });
      toast.success('Notes updated');
    },
    onError: (error) => {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    },
  });

  return {
    commissions,
    stats,
    isLoading,
    approveCommissions: approveCommissions.mutate,
    markAsPaid: markAsPaid.mutate,
    cancelCommissions: cancelCommissions.mutate,
    updateNotes: updateNotes.mutate,
  };
};
