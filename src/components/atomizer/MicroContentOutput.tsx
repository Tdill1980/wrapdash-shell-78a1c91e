import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Film, Calendar, Send, Download, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { MicroContent } from "@/hooks/useContentAtomizer";

interface MicroContentOutputProps {
  content: MicroContent | null;
  onAddToQueue: (content: MicroContent, title: string) => void;
  onSendToReelBuilder?: () => void;
  onSendToAdCreator?: () => void;
}

export function MicroContentOutput({ 
  content, 
  onAddToQueue,
  onSendToReelBuilder,
  onSendToAdCreator 
}: MicroContentOutputProps) {
  const [copied, setCopied] = React.useState(false);

  if (!content) {
    return null;
  }

  const handleCopy = () => {
    const textContent = typeof content.output === 'string' 
      ? content.output 
      : JSON.stringify(content.output, null, 2);
    
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const renderOutput = () => {
    const output = content.output;

    // If it's a string, just display it
    if (typeof output === 'string') {
      return <pre className="whitespace-pre-wrap text-sm">{output}</pre>;
    }

    // If it's content with specific structure
    if (output.content && typeof output.content === 'string') {
      return <pre className="whitespace-pre-wrap text-sm">{output.content}</pre>;
    }

    // Story frames
    if (output.frames || output.story_frames) {
      const frames = output.frames || output.story_frames;
      return (
        <div className="space-y-3">
          {frames.map((frame: any, i: number) => (
            <div key={i} className="p-3 bg-muted/30 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Frame {frame.frame_number || i + 1}
              </div>
              <p className="font-medium">{frame.overlay_text || frame.text}</p>
              {frame.background && (
                <p className="text-xs text-muted-foreground mt-1">
                  🎬 {frame.background}
                </p>
              )}
              {frame.cta && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {frame.cta}
                </Badge>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Reel script with beats
    if (output.beats || output.script_beats) {
      const beats = output.beats || output.script_beats;
      return (
        <div className="space-y-2">
          {beats.map((beat: any, i: number) => (
            <div key={i} className="flex gap-3 p-2 bg-muted/30 rounded">
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {beat.timing || beat.time || `${i * 1.5}s`}
              </span>
              <span className="text-sm">{beat.content || beat.text}</span>
            </div>
          ))}
        </div>
      );
    }

    // Paid ad copy
    if (output.primary_texts || output.headlines) {
      return (
        <div className="space-y-4">
          {output.primary_texts && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Primary Texts</div>
              {output.primary_texts.map((text: string, i: number) => (
                <div key={i} className="p-2 bg-muted/30 rounded mb-2 text-sm">{text}</div>
              ))}
            </div>
          )}
          {output.headlines && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Headlines</div>
              <div className="flex flex-wrap gap-2">
                {output.headlines.map((headline: string, i: number) => (
                  <Badge key={i} variant="secondary">{headline}</Badge>
                ))}
              </div>
            </div>
          )}
          {output.ctas && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">CTAs</div>
              <div className="flex flex-wrap gap-2">
                {output.ctas.map((cta: string, i: number) => (
                  <Badge key={i} variant="outline">{cta}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Carousel slides
    if (output.slides) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {output.slides.map((slide: any, i: number) => (
            <div key={i} className="aspect-square bg-muted/30 rounded-lg p-3 flex flex-col justify-center text-center">
              <div className="text-xs text-muted-foreground mb-1">Slide {i + 1}</div>
              <p className="text-sm font-medium">{slide.headline || slide.title}</p>
              {slide.text && <p className="text-xs mt-1 text-muted-foreground">{slide.text}</p>}
            </div>
          ))}
        </div>
      );
    }

    // Caption
    if (output.hook || output.caption) {
      return (
        <div className="space-y-3">
          {output.hook && (
            <p className="font-medium">{output.hook}</p>
          )}
          {output.body && <p className="text-sm">{output.body}</p>}
          {output.caption && <p className="text-sm">{output.caption}</p>}
          {output.cta && <p className="text-sm font-medium">{output.cta}</p>}
          {output.hashtags && (
            <p className="text-xs text-primary">
              {Array.isArray(output.hashtags) ? output.hashtags.join(' ') : output.hashtags}
            </p>
          )}
        </div>
      );
    }

    // Fallback: JSON display
    return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(output, null, 2)}</pre>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Generated {content.format.replace('_', ' ')}
            <Badge variant="secondary" className="text-[10px] capitalize">
              {content.style}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          {renderOutput()}
        </ScrollArea>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddToQueue(content, `${content.format} - ${new Date().toLocaleDateString()}`)}
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Add to Queue
          </Button>
          
          {(content.format === 'reel_script' || content.format === 'story') && onSendToReelBuilder && (
            <Button variant="outline" size="sm" onClick={onSendToReelBuilder}>
              <Film className="w-4 h-4 mr-1.5" />
              Send to Reel Builder
            </Button>
          )}
          
          {content.format === 'paid_ad' && onSendToAdCreator && (
            <Button variant="outline" size="sm" onClick={onSendToAdCreator}>
              <Send className="w-4 h-4 mr-1.5" />
              Send to Ad Creator
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
