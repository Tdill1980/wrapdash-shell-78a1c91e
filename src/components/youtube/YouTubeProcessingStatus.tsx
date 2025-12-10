import { Loader2 } from "lucide-react";

interface YouTubeProcessingStatusProps {
  isAnalyzing: boolean;
}

export function YouTubeProcessingStatus({ isAnalyzing }: YouTubeProcessingStatusProps) {
  if (!isAnalyzing) return null;

  return (
    <div className="mt-6 bg-card border border-border rounded-xl p-6 animate-fade-in">
      <p className="text-foreground text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="animate-pulse text-pink-500">●</span> Processing Video
        <Loader2 className="w-4 h-4 animate-spin ml-2 text-pink-500" />
      </p>

      <div className="text-muted-foreground space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Uploading to storage…
        </p>
        <p className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Sending to MUX…
        </p>
        <p className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-pink-500" /> Transcribing audio…
        </p>
        <p className="flex items-center gap-2 text-muted-foreground/50">
          <span className="text-muted-foreground/30">○</span> Analyzing scenes…
        </p>
        <p className="flex items-center gap-2 text-muted-foreground/50">
          <span className="text-muted-foreground/30">○</span> Generating shorts…
        </p>
      </div>

      <div className="mt-5 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full transition-all duration-1000"
          style={{ width: "45%", animation: "pulse 2s ease-in-out infinite" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-right">45% complete</p>
    </div>
  );
}
