import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, ChevronLeft, ChevronRight, CheckCircle, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CarouselSlide {
  preview_url?: string;
  layout_template?: string;
  caption?: string;
  text_elements?: Array<{ text: string; position: string }>;
}

interface CarouselOutput {
  slides: CarouselSlide[];
  carousel_caption?: string;
  hashtags?: string[];
  cta?: string;
}

interface CarouselOutputDisplayProps {
  output: CarouselOutput | null;
  onDownloadAll?: () => void;
  onSchedule?: () => void;
}

export function CarouselOutputDisplay({
  output,
  onDownloadAll,
  onSchedule,
}: CarouselOutputDisplayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!output?.slides || output.slides.length === 0) return null;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? output.slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === output.slides.length - 1 ? 0 : prev + 1));
  };

  const handleCopyCaption = () => {
    if (output.carousel_caption) {
      navigator.clipboard.writeText(output.carousel_caption);
      setCopied(true);
      toast.success("Caption copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentSlideData = output.slides[currentSlide];

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            Carousel Generated ({output.slides.length} slides)
          </CardTitle>
          <Badge variant="secondary">
            {currentSlide + 1} / {output.slides.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Slide Preview with Navigation */}
        <div className="relative">
          <div className="rounded-lg overflow-hidden border border-border bg-muted aspect-square flex items-center justify-center">
            {currentSlideData.preview_url ? (
              <img
                src={currentSlideData.preview_url}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground text-sm">Slide {currentSlide + 1}</p>
                {currentSlideData.layout_template && (
                  <Badge variant="outline" className="mt-2">
                    {currentSlideData.layout_template}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-1">
          {output.slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide
                  ? "bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* Slide Caption */}
        {currentSlideData.caption && (
          <p className="text-xs bg-background/50 p-2 rounded border border-border/50 text-center">
            {currentSlideData.caption}
          </p>
        )}

        {/* Carousel Caption */}
        {output.carousel_caption && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Post Caption</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={handleCopyCaption}
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <p className="text-xs bg-background/50 p-2 rounded border border-border/50">
              {output.carousel_caption}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {output.hashtags && output.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {output.hashtags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA */}
        {output.cta && (
          <Badge className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
            {output.cta}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onDownloadAll && (
            <Button size="sm" onClick={onDownloadAll}>
              <Download className="w-3 h-3 mr-1" />
              Download All Slides
            </Button>
          )}
          {onSchedule && (
            <Button size="sm" variant="secondary" onClick={onSchedule}>
              <Calendar className="w-3 h-3 mr-1" />
              Schedule Carousel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
