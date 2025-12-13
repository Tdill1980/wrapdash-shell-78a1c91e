import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MainLayout } from "@/layouts/MainLayout";
import { Building2, Globe, Instagram, Loader2, Sparkles, Check, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import Confetti from "react-confetti";

interface DetectedService {
  name: string;
  category: string;
  pricing_type: "per_sqft" | "flat";
  suggested_price: number;
  confidence: "high" | "medium" | "low";
  enabled: boolean;
}

interface AnalysisResult {
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
  { id: 1, label: "Business Info", icon: Building2 },
  { id: 2, label: "AI Scrubbing", icon: Sparkles },
  { id: 3, label: "Review Services", icon: Check },
  { id: 4, label: "Activate", icon: Zap },
];

const AddOrganizationWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!businessName.trim() || !subdomain.trim()) {
      toast.error("Please enter business name and subdomain");
      return;
    }

    // Validate subdomain
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      toast.error("Subdomain can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    setIsLoading(true);
    setCurrentStep(2);

    try {
      // Check subdomain availability
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("subdomain", subdomain.toLowerCase())
        .single();

      if (existing) {
        toast.error("This subdomain is already in use");
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      // Call enhanced analyze-brand-voice with Instagram scrubbing
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-brand-voice-enhanced",
        {
          body: {
            shopName: businessName,
            websiteUrl: websiteUrl || undefined,
            instagramHandle: instagramHandle?.replace("@", "") || undefined,
          },
        }
      );

      if (analysisError) throw analysisError;

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
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze brand");
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

  const handleActivate = async () => {
    if (!analysisResult) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create organization linked to current user
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: businessName,
          subdomain: subdomain.toLowerCase(),
          owner_id: user.id,
          role: "beta_shop",
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
        website_url: websiteUrl || null,
        instagram_handle: instagramHandle || null,
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

      setCreatedOrgId(orgData.id);
      setShowConfetti(true);
      setCurrentStep(4);

      toast.success(`${businessName} has been created!`);
    } catch (error: any) {
      console.error("Activation error:", error);
      toast.error(error.message || "Failed to activate organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToOrg = () => {
    if (createdOrgId) {
      localStorage.setItem("currentOrganizationId", createdOrgId);
      window.location.href = "/dashboard";
    }
  };

  return (
    <MainLayout userName="Admin">
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            Add New Brand
          </h1>
          <p className="text-muted-foreground mt-1">
            Onboard a new workspace with AI-powered brand voice extraction
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
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
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Enter the brand details. AI will scrub the website and Instagram for brand voice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Ink & Edge Magazine"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    placeholder="inkandedge"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="bg-background"
                  />
                  <span className="text-muted-foreground text-sm whitespace-nowrap">.wrapcommandai.com</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website URL
                </Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://inkandedge.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramHandle" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram Handle
                </Label>
                <Input
                  id="instagramHandle"
                  placeholder="@inkandedgemagazine"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="bg-background"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!businessName.trim() || !subdomain.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Brand Voice
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Scrubbing */}
        {currentStep === 2 && (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scrubbing for TradeDNA...</h3>
              <p className="text-muted-foreground mb-4">
                Analyzing {businessName}'s website and Instagram
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {websiteUrl && (
                  <Badge variant="outline" className="animate-pulse">
                    <Globe className="w-3 h-3 mr-1" />
                    {new URL(websiteUrl).hostname}
                  </Badge>
                )}
                {instagramHandle && (
                  <Badge variant="outline" className="animate-pulse">
                    <Instagram className="w-3 h-3 mr-1" />
                    {instagramHandle}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review Services */}
        {currentStep === 3 && analysisResult && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Review Detected Profile
              </CardTitle>
              <CardDescription>
                AI detected these services and brand voice from {businessName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Profile Summary */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold mb-2">Brand Voice</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>{analysisResult.voiceProfile.tone}</Badge>
                  <Badge variant="secondary">{analysisResult.voiceProfile.energy} Energy</Badge>
                  <Badge variant="outline">{analysisResult.voiceProfile.persona}</Badge>
                </div>
                {analysisResult.detectedInfo.instagram_bio && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{analysisResult.detectedInfo.instagram_bio}"
                  </p>
                )}
              </div>

              {/* Services */}
              <div>
                <h4 className="font-semibold mb-3">Detected Services</h4>
                <div className="space-y-2">
                  {analysisResult.detectedServices.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={service.enabled}
                          onCheckedChange={() => handleServiceToggle(idx)}
                        />
                        <div>
                          <span className="font-medium">{service.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">
                              {service.pricing_type === "per_sqft" ? `/sqft` : "flat"}
                            </Badge>
                            <Badge
                              variant={
                                service.confidence === "high"
                                  ? "default"
                                  : service.confidence === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {service.confidence}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-primary">
                        ${service.suggested_price.toFixed(2)}
                        {service.pricing_type === "per_sqft" && "/sqft"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Activate {businessName}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{businessName} is Live!</h3>
              <p className="text-muted-foreground mb-6">
                Organization created with TradeDNA and{" "}
                {analysisResult?.detectedServices.filter((s) => s.enabled).length || 0} services
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleSwitchToOrg} className="bg-primary hover:bg-primary/90">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Switch to {businessName}
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/organizations")}>
                  View All Organizations
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default AddOrganizationWizard;
