import { Card } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, Eye } from 'lucide-react';
import { AffiliateStats } from '../services/affiliateApi';

interface StatsCardsProps {
  stats: AffiliateStats | null;
  loading: boolean;
}

export const StatsCards = ({ stats, loading }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total Earnings',
      value: stats ? `$${stats.totalEarnings.toFixed(2)}` : '$0.00',
      icon: DollarSign,
      gradient: 'from-[#00AFFF] to-[#0047FF]',
    },
    {
      title: 'Referrals',
      value: stats?.totalReferrals || 0,
      icon: Users,
      gradient: 'from-[#00AFFF] to-[#4EEAFF]',
    },
    {
      title: 'Conversion Rate',
      value: stats ? `${stats.conversionRate.toFixed(1)}%` : '0%',
      icon: TrendingUp,
      gradient: 'from-[#008CFF] to-[#00AFFF]',
    },
    {
      title: 'Card Views',
      value: stats?.cardViews || 0,
      icon: Eye,
      gradient: 'from-[#4EEAFF] to-[#00AFFF]',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 bg-[#16161E] border-[#ffffff0f] animate-pulse">
            <div className="h-12 bg-[#0A0A0F] rounded mb-2"></div>
            <div className="h-8 bg-[#0A0A0F] rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="p-6 bg-[#16161E] border-[#ffffff0f] hover:border-[#ffffff1f] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#B8B8C7] mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};