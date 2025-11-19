import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SignupData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  bio: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  website: string;
}

export const SignupWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [data, setData] = useState<SignupData>({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    bio: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    website: '',
  });

  const updateField = (field: keyof SignupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const generateAffiliateCode = (name: string): string => {
    const cleaned = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleaned.substring(0, 6)}${random}`.toUpperCase();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const affiliateCode = generateAffiliateCode(data.fullName);
      
      const { error } = await supabase
        .from('affiliate_founders')
        .insert({
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          company_name: data.companyName,
          bio: data.bio,
          affiliate_code: affiliateCode,
          commission_rate: 2.5,
          is_active: false, // Requires admin approval
          social_links: {
            instagram: data.instagram,
            facebook: data.facebook,
            linkedin: data.linkedin,
            website: data.website,
          },
        });

      if (error) throw error;

      toast({
        title: 'Application Submitted!',
        description: 'Your affiliate application is under review. You\'ll receive an email once approved.',
      });
      
      setStep(5); // Success step
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.fullName && data.email && data.phone;
      case 2:
        return data.companyName && data.bio;
      case 3:
        return true; // Social links are optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                s <= step
                  ? 'border-primary bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-8 bg-card border-border">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Let's start with your basic details</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={data.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="John Doe"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-background border-border"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Information</h2>
              <p className="text-muted-foreground">Tell us about your business</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={data.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Your Company LLC"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio / About You *</Label>
                <Textarea
                  id="bio"
                  value={data.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Tell potential clients about yourself and your expertise..."
                  rows={5}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will appear on your MightyLink business card
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Social Links */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Social Links</h2>
              <p className="text-muted-foreground">Connect your social profiles (optional)</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={data.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={data.facebook}
                  onChange={(e) => updateField('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourusername"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={data.linkedin}
                  onChange={(e) => updateField('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="bg-background border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={data.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="bg-background border-border"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Review & Submit</h2>
              <p className="text-muted-foreground">Please review your information</p>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-background rounded-lg border border-border">
                <h3 className="font-semibold text-white mb-3">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><span className="text-white">Name:</span> {data.fullName}</p>
                  <p className="text-muted-foreground"><span className="text-white">Email:</span> {data.email}</p>
                  <p className="text-muted-foreground"><span className="text-white">Phone:</span> {data.phone}</p>
                </div>
              </div>
              
              <div className="p-4 bg-background rounded-lg border border-border">
                <h3 className="font-semibold text-white mb-3">Business Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><span className="text-white">Company:</span> {data.companyName}</p>
                  <p className="text-muted-foreground"><span className="text-white">Bio:</span> {data.bio}</p>
                </div>
              </div>
              
              {(data.instagram || data.facebook || data.linkedin || data.website) && (
                <div className="p-4 bg-background rounded-lg border border-border">
                  <h3 className="font-semibold text-white mb-3">Social Links</h3>
                  <div className="space-y-2 text-sm">
                    {data.instagram && <p className="text-muted-foreground"><span className="text-white">Instagram:</span> {data.instagram}</p>}
                    {data.facebook && <p className="text-muted-foreground"><span className="text-white">Facebook:</span> {data.facebook}</p>}
                    {data.linkedin && <p className="text-muted-foreground"><span className="text-white">LinkedIn:</span> {data.linkedin}</p>}
                    {data.website && <p className="text-muted-foreground"><span className="text-white">Website:</span> {data.website}</p>}
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-gradient-to-r from-[#00AFFF]/10 to-[#0047FF]/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 inline mr-2 text-primary" />
                  Your application will be reviewed by our team. Once approved, you'll receive an email with your unique MightyLink business card and affiliate code.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00AFFF] to-[#0047FF] mx-auto flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for your interest in becoming a MightyAffiliate partner.
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg border border-border text-left">
              <h3 className="font-semibold text-white mb-3">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Our team will review your application within 1-2 business days</li>
                <li>✓ You'll receive an email at <span className="text-white">{data.email}</span></li>
                <li>✓ Once approved, you'll get your unique MightyLink business card</li>
                <li>✓ Start earning 2.5% commission on every referral</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              disabled={step === 1 || loading}
              className="border-border"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF]"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF]"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
