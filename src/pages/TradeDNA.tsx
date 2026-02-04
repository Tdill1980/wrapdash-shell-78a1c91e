import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Sparkles,
  Globe,
  Instagram,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Zap,
  MessageSquare,
  Target,
  Palette,
} from "lucide-react";
import wrapCommandLogo from "@/assets/wrapcommand-logo-new.png";

const STEPS = [
  { id: 1, title: "Business Info", icon: Globe },
  { id: 2, title: "AI Analysis", icon: Sparkles },
  { id: 3, title: "Review & Edit", icon: MessageSquare },
  { id: 4, title: "Activate", icon: CheckCircle },
];

const SPECIALTIES = [
  "Full Wraps",
  "Partial Wraps",
  "Commercial Fleet",
  "Color Change",
  "PPF",
  "Window Tint",
  "Custom Design",
  "Ceramic Coating",
];

interface VoiceProfile {
  tone: string;
  energy: string;
  persona: string;
  vocabulary: {
    signature_phrases: string[];
    words_to_avoid: string[];
  };
  sales_style: {
    approach: string;
    urgency_level: string;
    cta_style: string;
  };
  customer_profile: {
    pain_points: string[];
    desires: string[];
  };
}

export default function TradeDNA() {
  const { organizationId } = useOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1: Business Info
  const [shopName, setShopName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  
  // Step 2-3: AI Analysis Result
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  
  // Editable fields for step 3
  const [editedTone, setEditedTone] = useState("");
  const [editedEnergy, setEditedEnergy] = useState("");
  const [editedPersona, setEditedPersona] = useState("");
  const [editedPhrases, setEditedPhrases] = useState<string[]>([]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleAnalyze = async () => {
    if (!shopName) {
      toast.error("Please enter your shop name");
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(2);

    try {
      const { data, error } = await lovableFunctions.functions.invoke("analyze-brand-voice", {
        body: {
          shopName,
          websiteUrl,
          instagramHandle,
          specialties: selectedSpecialties,
          additionalInfo,
        },
      });

      if (error) throw error;

      const profile = data.voiceProfile;
      setVoiceProfile(profile);
      setEditedTone(profile.tone);
      setEditedEnergy(profile.energy);
      setEditedPersona(profile.persona);
      setEditedPhrases(profile.vocabulary?.signature_phrases || []);
      
      setCurrentStep(3);
      toast.success("Brand voice analyzed!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze brand voice");
      setCurrentStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    setIsSaving(true);

    try {
      const updatedProfile = {
        ...voiceProfile,
        tone: editedTone,
        energy: editedEnergy,
        persona: editedPersona,
        vocabulary: {
          ...voiceProfile?.vocabulary,
          signature_phrases: editedPhrases,
        },
      };

      const { error } = await supabase
        .from("organization_tradedna" as any)
        .upsert({
          organization_id: organizationId,
          shop_name: shopName,
          website_url: websiteUrl,
          instagram_handle: instagramHandle,
          specialties: selectedSpecialties,
          voice_profile: updatedProfile,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setCurrentStep(4);
      toast.success("TradeDNA activated! Your AI now speaks in your voice.");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save TradeDNA profile");
    } finally {
      setIsSaving(false);
    }
  };

  const removePhraseTag = (index: number) => {
    setEditedPhrases(prev => prev.filter((_, i) => i !== index));
  };

  const addPhraseTag = (phrase: string) => {
    if (phrase && !editedPhrases.includes(phrase)) {
      setEditedPhrases(prev => [...prev, phrase]);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* WrapCommandAI Logo */}
          <img 
            src={wrapCommandLogo} 
            alt="WrapCommandAI™" 
            className="h-12 mx-auto object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-poppins">
              <span className="text-foreground">Trade</span>
              <span className="text-gradient">DNA</span>
              <span className="text-muted-foreground text-sm align-super">™</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Extract your unique brand voice so AI speaks like YOU
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Tell us about your shop
              </CardTitle>
              <CardDescription>
                We'll analyze your online presence to extract your unique brand voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Shop Name *</label>
                  <Input
                    placeholder="Royalty Wraps, Houdini Wraps, etc."
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="https://yourshop.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Instagram Handle</label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="@yourshop"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Your Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Info (optional)</label>
                  <Textarea
                    placeholder="Tell us more about your shop's vibe, your typical customers, what makes you different..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAnalyze}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze My Brand Voice
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Analysis (Loading) */}
        {currentStep === 2 && isAnalyzing && (
          <Card className="bg-card border-border">
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Analyzing your brand...</h3>
                  <p className="text-muted-foreground">
                    AI is extracting your unique voice from your online presence
                  </p>
                </div>
                <Progress value={66} className="max-w-xs mx-auto" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Edit */}
        {currentStep === 3 && voiceProfile && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Your Brand Voice Profile
              </CardTitle>
              <CardDescription>
                Review and fine-tune your extracted brand voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Attributes */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Tone
                  </label>
                  <Input
                    value={editedTone}
                    onChange={(e) => setEditedTone(e.target.value)}
                    placeholder="Professional, Friendly, Bold..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Energy
                  </label>
                  <Input
                    value={editedEnergy}
                    onChange={(e) => setEditedEnergy(e.target.value)}
                    placeholder="High, Medium, Calm..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Persona
                  </label>
                  <Input
                    value={editedPersona}
                    onChange={(e) => setEditedPersona(e.target.value)}
                    placeholder="Expert Installer, Creative Artist..."
                  />
                </div>
              </div>

              {/* Signature Phrases */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Signature Phrases</label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
                  {editedPhrases.map((phrase, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removePhraseTag(index)}
                    >
                      {phrase} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Type a phrase and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addPhraseTag((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>

              {/* Sales Style Preview */}
              {voiceProfile.sales_style && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <h4 className="font-medium">Sales Style Preview</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Approach:</span>
                      <p className="font-medium">{voiceProfile.sales_style.approach}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Urgency:</span>
                      <p className="font-medium">{voiceProfile.sales_style.urgency_level}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CTA Style:</span>
                      <p className="font-medium">{voiceProfile.sales_style.cta_style}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate TradeDNA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <Card className="bg-card border-border">
            <CardContent className="py-16">
              <div className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">TradeDNA Activated!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your AI now speaks in your unique brand voice. Chatbots, emails, quotes, and
                    all automated content will match your style.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Edit Profile
                  </Button>
                  <Button onClick={() => window.location.href = "/dashboard"}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
