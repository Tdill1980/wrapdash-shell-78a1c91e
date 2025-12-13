import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DNAHelixAnimation } from "@/components/beta/DNAHelixAnimation";
import { BetaProgressBar } from "@/components/beta/BetaProgressBar";
import { AccountInfoStep } from "@/components/beta/AccountInfoStep";
import { ScrubbingStep } from "@/components/beta/ScrubbingStep";
import { DetectedServicesStep } from "@/components/beta/DetectedServicesStep";
import { ActivationStep } from "@/components/beta/ActivationStep";
import Confetti from "react-confetti";

export interface DetectedService {
  name: string;
  category: string;
  pricing_type: "per_sqft" | "flat";
  suggested_price: number;
  confidence: "high" | "medium" | "low";
  enabled: boolean;
}

export interface BetaFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  websiteUrl: string;
  instagramHandle: string;
}

export interface AnalysisResult {
  voiceProfile: any;
  detectedServices: DetectedService[];
  detectedInfo: {
    email?: string;
    phone?: string;
    address?: string;
    instagram_bio?: string;
    brand_colors?: string[];
  };
}

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Scrubbing" },
  { id: 3, label: "Services" },
  { id: 4, label: "Activate" },
];

const BetaSignup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [formData, setFormData] = useState<BetaFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    businessName: "",
    websiteUrl: "",
    instagramHandle: "",
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleAccountSubmit = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.businessName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setCurrentStep(2);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;

      // Call enhanced analyze-brand-voice edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-brand-voice-enhanced",
        {
          body: {
            shopName: formData.businessName,
            websiteUrl: formData.websiteUrl,
            instagramHandle: formData.instagramHandle,
          },
        }
      );

      if (analysisError) throw analysisError;

      // Set analysis result with detected services
      setAnalysisResult({
        voiceProfile: analysisData.voiceProfile,
        detectedServices: (analysisData.detectedServices || []).map((s: any) => ({
          ...s,
          enabled: true,
        })),
        detectedInfo: analysisData.detectedInfo || {},
      });

      setCurrentStep(3);
    } catch (error: any) {
      console.error("Beta signup error:", error);
      toast.error(error.message || "Failed to create account");
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (index: number) => {
    if (!analysisResult) return;
    const updated = [...analysisResult.detectedServices];
    updated[index].enabled = !updated[index].enabled;
    setAnalysisResult({ ...analysisResult, detectedServices: updated });
  };

  const handleServiceUpdate = (index: number, field: string, value: any) => {
    if (!analysisResult) return;
    const updated = [...analysisResult.detectedServices];
    (updated[index] as any)[field] = value;
    setAnalysisResult({ ...analysisResult, detectedServices: updated });
  };

  const handleAddService = () => {
    if (!analysisResult) return;
    const newService: DetectedService = {
      name: "New Service",
      category: "wraps",
      pricing_type: "per_sqft",
      suggested_price: 5.0,
      confidence: "low",
      enabled: true,
    };
    setAnalysisResult({
      ...analysisResult,
      detectedServices: [...analysisResult.detectedServices, newService],
    });
  };

  const handleActivate = async () => {
    if (!analysisResult) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Get or create organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.businessName,
          subdomain: formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, ""),
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as organization member
      await supabase.from("organization_members").insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: "owner",
      });

      // Save TradeDNA profile
      await supabase.from("organization_tradedna").insert({
        organization_id: orgData.id,
        brand_voice: analysisResult.voiceProfile,
        website_url: formData.websiteUrl,
        instagram_handle: formData.instagramHandle,
        is_active: true,
      });

      // Create products from enabled services
      const enabledServices = analysisResult.detectedServices.filter((s) => s.enabled);
      if (enabledServices.length > 0) {
        const productsToInsert = enabledServices.map((service) => ({
          organization_id: orgData.id,
          product_name: service.name,
          category: service.category,
          pricing_type: service.pricing_type,
          price_per_sqft: service.pricing_type === "per_sqft" ? service.suggested_price : null,
          flat_price: service.pricing_type === "flat" ? service.suggested_price : null,
          is_active: true,
        }));

        await supabase.from("products").insert(productsToInsert);
      }

      // Show success
      setShowConfetti(true);
      setCurrentStep(4);

      // Redirect after delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 4000);
    } catch (error: any) {
      console.error("Activation error:", error);
      toast.error(error.message || "Failed to activate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Confetti on success */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* DNA Helix Header */}
        <div className="mb-8 text-center">
          <DNAHelixAnimation />
          <h1 className="text-4xl font-bold text-gradient mt-4">TradeDNA™</h1>
          <p className="text-muted-foreground mt-2">Unlock your brand superpowers</p>
        </div>

        {/* Progress Bar */}
        <BetaProgressBar steps={STEPS} currentStep={currentStep} />

        {/* Step Content */}
        <div className="w-full max-w-xl mt-8">
          {currentStep === 1 && (
            <AccountInfoStep
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAccountSubmit}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && <ScrubbingStep businessName={formData.businessName} />}

          {currentStep === 3 && analysisResult && (
            <DetectedServicesStep
              analysisResult={analysisResult}
              onServiceToggle={handleServiceToggle}
              onServiceUpdate={handleServiceUpdate}
              onAddService={handleAddService}
              onActivate={handleActivate}
              isLoading={isLoading}
            />
          )}

          {currentStep === 4 && (
            <ActivationStep
              businessName={formData.businessName}
              servicesCount={analysisResult?.detectedServices.filter((s) => s.enabled).length || 0}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BetaSignup;
