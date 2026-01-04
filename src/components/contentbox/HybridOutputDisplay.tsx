import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, FileText, Hash, MessageSquare, Zap, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HybridOutput } from "@/hooks/useHybridGenerate";

interface HybridOutputDisplayProps {
  output: HybridOutput | null;
  rawOutput: string | null;
  onSendToRender?: () => void;
  onAddToScheduler?: () => void;
}

export function HybridOutputDisplay({ output, rawOutput, onSendToRender, onAddToScheduler }: HybridOutputDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!output && !rawOutput) return null;

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Hybrid Content Generated
          </CardTitle>
          <div className="flex gap-2">
            {onSendToRender && (
              <Button size="sm" onClick={onSendToRender} className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                <Play className="w-3 h-3 mr-1" />
                Render
              </Button>
            )}
            {onAddToScheduler && (
              <Button size="sm" variant="outline" onClick={onAddToScheduler}>
                <Zap className="w-3 h-3 mr-1" />
                Schedule
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {output ? (
          <>
            {/* Hook */}
            {output.hook && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Hook
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(output.hook!, 'Hook')}
                  >
                    {copiedField === 'Hook' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-sm bg-background/50 p-2 rounded border border-border/50">
                  {output.hook}
                </p>
              </div>
            )}

            {/* Script */}
            {output.script && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Script
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(output.script!, 'Script')}
                  >
                    {copiedField === 'Script' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-xs bg-background/50 p-2 rounded border border-border/50 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {output.script}
                </p>
              </div>
            )}

            {/* Caption */}
            {output.caption && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Caption
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(output.caption!, 'Caption')}
                  >
                    {copiedField === 'Caption' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-xs bg-background/50 p-2 rounded border border-border/50">
                  {output.caption}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {output.hashtags && output.hashtags.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Hashtags
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => copyToClipboard(output.hashtags!.join(' '), 'Hashtags')}
                  >
                    {copiedField === 'Hashtags' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {output.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {output.cta && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">CTA</span>
                <Badge className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                  {output.cta}
                </Badge>
              </div>
            )}

            {/* Overlays */}
            {output.overlays && output.overlays.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Text Overlays</span>
                <div className="space-y-1">
                  {output.overlays.map((overlay, i) => {
                    // Support both legacy (time) and campaign (start/end) formats
                    const timeDisplay = overlay.time || 
                      (overlay.start !== undefined && overlay.end !== undefined 
                        ? `${overlay.start}s - ${overlay.end}s` 
                        : '');
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs bg-background/50 p-2 rounded border border-border/50">
                        {timeDisplay && <span className="text-primary font-mono">{timeDisplay}</span>}
                        <span>{overlay.text}</span>
                        {overlay.style && <Badge variant="outline" className="text-[10px]">{overlay.style}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Plan */}
            {output.media_plan && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">Media Plan</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {output.media_plan.layout_template && (
                    <div>
                      <span className="text-muted-foreground">Layout: </span>
                      {output.media_plan.layout_template}
                    </div>
                  )}
                  {output.media_plan.music_suggestion && (
                    <div>
                      <span className="text-muted-foreground">Music: </span>
                      {output.media_plan.music_suggestion}
                    </div>
                  )}
                </div>
                {output.media_plan.color_palette && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Colors:</span>
                    {output.media_plan.color_palette.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : rawOutput ? (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Raw Output</span>
            <pre className="text-xs bg-background/50 p-2 rounded border border-border/50 max-h-64 overflow-y-auto whitespace-pre-wrap">
              {rawOutput}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
