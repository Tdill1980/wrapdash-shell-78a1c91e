import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Download, ExternalLink, CheckCircle, Loader2, Film, Share2 } from "lucide-react";
import { toast } from "sonner";

interface RenderResultProps {
  renderUrl?: string | null;
  playbackUrl?: string | null;
  thumbnailUrl?: string | null;
  status?: string;
  duration?: number;
  title?: string;
}

export function RenderResult({ 
  renderUrl, 
  playbackUrl, 
  thumbnailUrl, 
  status = "complete",
  duration,
  title = "Rendered Video"
}: RenderResultProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const isProcessing = status === "processing" || status === "rendering" || status === "preparing";
  const isComplete = status === "complete" || status === "ready";
  const hasFailed = status === "failed" || status === "error";

  const handleCopyLink = () => {
    const url = renderUrl || playbackUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (!renderUrl && !playbackUrl && !isProcessing) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : isProcessing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Film className="w-4 h-4" />
          )}
          {title}
          {isProcessing && (
            <Badge variant="secondary" className="ml-auto">Processing...</Badge>
          )}
          {isComplete && (
            <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-500">Ready</Badge>
          )}
          {hasFailed && (
            <Badge variant="destructive" className="ml-auto">Failed</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={50} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Your video is being processed. This may take a few minutes...
            </p>
          </div>
        )}

        {(renderUrl || playbackUrl) && (
          <>
            {/* Video Preview */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              {isPlaying ? (
                <video
                  src={renderUrl || playbackUrl?.replace('.m3u8', '/high.mp4')}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                />
              ) : thumbnailUrl ? (
                <>
                  <img 
                    src={thumbnailUrl} 
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="p-4 bg-primary rounded-full">
                      <Play className="w-8 h-8 text-primary-foreground" fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setIsPlaying(true)}
                >
                  <div className="p-4 bg-primary rounded-full">
                    <Play className="w-8 h-8 text-primary-foreground" fill="currentColor" />
                  </div>
                </div>
              )}

              {duration && (
                <Badge 
                  variant="secondary" 
                  className="absolute bottom-2 right-2 bg-black/70 text-white"
                >
                  {duration.toFixed(1)}s
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                className="flex-1" 
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <Play className="w-4 h-4 mr-2" />
                {isPlaying ? 'Stop' : 'Play'}
              </Button>
              
              {renderUrl && (
                <Button variant="secondary" className="flex-1" asChild>
                  <a href={renderUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
              
              <Button variant="outline" onClick={handleCopyLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              
              {(renderUrl || playbackUrl) && (
                <Button variant="outline" asChild>
                  <a href={renderUrl || playbackUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
