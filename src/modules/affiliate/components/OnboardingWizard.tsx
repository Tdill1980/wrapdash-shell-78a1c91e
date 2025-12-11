import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, DollarSign, Upload, CreditCard, FileText, 
  CheckCircle, ArrowRight, ArrowLeft, Rocket, Users, 
  TrendingUp, Gift, Camera, Video
} from 'lucide-react';
import { useStripeConnect } from '../hooks/useStripeConnect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'personal', title: 'Personal Info', icon: Users },
  { id: 'business', title: 'Business', icon: TrendingUp },
  { id: 'content', title: 'Content Program', icon: Camera },
  { id: 'payout', title: 'Payout Setup', icon: CreditCard },
  { id: 'terms', title: 'Terms', icon: FileText },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

export const OnboardingWizard = ({ onComplete, initialData }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    companyName: initialData?.companyName || '',
    bio: initialData?.bio || '',
    instagram: initialData?.instagram || '',
    website: initialData?.website || '',
    contentOptIn: false,
    agreedToTerms: false,
    payoutMethod: 'stripe',
    payoutEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [createdFounderId, setCreatedFounderId] = useState<string | null>(null);

  const { startOnboarding, loading: stripeLoading } = useStripeConnect(createdFounderId || undefined);

  const progress = ((step + 1) / STEPS.length) * 100;

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const generateAffiliateCode = (name: string) => {
    const base = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${base}${random}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const affiliateCode = generateAffiliateCode(formData.fullName);
      
      const { data, error } = await supabase
        .from('affiliate_founders')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          company_name: formData.companyName,
          bio: formData.bio,
          affiliate_code: affiliateCode,
          social_links: {
            instagram: formData.instagram,
            website: formData.website,
          },
          content_creator_opted_in: formData.contentOptIn,
          agreed_to_terms: formData.agreedToTerms,
          agreed_to_terms_at: new Date().toISOString(),
          payout_method: formData.payoutMethod,
          payout_email: formData.payoutEmail || formData.email,
          onboarding_step: 7,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedFounderId(data.id);
      toast.success('Welcome to MightyAffiliate!');
      onComplete(data);
    } catch (err: any) {
      console.error('Error creating affiliate:', err);
      toast.error(err.message || 'Failed to create affiliate account');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#E1306C] rounded-full flex items-center justify-center">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Welcome to MightyAffiliate™</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Join our affiliate program and earn commissions promoting the best wrap products in the industry.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-white">2.5% Commission</h3>
                <p className="text-sm text-muted-foreground">On every referral sale</p>
              </Card>
              <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                <CreditCard className="w-8 h-8 text-[#00AFFF] mx-auto mb-2" />
                <h3 className="font-semibold text-white">MightyLink Card</h3>
                <p className="text-sm text-muted-foreground">Your branded business card</p>
              </Card>
              <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                <Gift className="w-8 h-8 text-[#E1306C] mx-auto mb-2" />
                <h3 className="font-semibold text-white">Content Bonuses</h3>
                <p className="text-sm text-muted-foreground">Earn when your content is used</p>
              </Card>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Personal Information</h2>
            <p className="text-muted-foreground">Tell us about yourself</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Full Name *</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="John Smith"
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Business Information</h2>
            <p className="text-muted-foreground">Tell us about your business</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Company Name</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Your Wrap Shop LLC"
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Bio</label>
                <Input
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Tell us about your wrap business..."
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Instagram Handle</label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  placeholder="@yourwrapshop"
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourwrapshop.com"
                  className="bg-[#1a1a2e] border-[#ffffff1a]"
                />
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Creator Content Program</h2>
            <p className="text-muted-foreground">Upload your wrap content to earn extra</p>
            
            <Card className="p-6 bg-gradient-to-br from-[#405DE6]/10 via-[#833AB4]/10 to-[#E1306C]/10 border-[#ffffff0f]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E1306C]/20 flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-[#E1306C]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Upload Your Best Work</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share your wrap photos and videos. When we use your content in our ads and marketing, you earn bonuses!
                  </p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-[#1a1a2e]/50 rounded-lg">
                  <Camera className="w-6 h-6 text-[#00AFFF] mx-auto mb-1" />
                  <p className="text-sm text-white">Photos</p>
                  <p className="text-xs text-muted-foreground">Before/After shots</p>
                </div>
                <div className="text-center p-3 bg-[#1a1a2e]/50 rounded-lg">
                  <Video className="w-6 h-6 text-[#E1306C] mx-auto mb-1" />
                  <p className="text-sm text-white">Videos</p>
                  <p className="text-xs text-muted-foreground">Install process, reveals</p>
                </div>
              </div>
            </Card>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="contentOptIn"
                checked={formData.contentOptIn}
                onCheckedChange={(checked) => updateField('contentOptIn', checked)}
              />
              <label htmlFor="contentOptIn" className="text-sm text-white cursor-pointer">
                Yes, I want to participate in the Content Creator Program
              </label>
            </div>
          </div>
        );

      case 'payout':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Payout Setup</h2>
            <p className="text-muted-foreground">How would you like to receive your commissions?</p>
            
            <div className="space-y-4">
              <Card 
                className={`p-4 cursor-pointer transition-all ${formData.payoutMethod === 'stripe' ? 'border-[#00AFFF] bg-[#00AFFF]/10' : 'border-[#ffffff0f] bg-[#1a1a2e]'}`}
                onClick={() => updateField('payoutMethod', 'stripe')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.payoutMethod === 'stripe' ? 'bg-[#00AFFF]' : 'bg-[#ffffff1a]'}`}>
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Stripe Connect (Recommended)</h3>
                    <p className="text-sm text-muted-foreground">Direct deposit to your bank account</p>
                  </div>
                  {formData.payoutMethod === 'stripe' && (
                    <CheckCircle className="w-5 h-5 text-[#00AFFF]" />
                  )}
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer transition-all ${formData.payoutMethod === 'paypal' ? 'border-[#00AFFF] bg-[#00AFFF]/10' : 'border-[#ffffff0f] bg-[#1a1a2e]'}`}
                onClick={() => updateField('payoutMethod', 'paypal')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.payoutMethod === 'paypal' ? 'bg-[#00AFFF]' : 'bg-[#ffffff1a]'}`}>
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">PayPal</h3>
                    <p className="text-sm text-muted-foreground">Receive payments via PayPal</p>
                  </div>
                  {formData.payoutMethod === 'paypal' && (
                    <CheckCircle className="w-5 h-5 text-[#00AFFF]" />
                  )}
                </div>
              </Card>

              {formData.payoutMethod === 'paypal' && (
                <div>
                  <label className="text-sm text-muted-foreground">PayPal Email</label>
                  <Input
                    type="email"
                    value={formData.payoutEmail}
                    onChange={(e) => updateField('payoutEmail', e.target.value)}
                    placeholder="your@paypal.email"
                    className="bg-[#1a1a2e] border-[#ffffff1a]"
                  />
                </div>
              )}

              {formData.payoutMethod === 'stripe' && (
                <p className="text-sm text-muted-foreground text-center">
                  You'll complete Stripe setup after registration
                </p>
              )}
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Terms & Agreement</h2>
            <p className="text-muted-foreground">Please review and accept our terms</p>
            
            <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f] max-h-64 overflow-y-auto">
              <div className="space-y-4 text-sm text-muted-foreground">
                <h4 className="font-semibold text-white">MightyAffiliate Program Terms</h4>
                <p><strong>1. Commission Structure:</strong> Affiliates earn 2.5% commission on all qualified referral sales. Additional bonuses may be earned through the Content Creator Program.</p>
                <p><strong>2. Payment Schedule:</strong> Commissions are paid monthly, typically within 15 days after the month ends, for approved sales.</p>
                <p><strong>3. Content Rights:</strong> By participating in the Content Creator Program, you grant MightyAffiliate a license to use your submitted content for marketing purposes.</p>
                <p><strong>4. Brand Guidelines:</strong> Affiliates must follow brand guidelines when promoting products and may not make false claims.</p>
                <p><strong>5. Termination:</strong> Either party may terminate this agreement at any time. Earned commissions will be paid upon termination.</p>
              </div>
            </Card>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => updateField('agreedToTerms', checked)}
              />
              <label htmlFor="terms" className="text-sm text-white cursor-pointer">
                I have read and agree to the MightyAffiliate Program Terms
              </label>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Review & Submit</h2>
            <p className="text-muted-foreground">Confirm your information</p>
            
            <div className="space-y-4">
              <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                <h4 className="text-sm text-muted-foreground mb-2">Personal</h4>
                <p className="text-white">{formData.fullName}</p>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
                {formData.phone && <p className="text-sm text-muted-foreground">{formData.phone}</p>}
              </Card>

              {formData.companyName && (
                <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                  <h4 className="text-sm text-muted-foreground mb-2">Business</h4>
                  <p className="text-white">{formData.companyName}</p>
                  {formData.bio && <p className="text-sm text-muted-foreground">{formData.bio}</p>}
                </Card>
              )}

              <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                <h4 className="text-sm text-muted-foreground mb-2">Programs</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-white">Affiliate Program</span>
                </div>
                {formData.contentOptIn && (
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-white">Content Creator Program</span>
                  </div>
                )}
              </Card>

              <Card className="p-4 bg-[#1a1a2e] border-[#ffffff0f]">
                <h4 className="text-sm text-muted-foreground mb-2">Payout Method</h4>
                <p className="text-white capitalize">{formData.payoutMethod}</p>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[step].id) {
      case 'personal':
        return formData.fullName && formData.email;
      case 'terms':
        return formData.agreedToTerms;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 bg-[#1a1a2e]" />
        <div className="flex justify-between mt-2">
          {STEPS.map((s, i) => (
            <div 
              key={s.id}
              className={`flex flex-col items-center ${i <= step ? 'text-white' : 'text-muted-foreground'}`}
            >
              <s.icon className={`w-4 h-4 ${i < step ? 'text-green-500' : i === step ? 'text-[#00AFFF]' : ''}`} />
              <span className="text-xs mt-1 hidden md:block">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-8 bg-[#0d0d1a] border-[#ffffff0f]">
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
            className="border-[#ffffff1a]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] text-white"
            >
              {loading ? 'Creating...' : 'Complete Registration'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-[#00AFFF] hover:bg-[#00AFFF]/90 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
