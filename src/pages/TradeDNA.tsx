import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/layouts/MainLayout';
import { useTradeDNA } from '@/hooks/useTradeDNA';
import { WizardStepIdentity } from '@/components/tradedna/WizardStepIdentity';
import { WizardStepLinks } from '@/components/tradedna/WizardStepLinks';
import { WizardStepContent } from '@/components/tradedna/WizardStepContent';
import { WizardStepAnalysis } from '@/components/tradedna/WizardStepAnalysis';
import { WizardStepReview } from '@/components/tradedna/WizardStepReview';
import { ChevronLeft, ChevronRight, Sparkles, Download, Save, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: 'Identity', description: 'Business info' },
  { id: 2, name: 'Links', description: 'Online presence' },
  { id: 3, name: 'Content', description: 'Paste content' },
  { id: 4, name: 'Analyze', description: 'AI processing' },
  { id: 5, name: 'Review', description: 'Save profile' }
];

const TradeDNA = () => {
  const navigate = useNavigate();
  const { tradeDNA, isLoading, isSaving, isAnalyzing, saveTradeDNA, analyzeBrandVoice, exportTradeDNA } = useTradeDNA();
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Form data
  const [identity, setIdentity] = useState({
    business_name: '',
    tagline: '',
    business_category: ''
  });

  const [links, setLinks] = useState({
    website_url: '',
    instagram_handle: '',
    facebook_page: '',
    youtube_channel: '',
    tiktok_handle: ''
  });

  const [content, setContent] = useState({
    website_text: '',
    instagram_captions: '',
    sample_emails: '',
    additional_content: ''
  });

  // Load existing data
  useEffect(() => {
    if (tradeDNA) {
      setIdentity({
        business_name: tradeDNA.business_name || '',
        tagline: tradeDNA.tagline || '',
        business_category: tradeDNA.business_category || ''
      });
      setLinks({
        website_url: tradeDNA.website_url || '',
        instagram_handle: tradeDNA.instagram_handle || '',
        facebook_page: tradeDNA.facebook_page || '',
        youtube_channel: tradeDNA.youtube_channel || '',
        tiktok_handle: tradeDNA.tiktok_handle || ''
      });
      if (tradeDNA.scraped_content) {
        setContent({
          website_text: (tradeDNA.scraped_content as any).website_text || '',
          instagram_captions: (tradeDNA.scraped_content as any).instagram_captions || '',
          sample_emails: (tradeDNA.scraped_content as any).sample_emails || '',
          additional_content: (tradeDNA.scraped_content as any).additional_content || ''
        });
      }
      if (tradeDNA.tradedna_profile && Object.keys(tradeDNA.tradedna_profile).length > 0) {
        setAnalysisComplete(true);
      }
    }
  }, [tradeDNA]);

  const handleIdentityChange = (field: string, value: string) => {
    setIdentity(prev => ({ ...prev, [field]: value }));
  };

  const handleLinksChange = (field: string, value: string) => {
    setLinks(prev => ({ ...prev, [field]: value }));
  };

  const handleContentChange = (field: string, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep === 3) {
      // Save identity and links, then run analysis
      await saveTradeDNA({
        ...identity,
        ...links,
        scraped_content: content
      });
      setCurrentStep(4);
      const result = await analyzeBrandVoice(content);
      if (result) {
        setAnalysisComplete(true);
        setTimeout(() => setCurrentStep(5), 1500);
      }
    } else if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    await saveTradeDNA({
      ...identity,
      ...links,
      scraped_content: content
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return identity.business_name.trim() !== '';
      case 2:
        return true;
      case 3:
        return content.website_text.trim() !== '' || content.instagram_captions.trim() !== '' || content.sample_emails.trim() !== '';
      case 4:
        return analysisComplete;
      default:
        return true;
    }
  };

  return (
    <MainLayout userName="Admin">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-foreground">Trade</span>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">DNA</span>
                <span className="text-[10px] align-super text-muted-foreground">™</span>
              </h1>
              <p className="text-sm text-muted-foreground">Brand Voice Wizard</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      currentStep > step.id && "bg-primary text-white",
                      currentStep === step.id && "bg-primary/20 border-2 border-primary text-primary",
                      currentStep < step.id && "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.id}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 hidden sm:block",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-16 lg:w-24 h-0.5 mx-1 sm:mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <WizardStepIdentity data={identity} onChange={handleIdentityChange} />
                )}
                {currentStep === 2 && (
                  <WizardStepLinks data={links} onChange={handleLinksChange} />
                )}
                {currentStep === 3 && (
                  <WizardStepContent data={content} onChange={handleContentChange} />
                )}
                {currentStep === 4 && (
                  <WizardStepAnalysis isAnalyzing={isAnalyzing} isComplete={analysisComplete} />
                )}
                {currentStep === 5 && (
                  <WizardStepReview profile={tradeDNA?.tradedna_profile} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isAnalyzing}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {currentStep === 5 && (
              <>
                <Button variant="outline" onClick={exportTradeDNA}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
                <Button variant="outline" onClick={() => navigate('/tradedna/edit')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save TradeDNA'}
                </Button>
              </>
            )}
            {currentStep < 5 && currentStep !== 4 && (
              <Button onClick={handleNext} disabled={!canProceed() || isAnalyzing}>
                {currentStep === 3 ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run TradeDNA Analysis
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
            {currentStep === 4 && analysisComplete && (
              <Button onClick={() => setCurrentStep(5)}>
                View Results
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TradeDNA;