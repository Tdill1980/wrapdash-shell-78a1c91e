import { useMemo } from 'react';
import { PortfolioJob } from './usePortfolioJobs';

interface PortfolioStats {
  totalJobs: number;
  totalRevenue: number;
  avgPrice: number;
  jobsThisMonth: number;
  completedJobs: number;
  pendingJobs: number;
  topTags: { tag: string; count: number }[];
}

export const usePortfolioStats = (jobs: PortfolioJob[]): { stats: PortfolioStats } => {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalJobs = jobs.length;
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.job_price || 0), 0);
    const avgPrice = totalJobs > 0 ? totalRevenue / totalJobs : 0;
    
    const jobsThisMonth = jobs.filter(job => 
      new Date(job.created_at) >= startOfMonth
    ).length;

    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const pendingJobs = jobs.filter(job => job.status === 'pending').length;

    // Calculate tag frequency
    const tagCounts: Record<string, number> = {};
    jobs.forEach(job => {
      (job.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalJobs,
      totalRevenue,
      avgPrice,
      jobsThisMonth,
      completedJobs,
      pendingJobs,
      topTags
    };
  }, [jobs]);

  return { stats };
};
