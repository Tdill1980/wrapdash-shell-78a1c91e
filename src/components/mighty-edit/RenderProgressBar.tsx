import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Download, X, ExternalLink } from "lucide-react";
import { RenderProgress } from "@/hooks/useMightyEdit";

interface RenderProgressBarProps {
  progress: RenderProgress;
  onDismiss?: () => void;
}

export function RenderProgressBar({ progress, onDismiss }: RenderProgressBarProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
  };

  const handleDownload = () => {
    if (progress.outputUrl) {
      // Open in new tab - Mux URLs are direct downloads
      window.open(progress.outputUrl, '_blank');
    }
  };

  return (
    <Card className="border-primary/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">
                {progress.message}
              </span>
              <span className="text-xs text-muted-foreground">
                {progress.progress.toFixed(0)}%
              </span>
            </div>
            
            <Progress 
              value={progress.progress} 
              className="h-2"
            />
            
            {progress.error && (
              <p className="text-xs text-destructive mt-1">{progress.error}</p>
            )}
          </div>
          
          {progress.status === 'complete' && progress.outputUrl && (
            <Button
              size="sm"
              variant="default"
              onClick={handleDownload}
              className="shrink-0"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          )}
          
          {(progress.status === 'complete' || progress.status === 'failed') && onDismiss && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDismiss}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
