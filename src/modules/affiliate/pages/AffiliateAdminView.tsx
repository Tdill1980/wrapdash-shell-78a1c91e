import { useState } from 'react';
import { useAffiliateStats } from '../hooks/useAffiliateStats';
import { AffiliateFounder } from '../services/affiliateApi';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatsCards } from '../components/StatsCards';
import { CommissionTable } from '../components/CommissionTable';
import { SalesChart } from '../components/SalesChart';
import { SalesBreakdown } from '../components/SalesBreakdown';
import { ProductCard } from '../components/ProductCard';
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Your Product Ecosystem</h2>
        <p className="text-muted-foreground">
          Promote any of our 5 products and earn commission on every sale
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProductCard
          productName="WrapCommand AI"
          description="The all-in-one OS for wrap shops with quoting, CRM, AI tools, and automation."
          tagline="Grow smarter. Work faster."
          commissionRate={20}
          baseUrl="https://wrapcommand.ai"
          affiliateCode={founder.affiliateCode}
          icon="🤖"
          totalEarned={commissions.filter(c => c.productName === 'WrapCommand AI').reduce((sum, c) => sum + c.commissionAmount, 0)}
          totalReferrals={commissions.filter(c => c.productName === 'WrapCommand AI').length}
          color="from-cyan-500 to-blue-600"
        />

        <ProductCard
          productName="DesignProAI"
          description="Generate instant, AI-powered wrap designs in all major styles."
          tagline="Level-up your wrap designs."
          commissionRate={20}
          baseUrl="https://designpro.ai"
          affiliateCode={founder.affiliateCode}
          icon="🎨"
          totalEarned={commissions.filter(c => c.productName === 'DesignProAI').reduce((sum, c) => sum + c.commissionAmount, 0)}
          totalReferrals={commissions.filter(c => c.productName === 'DesignProAI').length}
          color="from-orange-500 to-red-500"
        />

        <ProductCard
          productName="The Closer by DesignProAI"
          description="Sales accelerator engine powered by DesignProAI. Convert leads into jobs."
          tagline="Close more. Faster."
          commissionRate={10}
          baseUrl="https://designpro.ai/closer"
          affiliateCode={founder.affiliateCode}
          icon="🎯"
          totalEarned={commissions.filter(c => c.productName === 'The Closer by DesignProAI').reduce((sum, c) => sum + c.commissionAmount, 0)}
          totalReferrals={commissions.filter(c => c.productName === 'The Closer by DesignProAI').length}
          color="from-green-500 to-emerald-500"
        />

        <ProductCard
          productName="Ink & Edge Magazine"
          description="The first AI-powered auto restyling magazine for the wrap industry."
          tagline="By installers. For installers."
          commissionRate={20}
          baseUrl="https://inkandedge.com"
          affiliateCode={founder.affiliateCode}
          icon="📰"
          totalEarned={commissions.filter(c => c.productName === 'Ink & Edge Magazine').reduce((sum, c) => sum + c.commissionAmount, 0)}
          totalReferrals={commissions.filter(c => c.productName === 'Ink & Edge Magazine').length}
          color="from-purple-500 to-pink-500"
        />

        <ProductCard
          productName="WePrintWraps.com"
          description="Premium wholesale wrap printing with the fastest turnaround in the USA."
          tagline="The printer trusted by pros."
          commissionRate={2.5}
          baseUrl="https://weprintwraps.com"
          affiliateCode={founder.affiliateCode}
          icon="🖨️"
          totalEarned={commissions.filter(c => c.productName === 'WePrintWraps.com').reduce((sum, c) => sum + c.commissionAmount, 0)}
          totalReferrals={commissions.filter(c => c.productName === 'WePrintWraps.com').length}
          color="from-blue-500 to-cyan-500"
        />
      </div>

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
