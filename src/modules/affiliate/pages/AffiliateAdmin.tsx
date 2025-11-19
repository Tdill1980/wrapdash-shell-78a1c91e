import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { affiliateApi, AffiliateFounder } from '../services/affiliateApi';
import { useAdminActions } from '../hooks/useAdminActions';
import { AffiliateAdminView } from './AffiliateAdminView';
import { StatsCards } from '../components/StatsCards';
import { SalesChart } from '../components/SalesChart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, ToggleLeft, ToggleRight, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const AffiliateAdmin = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [founders, setFounders] = useState<AffiliateFounder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFounder, setSelectedFounder] = useState<AffiliateFounder | null>(null);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [allCommissions, setAllCommissions] = useState<any[]>([]);
  const { sendMagicLink, toggleFounderStatus, exportCSV } = useAdminActions();

  useEffect(() => {
    if (isAdmin) {
      fetchFounders();
      fetchPlatformStats();
    }
  }, [isAdmin]);

  const fetchFounders = async () => {
    try {
      const data = await affiliateApi.getAllFounders();
      setFounders(data.map((f: any) => ({
        id: f.id,
        fullName: f.full_name,
        email: f.email,
        phone: f.phone,
        companyName: f.company_name,
        affiliateCode: f.affiliate_code,
        commissionRate: f.commission_rate,
        avatarUrl: f.avatar_url,
        bio: f.bio,
        socialLinks: f.social_links,
        isActive: f.is_active,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })));
    } catch (error) {
      console.error('Error fetching founders:', error);
      toast.error('Failed to load affiliates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      // Fetch all commissions and aggregate platform-wide stats
      const commissions = await affiliateApi.getAllCommissions();
      setAllCommissions(commissions);
      
      const totalEarnings = commissions.reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);
      const totalReferrals = commissions.length;
      const pendingTotal = commissions
        .filter((c: any) => c.status === 'pending')
        .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);
      const approvedTotal = commissions
        .filter((c: any) => c.status === 'approved' || c.status === 'paid')
        .reduce((sum: number, c: any) => sum + Number(c.commission_amount), 0);

      setPlatformStats({
        totalEarnings,
        totalReferrals,
        conversionRate: 0, // Would need card views data to calculate
        cardViews: 0, // Would need to aggregate from all founders
        pendingTotal,
        approvedTotal,
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  if (adminLoading || loading) {
    return <div className="p-8 text-white">Loading admin dashboard...</div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-white">Access denied</div>;
  }

  if (selectedFounder) {
    return (
      <div className="p-8">
        <button 
          onClick={() => setSelectedFounder(null)}
          className="mb-6 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent transition text-white"
        >
          ← Back to List
        </button>
        <AffiliateAdminView founder={selectedFounder} />
      </div>
    );
  }

  return (
    <div className="p-8 text-white flex flex-col gap-8">
      <div className="bg-[#0A0A0F] p-6 rounded-2xl border border-white/10">
        <h1 className="text-3xl font-bold font-poppins">
          <span className="text-white">Mighty</span>
          <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Affiliate</span>
          <span className="text-white"> Admin Dashboard</span>
        </h1>
        <p className="text-[#B8B8C7] mt-2">
          Manage affiliates, commissions, product payouts, and platform-wide performance.
        </p>
      </div>

      {/* Platform Stats & Chart */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Platform Performance</h2>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as any)}>
            <TabsList className="bg-[#16161E] border border-[#ffffff0f]">
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
          </Tabs>
        </div>

        <StatsCards stats={platformStats} loading={loading} />
        
        <SalesChart commissions={allCommissions} timePeriod={timePeriod} />
      </div>

      <div className="p-6 bg-[#101016] rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold mb-4">All Affiliates</h2>

        <div className="flex flex-wrap gap-4">
          {founders.map((f) => (
            <div
              key={f.id}
              className="cursor-pointer p-4 rounded-xl border border-white/10 bg-[#0F0F15] hover:border-blue-500 hover:bg-[#0A1647] transition group"
              onClick={() => setSelectedFounder(f)}
            >
              <img
                src={f.avatarUrl || "https://via.placeholder.com/60"}
                className="w-14 h-14 rounded-xl object-cover border border-white/10 mb-2"
                alt="avatar"
              />
              <p className="font-semibold">{f.fullName}</p>
              <p className="text-xs text-[#B8B8C7]">{f.email}</p>
              <p className="text-xs mt-1">
                Code: <span className="font-semibold">{f.affiliateCode}</span>
              </p>
              
              <div className="flex flex-col gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/affiliate/card/${f.affiliateCode}`, '_blank');
                  }}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00AFFF] to-[#0047FF] hover:opacity-90 transition text-xs flex items-center gap-2"
                >
                  <ExternalLink size={12} /> Preview Card
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMagicLink(f.email);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#0A1647] hover:bg-[#1477C8] transition text-xs flex items-center gap-2"
                >
                  <Mail size={12} /> Send Link
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFounderStatus(f.id, f.isActive || false);
                    setTimeout(() => fetchFounders(), 1000);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#0A1647] hover:bg-[#1477C8] transition text-xs flex items-center gap-2"
                >
                  {f.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                  {f.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportCSV(f.id);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#0A1647] hover:bg-[#1477C8] transition text-xs flex items-center gap-2"
                >
                  <Download size={12} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
