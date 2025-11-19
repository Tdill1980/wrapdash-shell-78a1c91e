import { useState, useEffect } from 'react';
import { affiliateApi, AffiliateStats, AffiliateCommission } from '../services/affiliateApi';

export const useAffiliateStats = (founderId?: string) => {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (founderId) {
      fetchStats();
      fetchCommissions();
    }
  }, [founderId]);

  const fetchStats = async () => {
    if (!founderId) return;
    
    try {
      setLoading(true);
      const data = await affiliateApi.getFounderStats(founderId);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    if (!founderId) return;
    
    try {
      const data = await affiliateApi.getFounderCommissions(founderId);
      setCommissions(data);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  // Calculate status-based totals
  const pendingTotal = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const approvedTotal = commissions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const paidThisMonth = commissions
    .filter((c) => {
      if (!c.createdAt || c.status !== 'paid') return false;
      const commDate = new Date(c.createdAt);
      const now = new Date();
      return (
        commDate.getMonth() === now.getMonth() &&
        commDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  return {
    stats: stats ? {
      ...stats,
      pendingTotal,
      approvedTotal,
      paidThisMonth,
    } : null,
    commissions,
    loading,
    refresh: () => {
      fetchStats();
      fetchCommissions();
    },
  };
};