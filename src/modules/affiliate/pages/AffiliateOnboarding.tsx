import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Upload, LayoutDashboard, CreditCard, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStripeConnect } from '../hooks/useStripeConnect';

export const AffiliateOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [completedData, setCompletedData] = useState<any>(null);
  const success = searchParams.get('success');
  const refresh = searchParams.get('refresh');

  const { startOnboarding, checkStatus, status, loading } = useStripeConnect(completedData?.id);

  useEffect(() => {
    if (success === 'true' && completedData?.id) {
      checkStatus();
    }
  }, [success, completedData, checkStatus]);

  const handleComplete = (data: any) => {
    setCompletedData(data);
    // Store in session for dashboard access
    sessionStorage.setItem('affiliate_founder', JSON.stringify(data));
  };

  if (completedData) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 bg-[#0d0d1a] border-[#ffffff0f] text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome to MightyAffiliate!</h1>
          <p className="text-muted-foreground mb-8">
            Your affiliate account has been created. Here's what to do next:
          </p>

          <div className="space-y-4">
            {completedData.payout_method === 'stripe' && !status?.onboardingComplete && (
              <Button
                onClick={startOnboarding}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white h-12"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {loading ? 'Loading...' : 'Complete Stripe Setup'}
              </Button>
            )}

            {status?.onboardingComplete && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-500">Stripe connected successfully!</span>
              </div>
            )}

            {completedData.content_creator_opted_in && (
              <Button
                onClick={() => navigate('/affiliate/upload')}
                variant="outline"
                className="w-full border-[#ffffff1a] h-12"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Your First Content
              </Button>
            )}

            <Button
              onClick={() => navigate(`/affiliate/dashboard?token=${completedData.id}`)}
              variant="outline"
              className="w-full border-[#ffffff1a] h-12"
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {/* Affiliate Code Display */}
          <div className="mt-8 p-4 bg-[#1a1a2e] rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Your Affiliate Code</p>
            <p className="text-2xl font-mono font-bold text-[#00AFFF]">
              {completedData.affiliate_code}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-[#E1306C]" />
            <span className="text-sm font-semibold text-[#E1306C]">MIGHTY AFFILIATE OS™</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Join the Program</h1>
          <p className="text-muted-foreground mt-2">
            Create your affiliate account in just a few steps
          </p>
        </div>

        <OnboardingWizard onComplete={handleComplete} />

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{' '}
          <Button 
            variant="link" 
            className="text-[#00AFFF] p-0"
            onClick={() => navigate('/affiliate/login')}
          >
            Sign in here
          </Button>
        </p>
      </div>
    </div>
  );
};
