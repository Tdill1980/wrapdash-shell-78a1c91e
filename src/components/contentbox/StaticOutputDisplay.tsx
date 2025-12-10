import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Megaphone, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StaticOutput {
  layout?: {
    width: number;
    height: number;
    background_image?: string;
    background_color?: string;
    elements?: Array<{
      type: string;
      text?: string;
      src?: string;
      x: number;
      y: number;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      width?: number;
      height?: number;
    }>;
  };
  preview_url?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  color_palette?: string[];
  export_html?: string;
}

interface StaticOutputDisplayProps {
  output: StaticOutput | null;
  rawOutput?: string | null;
  onDownload?: () => void;
  onSchedule?: () => void;
  onUseAsAd?: () => void;
}

export function StaticOutputDisplay({
  output,
  rawOutput,
  onDownload,
  onSchedule,
  onUseAsAd,
}: StaticOutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!output && !rawOutput) return null;

  const handleCopyCaption = () => {
    if (output?.caption) {
      navigator.clipboard.writeText(output.caption);
      setCopied(true);
      toast.success("Caption copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-500" />
            Static Design Generated
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview */}
        {output?.preview_url ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={output.preview_url}
              alt="Static design preview"
              className="w-full"
            />
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="text-xs">
                {output.layout?.width}x{output.layout?.height}
              </Badge>
            </div>
          </div>
        ) : output?.layout ? (
          <div
            className="relative rounded-lg border border-border flex items-center justify-center"
            style={{
              aspectRatio: `${output.layout.width}/${output.layout.height}`,
              backgroundColor: output.layout.background_color || "hsl(var(--muted))",
              maxHeight: "300px",
            }}
          >
            <span className="text-muted-foreground text-sm">
              {output.layout.width}x{output.layout.height} Layout
            </span>
          </div>
        ) : rawOutput ? (
          <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded-lg border border-border max-h-64 overflow-y-auto">
            {rawOutput}
          </pre>
        ) : null}

        {/* Caption */}
        {output?.caption && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Caption</span>
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
              {output.caption}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {output?.hashtags && output.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {output.hashtags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </Badge>
            ))}
          </div>
        )}

        {/* Color Palette */}
        {output?.color_palette && output.color_palette.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Colors:</span>
            {output.color_palette.map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onDownload && (
            <Button size="sm" onClick={onDownload}>
              <Download className="w-3 h-3 mr-1" />
              Download PNG
            </Button>
          )}
          {onSchedule && (
            <Button size="sm" variant="secondary" onClick={onSchedule}>
              <Calendar className="w-3 h-3 mr-1" />
              Add to Scheduler
            </Button>
          )}
          {onUseAsAd && (
            <Button size="sm" variant="outline" onClick={onUseAsAd}>
              <Megaphone className="w-3 h-3 mr-1" />
              Use for Ad
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
