import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Image,
  Images,
  Sparkles,
  Type,
  Palette,
  Download,
  Loader2,
  Wand2,
  Settings,
  Upload,
  LayoutGrid,
} from "lucide-react";
import { ContentMetadataPanel, useContentMetadata } from "@/components/content/ContentMetadataPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TEMPLATES = [
  { id: "before-after", name: "Before/After", icon: "↔️" },
  { id: "quote-card", name: "Quote Card", icon: "💬" },
  { id: "tips-list", name: "Tips List", icon: "📋" },
  { id: "product-feature", name: "Product Feature", icon: "✨" },
  { id: "magazine-cover", name: "Magazine Cover", icon: "📰" },
  { id: "stat-highlight", name: "Stat Highlight", icon: "📊" },
];

interface LocationState {
  calendarItem?: {
    id: string;
    title: string;
    scheduled_date: string;
  };
  autoGenerate?: boolean;
}

export default function StaticCreator() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  
  const [contentMetadata, setContentMetadata] = useContentMetadata("wpw");
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [generating, setGenerating] = useState(false);
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<string[]>([]);

  const handleGenerateSingle = async () => {
    if (!headline.trim()) {
      toast.error("Please enter a headline");
      return;
    }

    setGenerating(true);
    try {
      // Call AI to generate static post
      const { data, error } = await supabase.functions.invoke("ai-generate-static", {
        body: {
          template: selectedTemplate || "product-feature",
          headline,
          bodyText,
          ctaText,
          brand: contentMetadata.brand,
          platform: contentMetadata.platform,
          contentPurpose: contentMetadata.contentPurpose,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        
        // Save to content_queue
        await supabase.from("content_queue").insert({
          content_type: "static",
          status: "draft",
          title: headline,
          caption: bodyText,
          cta_text: ctaText,
          output_url: data.imageUrl,
          brand: contentMetadata.brand,
          channel: contentMetadata.channel,
          content_purpose: contentMetadata.contentPurpose,
          platform: contentMetadata.platform,
          ad_placement: contentMetadata.adPlacement,
          mode: "auto",
          ai_metadata: {
            template: selectedTemplate,
            generated_at: new Date().toISOString(),
          },
        });

        toast.success("Static post created!");
      } else {
        // Fallback: create placeholder in queue
        await supabase.from("content_queue").insert({
          content_type: "static",
          status: "draft",
          title: headline,
          caption: bodyText,
          cta_text: ctaText,
          brand: contentMetadata.brand,
          channel: contentMetadata.channel,
          content_purpose: contentMetadata.contentPurpose,
          platform: contentMetadata.platform,
          ad_placement: contentMetadata.adPlacement,
          mode: "auto",
          ai_metadata: {
            template: selectedTemplate,
            needs_design: true,
            generated_at: new Date().toISOString(),
          },
        });
        
        toast.success("Content brief saved! Ready for design.");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      toast.error("Failed to generate. Brief saved as draft.");
      
      // Still save the brief
      await supabase.from("content_queue").insert({
        content_type: "static",
        status: "draft",
        title: headline,
        caption: bodyText,
        brand: contentMetadata.brand,
        channel: contentMetadata.channel,
        content_purpose: contentMetadata.contentPurpose,
        platform: contentMetadata.platform,
        mode: "manual",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCarousel = async () => {
    if (!headline.trim()) {
      toast.error("Please enter a headline");
      return;
    }

    setGenerating(true);
    try {
      // Save carousel brief to queue
      await supabase.from("content_queue").insert({
        content_type: "carousel",
        status: "draft",
        title: headline,
        caption: bodyText,
        cta_text: ctaText,
        brand: contentMetadata.brand,
        channel: contentMetadata.channel,
        content_purpose: contentMetadata.contentPurpose,
        platform: contentMetadata.platform,
        ad_placement: contentMetadata.adPlacement,
        mode: "auto",
        ai_metadata: {
          slides_planned: 5,
          template: selectedTemplate,
          generated_at: new Date().toISOString(),
        },
      });

      toast.success("Carousel brief saved! Ready for design.");
    } catch (err) {
      console.error("Failed to save carousel:", err);
      toast.error("Failed to save carousel brief");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organic")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <Images className="w-5 h-5" />
                Static / Carousel Creator
              </h1>
              <p className="text-xs text-muted-foreground">
                Create organic static posts & carousels
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setMetadataOpen(!metadataOpen)}
            className={metadataOpen ? "bg-primary/10 border-primary/40" : ""}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            {contentMetadata.brand.toUpperCase()} • {contentMetadata.contentPurpose === 'paid' ? '💰' : '🌱'}
          </Button>
        </div>
      </div>

      {/* Content Metadata Panel */}
      {metadataOpen && (
        <div className="max-w-5xl mx-auto px-4 py-3 border-b border-border/30 bg-card/30">
          <ContentMetadataPanel 
            metadata={contentMetadata} 
            onChange={setContentMetadata}
            showContentType
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Single Post
            </TabsTrigger>
            <TabsTrigger value="carousel" className="flex items-center gap-2">
              <Images className="w-4 h-4" />
              Carousel
            </TabsTrigger>
          </TabsList>

          {/* Single Post Tab */}
          <TabsContent value="single" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Content Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Headline *</Label>
                    <Input 
                      placeholder="Main headline for your post..."
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Body Text</Label>
                    <Textarea 
                      placeholder="Supporting text or description..."
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Text</Label>
                    <Input 
                      placeholder="e.g., Shop Now, Learn More..."
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerateSingle}
                    disabled={generating || !headline.trim()}
                    className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center p-4 text-center ${
                          selectedTemplate === template.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 bg-muted/50"
                        }`}
                      >
                        <span className="text-2xl mb-2">{template.icon}</span>
                        <span className="text-sm font-medium">{template.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            {generatedImageUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generated Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square max-w-md mx-auto rounded-lg overflow-hidden border border-border">
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated static post" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" onClick={() => navigate("/content-schedule")}>
                      Schedule Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Carousel Tab */}
          <TabsContent value="carousel" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833AB4] to-[#E1306C] flex items-center justify-center mx-auto">
                    <Images className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Create Carousel</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Build a multi-slide carousel with cohesive design. AI will help you structure the content flow.
                  </p>

                  <div className="max-w-md mx-auto space-y-4 text-left">
                    <div className="space-y-2">
                      <Label>Carousel Topic *</Label>
                      <Input 
                        placeholder="What's your carousel about?"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Key Points (one per slide)</Label>
                      <Textarea 
                        placeholder="Enter each slide's main point on a new line..."
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>

                  <Button 
                    className="mt-4 bg-gradient-to-r from-[#833AB4] to-[#E1306C]"
                    onClick={handleGenerateCarousel}
                    disabled={generating || !headline.trim()}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Carousel
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Compact Metadata Display */}
        <div className="mt-6">
          <ContentMetadataPanel 
            metadata={contentMetadata} 
            onChange={setContentMetadata}
            compact
          />
        </div>
      </div>
    </div>
  );
}
