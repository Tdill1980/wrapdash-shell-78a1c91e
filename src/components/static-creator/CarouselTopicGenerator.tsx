import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Lightbulb, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Brand voice / content angles
const BRAND_VOICE_OPTIONS = [
  { id: "trade_dna", name: "Trade DNA", emoji: "🧬", description: "Deep industry knowledge, insider language" },
  { id: "pain_agitate", name: "Pain → Agitate", emoji: "🎯", description: "Name the pain, twist the knife, solve it" },
  { id: "us_vs_them", name: "Us vs Them", emoji: "⚔️", description: "Position against competitors or old ways" },
  { id: "educational", name: "Educational", emoji: "📚", description: "Teach something valuable, build trust" },
  { id: "behind_scenes", name: "Behind the Scenes", emoji: "🎬", description: "Show the process, humanize the brand" },
  { id: "transformation", name: "Transformation", emoji: "🔄", description: "Before/after, change narrative" },
];

// Marketing style frameworks
const MARKETING_STYLE_OPTIONS = [
  { id: "sabri", name: "Sabri Suby", emoji: "🔥", description: "Direct response, urgency, proof stacking" },
  { id: "garyvee", name: "Gary Vee", emoji: "💪", description: "Raw, punchy, no-BS energy" },
  { id: "dara", name: "Dara Denney", emoji: "✨", description: "Premium, identity-first, calm confidence" },
  { id: "ogilvy", name: "Ogilvy", emoji: "📰", description: "Factual authority, editorial elegance" },
  { id: "hormozi", name: "Alex Hormozi", emoji: "📊", description: "Value stacking, logical frameworks" },
];

interface GeneratedTopic {
  title: string;
  slides: Array<{
    headline: string;
    body: string;
  }>;
  hook: string;
  cta: string;
}

interface CarouselTopicGeneratorProps {
  brand: string;
  onTopicGenerated: (topic: GeneratedTopic) => void;
}

export function CarouselTopicGenerator({ brand, onTopicGenerated }: CarouselTopicGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seedIdea, setSeedIdea] = useState("");
  const [brandVoice, setBrandVoice] = useState("pain_agitate");
  const [marketingStyle, setMarketingStyle] = useState("sabri");
  const [generatedTopic, setGeneratedTopic] = useState<GeneratedTopic | null>(null);

  const handleGenerate = async () => {
    if (!seedIdea.trim()) {
      toast.error("Enter a seed idea or topic");
      return;
    }

    setLoading(true);
    setGeneratedTopic(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-carousel-topic", {
        body: {
          seedIdea,
          brandVoice,
          marketingStyle,
          brand,
          slideCount: 5,
        },
      });

      if (error) throw error;

      if (data?.topic) {
        setGeneratedTopic(data.topic);
        toast.success("Topic generated!");
      } else {
        throw new Error("No topic returned");
      }
    } catch (err) {
      console.error("Topic generation failed:", err);
      toast.error("Failed to generate topic");
    } finally {
      setLoading(false);
    }
  };

  const handleUseTopic = () => {
    if (generatedTopic) {
      onTopicGenerated(generatedTopic);
      setOpen(false);
      toast.success("Topic applied to carousel!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lightbulb className="w-4 h-4" />
          AI Topic Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Carousel Topic
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Seed Idea Input */}
          <div className="space-y-2">
            <Label>What's the topic or idea?</Label>
            <Textarea
              placeholder="e.g., Why fleet wraps have 10x ROI vs billboards, Common wrap installation mistakes, How to choose wrap colors..."
              value={seedIdea}
              onChange={(e) => setSeedIdea(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Enter a rough idea and AI will structure it into a high-converting carousel
            </p>
          </div>

          {/* Brand Voice Selection */}
          <div className="space-y-3">
            <Label>Brand Voice / Angle</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BRAND_VOICE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBrandVoice(option.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    brandVoice === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{option.emoji}</span>
                    <span className="font-medium text-sm">{option.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Marketing Style Selection */}
          <div className="space-y-3">
            <Label>Marketing Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {MARKETING_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMarketingStyle(option.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    marketingStyle === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{option.emoji}</span>
                    <span className="font-medium text-sm">{option.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !seedIdea.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Topic...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Carousel Topic
              </>
            )}
          </Button>

          {/* Generated Topic Preview */}
          {generatedTopic && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">Generated Topic</Badge>
                    <h3 className="font-semibold text-lg">{generatedTopic.title}</h3>
                    {generatedTopic.hook && (
                      <p className="text-sm text-muted-foreground mt-1">
                        🎣 Hook: {generatedTopic.hook}
                      </p>
                    )}
                  </div>
                </div>

                {/* Slide Preview */}
                <div className="space-y-2">
                  <Label className="text-xs">Slides Preview ({generatedTopic.slides.length})</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {generatedTopic.slides.map((slide, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-background border p-2 flex flex-col justify-center text-center"
                      >
                        <span className="text-xs font-medium line-clamp-2">{slide.headline}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {generatedTopic.cta && (
                  <p className="text-sm">
                    <span className="font-medium">CTA:</span> {generatedTopic.cta}
                  </p>
                )}

                <Button onClick={handleUseTopic} className="w-full gap-2">
                  <Check className="w-4 h-4" />
                  Use This Topic
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
