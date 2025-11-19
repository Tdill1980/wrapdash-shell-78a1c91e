import { useState } from 'react';
import { useAffiliateStats } from '../hooks/useAffiliateStats';
import { AffiliateFounder } from '../services/affiliateApi';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatsCards } from '../components/StatsCards';
import { CommissionTable } from '../components/CommissionTable';
import { SalesChart } from '../components/SalesChart';
import { SalesBreakdown } from '../components/SalesBreakdown';
import { ProductCommissionCards } from '../components/ProductCommissionCards';
import { AffiliateHeader } from '../components/AffiliateHeader';
import { Skeleton } from '@/components/ui/skeleton';

interface AffiliateAdminViewProps {
  founder: AffiliateFounder;
}

export const AffiliateAdminView = ({ founder }: AffiliateAdminViewProps) => {
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { stats, commissions, loading } = useAffiliateStats(founder.id);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Affiliate Header with Avatar */}
      <AffiliateHeader founder={founder} isAdminView={true} />

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Product Commission Cards */}
      <ProductCommissionCards commissions={commissions} />

      {/* Time Period Selector & Charts */}
      <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="daily" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00AFFF] data-[state=active]:to-[#0047FF]">
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00AFFF] data-[state=active]:to-[#0047FF]">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00AFFF] data-[state=active]:to-[#0047FF]">
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value={timePeriod} className="mt-6 space-y-6">
          <SalesBreakdown commissions={commissions} timePeriod={timePeriod} />
          <SalesChart commissions={commissions} timePeriod={timePeriod} />
        </TabsContent>
      </Tabs>

      {/* Commission Table */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Commission History</h3>
        <CommissionTable commissions={commissions} />
      </Card>
    </div>
  );
};
