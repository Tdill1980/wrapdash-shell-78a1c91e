import { useState } from 'react';
import { affiliateApi } from '../services/affiliateApi';
import { toast } from 'sonner';

export const useAdminActions = () => {
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async (email: string) => {
    setLoading(true);
    try {
      await affiliateApi.sendAccessLink(email);
      toast.success('Magic link sent successfully');
    } catch (error) {
      console.error('Error sending magic link:', error);
      toast.error('Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const toggleFounderStatus = async (founderId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      // Direct Supabase update since affiliateApi.updateFounder doesn't support isActive
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('affiliate_founders')
        .update({ is_active: !currentStatus })
        .eq('id', founderId);
      
      if (error) throw error;
      toast.success(`Affiliate ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (founderId: string) => {
    try {
      const commissions = await affiliateApi.getFounderCommissions(founderId);
      const csvContent = [
        ['Date', 'Product', 'Order', 'Customer', 'Amount', 'Status'].join(','),
        ...commissions.map(c => [
          c.createdAt,
          c.productName || '',
          c.orderNumber,
          c.customerEmail,
          c.commissionAmount,
          c.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiliate-${founderId}-commissions.csv`;
      a.click();
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return {
    sendMagicLink,
    toggleFounderStatus,
    exportCSV,
    loading
  };
};
