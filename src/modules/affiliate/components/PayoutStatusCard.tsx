import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, CreditCard, CheckCircle, Clock, 
  ExternalLink, AlertCircle, TrendingUp
} from 'lucide-react';
import { useStripeConnect } from '../hooks/useStripeConnect';

interface PayoutStatusCardProps {
  founderId: string;
  stripeOnboardingComplete?: boolean;
}

export const PayoutStatusCard = ({ founderId, stripeOnboardingComplete }: PayoutStatusCardProps) => {
  const { status, balance, checkStatus, getBalance, startOnboarding, loading } = useStripeConnect(founderId);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (founderId && !checked) {
      checkStatus();
      getBalance();
      setChecked(true);
    }
  }, [founderId, checked, checkStatus, getBalance]);

  const isConnected = status?.connected && status?.onboardingComplete;

  return (
    <Card className="p-6 bg-[#1a1a2e] border-[#ffffff0f]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#00AFFF]" />
          Payout Status
        </h3>
        {isConnected ? (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Setup Required
          </Badge>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#0d0d1a] rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Available</p>
              <p className="text-2xl font-bold text-green-500">
                ${balance?.available?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-4 bg-[#0d0d1a] rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                ${balance?.pending?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* Payout Info */}
          <div className="flex items-center justify-between p-3 bg-[#0d0d1a] rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Next payout</span>
            </div>
            <span className="text-sm text-white">15th of month</span>
          </div>

          {/* Manage Link */}
          <Button 
            variant="outline" 
            className="w-full border-[#ffffff1a]"
            onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
          >
            Manage Payout Settings
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your bank account to receive your commission payouts directly.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-[#0d0d1a] rounded-lg">
              <DollarSign className="w-5 h-5 text-[#00AFFF] mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Direct Deposit</p>
            </div>
            <div className="p-3 bg-[#0d0d1a] rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Real-time</p>
            </div>
            <div className="p-3 bg-[#0d0d1a] rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#E1306C] mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Secure</p>
            </div>
          </div>

          <Button 
            onClick={startOnboarding}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white"
          >
            {loading ? 'Loading...' : 'Connect Bank Account'}
            <CreditCard className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
};
