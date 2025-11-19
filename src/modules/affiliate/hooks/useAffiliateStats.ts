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

  return {
    stats,
    commissions,
    loading,
    refresh: () => {
      fetchStats();
      fetchCommissions();
    },
  };
};