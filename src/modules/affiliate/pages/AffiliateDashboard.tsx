import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAffiliate } from '../hooks/useAffiliate';
import { useAffiliateStats } from '../hooks/useAffiliateStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatsCards } from '../components/StatsCards';
import { CommissionTable } from '../components/CommissionTable';
import { BusinessCardEditor } from '../components/BusinessCardEditor';
import { UTMLinkGenerator } from '../components/UTMLinkGenerator';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { LogOut } from 'lucide-react';

export const AffiliateDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [showLogin, setShowLogin] = useState(!token);

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
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Affiliate Dashboard</h1>
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
    <div className="min-h-screen bg-[#0A0A0F] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent">
              MightyAffiliate OS™
            </h1>
            <p className="text-[#B8B8C7] mt-1">Welcome back, {founder.fullName}!</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-[#ffffff0f] text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} loading={statsLoading} />

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