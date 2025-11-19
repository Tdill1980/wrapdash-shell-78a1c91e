import { SignupWizard } from '../components/SignupWizard';
import { Link } from 'react-router-dom';

export const AffiliateSignup = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00AFFF] to-[#0047FF] bg-clip-text text-transparent mb-3">
            MightyAffiliate OS™
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Join Our Partner Network
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Earn 2.5% commission on every sale you refer. Get your own branded MightyLink business card, 
            track your earnings, and grow your income.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="text-2xl font-bold text-primary mb-2">2.5%</div>
            <div className="text-sm text-white font-semibold mb-1">Commission Rate</div>
            <div className="text-xs text-muted-foreground">Earn on every successful referral</div>
          </div>
          
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="text-2xl font-bold text-primary mb-2">💳</div>
            <div className="text-sm text-white font-semibold mb-1">MightyLink Card</div>
            <div className="text-xs text-muted-foreground">Your own branded business card</div>
          </div>
          
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="text-2xl font-bold text-primary mb-2">📊</div>
            <div className="text-sm text-white font-semibold mb-1">Real-Time Dashboard</div>
            <div className="text-xs text-muted-foreground">Track earnings and performance</div>
          </div>
        </div>

        {/* Wizard */}
        <SignupWizard />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              to="/affiliate/dashboard" 
              className="text-primary hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
