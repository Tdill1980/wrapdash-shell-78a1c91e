import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Play, 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Film,
  Type,
  Clock,
  Sparkles
} from "lucide-react";
import { useVideoRender, InspoStyle } from "@/hooks/useVideoRender";
import { cn } from "@/lib/utils";

interface VideoContentPlan {
  hook: string;
  cta: string;
  overlays: Array<{ text: string; time: number; duration: number }>;
  caption: string;
  hashtags: string;
}

interface ReelRenderPanelProps {
  videoContent: VideoContentPlan | null;
  onClose?: () => void;
  organizationId?: string;
}

export function ReelRenderPanel({ videoContent, onClose, organizationId }: ReelRenderPanelProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [editedContent, setEditedContent] = useState<VideoContentPlan | null>(null);
  
  const {
    status,
    progress,
    outputUrl,
    errorMessage,
    isRendering,
    startRender,
    reset,
  } = useVideoRender();

  // Initialize edited content from videoContent prop
  useEffect(() => {
    if (videoContent) {
      setEditedContent(videoContent);
    }
  }, [videoContent]);

  const handleStartRender = async () => {
    if (!videoUrl || !editedContent) return;

    await startRender({
      videoUrl,
      headline: editedContent.hook,
      subtext: editedContent.cta,
      overlays: editedContent.overlays,
      organizationId,
    });
  };

  const handleDownload = () => {
    if (outputUrl) {
      window.open(outputUrl, "_blank");
    }
  };

  const handleReset = () => {
    reset();
    setVideoUrl("");
  };

  if (!videoContent && !editedContent) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="h-5 w-5 text-primary" />
            Render Video
          </CardTitle>
          {status === "succeeded" && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
          {status === "failed" && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Failed
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video URL Input */}
        {status === "idle" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Video URL
              </Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste video URL from media library..."
                className="text-sm"
              />
            </div>

            {/* Content Preview */}
            {editedContent && (
              <div className="space-y-3 rounded-lg bg-muted/50 p-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Hook
                  </Label>
                  <Input
                    value={editedContent.hook}
                    onChange={(e) => setEditedContent(prev => prev ? { ...prev, hook: e.target.value } : null)}
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    CTA
                  </Label>
                  <Input
                    value={editedContent.cta}
                    onChange={(e) => setEditedContent(prev => prev ? { ...prev, cta: e.target.value } : null)}
                    className="text-sm"
                  />
                </div>

                {editedContent.overlays.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Type className="h-3 w-3" />
                      Overlays
                    </Label>
                    <div className="space-y-1">
                      {editedContent.overlays.map((overlay, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px] min-w-[40px] justify-center">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            {overlay.time}s
                          </Badge>
                          <span className="flex-1 truncate">{overlay.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Caption
                  </Label>
                  <Textarea
                    value={editedContent.caption}
                    onChange={(e) => setEditedContent(prev => prev ? { ...prev, caption: e.target.value } : null)}
                    className="text-xs min-h-[60px]"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  {editedContent.hashtags}
                </div>
              </div>
            )}

            <Button 
              onClick={handleStartRender}
              disabled={!videoUrl || !editedContent}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Render Video
            </Button>
          </>
        )}

        {/* Rendering Progress */}
        {isRendering && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {status === "starting" ? "Starting render..." : "Rendering video..."}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">
              {progress}% complete • This may take 30-60 seconds
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "succeeded" && outputUrl && (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-[300px] flex items-center justify-center">
              <video 
                src={outputUrl} 
                controls 
                className="max-h-full max-w-full"
                poster=""
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Render Another
              </Button>
            </div>

            {/* Copy caption for posting */}
            {editedContent?.caption && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Ready to Post
                </Label>
                <p className="text-xs">{editedContent.caption}</p>
                <p className="text-xs text-primary">{editedContent.hashtags}</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(`${editedContent.caption}\n\n${editedContent.hashtags}`);
                  }}
                >
                  Copy Caption
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {status === "failed" && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium text-destructive">Render Failed</p>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            </div>
            <Button variant="outline" onClick={handleReset} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to parse VIDEO_CONTENT block from agent message
export function parseVideoContent(message: string): VideoContentPlan | null {
  const videoMatch = message.match(/===VIDEO_CONTENT===([\s\S]*?)===END_VIDEO_CONTENT===/);
  if (!videoMatch) return null;

  const content = videoMatch[1];
  
  const hookMatch = content.match(/hook:\s*(.+?)(?:\n|$)/i);
  const ctaMatch = content.match(/cta:\s*(.+?)(?:\n|$)/i);
  const captionMatch = content.match(/caption:\s*(.+?)(?:\n|$)/i);
  const hashtagsMatch = content.match(/hashtags:\s*(.+?)(?:\n|$)/i);
  
  // Parse overlays
  const overlays: Array<{ text: string; time: number; duration: number }> = [];
  const overlayRegex = /overlay_\d+:\s*(.+?)\s*\|\s*time:\s*(\d+(?:\.\d+)?)\s*\|\s*duration:\s*(\d+(?:\.\d+)?)/gi;
  let match;
  while ((match = overlayRegex.exec(content)) !== null) {
    overlays.push({
      text: match[1].trim(),
      time: parseFloat(match[2]),
      duration: parseFloat(match[3]),
    });
  }

  return {
    hook: hookMatch?.[1]?.trim() || "",
    cta: ctaMatch?.[1]?.trim() || "",
    overlays,
    caption: captionMatch?.[1]?.trim() || "",
    hashtags: hashtagsMatch?.[1]?.trim() || "",
  };
}
