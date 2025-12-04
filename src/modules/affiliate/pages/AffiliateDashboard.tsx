import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAffiliate } from '../hooks/useAffiliate';
import { useAffiliateStats } from '../hooks/useAffiliateStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatsCards } from '../components/StatsCards';
import { CommissionTable } from '../components/CommissionTable';
import { BusinessCardEditor } from '../components/BusinessCardEditor';
import { UTMLinkGenerator } from '../components/UTMLinkGenerator';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { SalesChart } from '../components/SalesChart';
import { SalesBreakdown } from '../components/SalesBreakdown';
import { ProductCard } from '../components/ProductCard';
import { ProductCommissionCards } from '../components/ProductCommissionCards';
import { AffiliateHeader } from '../components/AffiliateHeader';
import { LogOut } from 'lucide-react';

export const AffiliateDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [showLogin, setShowLogin] = useState(!token);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { founder, loading: authLoading, requestLogin, updateProfile, logout } = useAffiliate(token || undefined);
  const { stats, commissions, loading: statsLoading } = useAffiliateStats(founder?.id);

  useEffect(() => {
    // Check session storage for existing founder
    const storedFounder = sessionStorage.getItem('affiliate_founder');
    if (!founder && storedFounder && !token) {
      // User was previously logged in
      setShowLogin(false);
    }
  }, [founder, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestLogin(email);
    setEmail('');
  };

  const handleLogout = () => {
    logout();
    setShowLogin(true);
    navigate('/affiliate/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (showLogin || !founder) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 bg-[#16161E] border-[#ffffff0f]">
          <h1 className="text-2xl font-bold font-poppins mb-2 text-center">
            <span className="text-white">Mighty</span>
            <span className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">Affiliate</span>
            <span className="text-white"> Dashboard</span>
          </h1>
          <p className="text-[#B8B8C7] text-center mb-6">Enter your email to receive a magic login link</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#0A0A0F] border-[#ffffff0f] text-white"
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white"
            >
              Send Login Link
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const cardUrl = `${window.location.origin}/affiliate/card/${founder.affiliateCode}`;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Avatar */}
        <div className="flex justify-between items-start mb-8">
          <AffiliateHeader founder={founder} />
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-border text-white ml-4"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} loading={statsLoading} />

        {/* Product Performance Breakdown */}
        <div className="mt-8">
          <ProductCommissionCards commissions={commissions} />
        </div>

        {/* Product Commission Cards */}
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Your Product Ecosystem</h2>
            <p className="text-muted-foreground">
              Promote any of our 4 products and earn commission on every sale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              productName="RestylePro Visualizer Suite"
              description="AI-powered vehicle visualization and color rendering for wrap professionals."
              tagline="See the wrap before you wrap."
              commissionRate={15}
              baseUrl="https://restylepro.ai"
              affiliateCode={founder.affiliateCode}
              icon="🎨"
              totalEarned={commissions.filter(c => c.productName === 'RestylePro Visualizer Suite').reduce((sum, c) => sum + c.commissionAmount, 0)}
              totalReferrals={commissions.filter(c => c.productName === 'RestylePro Visualizer Suite').length}
              color="from-orange-500 to-amber-500"
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
        </div>

        {/* Time Period Selector & Charts */}
        <div className="mt-8 space-y-6">
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
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <BusinessCardEditor founder={founder} onSave={updateProfile} />
            <CommissionTable commissions={commissions} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
              <h3 className="text-lg font-semibold text-white mb-2">Your Affiliate Code</h3>
              <div className="bg-[#0A0A0F] p-4 rounded-lg border border-[#ffffff0f]">
                <p className="text-2xl font-bold text-[#00AFFF] text-center font-mono">
                  {founder.affiliateCode}
                </p>
              </div>
              <p className="text-xs text-[#B8B8C7] mt-2 text-center">
                Commission Rate: {founder.commissionRate}%
              </p>
            </Card>

            <UTMLinkGenerator affiliateCode={founder.affiliateCode} />
            <QRCodeGenerator affiliateCode={founder.affiliateCode} cardUrl={cardUrl} />
          </div>
        </div>
      </div>
    </div>
  );
};