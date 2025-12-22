import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Download, ExternalLink, Loader2, Film } from "lucide-react";

interface ClipData {
  asset_id?: string;
  playback_id?: string;
  playback_url?: string;
  download_url?: string;
  thumbnail_url?: string;
  gif_url?: string;
  start_time?: number;
  end_time?: number;
  duration?: number;
  label?: string;
  name?: string;
  status?: string;
  hook?: string;
  cta?: string;
}

interface ClipPreviewProps {
  clips: ClipData[];
  title?: string;
  isLoading?: boolean;
}

export function ClipPreview({ clips, title = "Generated Clips", isLoading = false }: ClipPreviewProps) {
  const [playingClip, setPlayingClip] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Generating clips...</p>
        </CardContent>
      </Card>
    );
  }

  if (!clips || clips.length === 0) {
    return null;
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Film className="w-4 h-4" />
          {title} ({clips.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip, idx) => {
            const clipId = clip.playback_id || clip.asset_id || `clip-${idx}`;
            const isPlaying = playingClip === clipId;
            const duration = clip.duration || (clip.end_time && clip.start_time ? clip.end_time - clip.start_time : 0);

            return (
              <div 
                key={clipId} 
                className="relative bg-background rounded-lg overflow-hidden border border-border group"
              >
                {/* Thumbnail / Video */}
                <div className="aspect-[9/16] relative bg-black">
                  {isPlaying && clip.playback_url ? (
                    <video
                      src={clip.playback_url.replace('.m3u8', '/high.mp4')}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                      onEnded={() => setPlayingClip(null)}
                    />
                  ) : clip.thumbnail_url ? (
                    <>
                      <img 
                        src={clip.thumbnail_url} 
                        alt={clip.label || clip.name || `Clip ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Play overlay */}
                      <div 
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => setPlayingClip(clipId)}
                      >
                        <div className="p-3 bg-primary rounded-full">
                          <Play className="w-6 h-6 text-primary-foreground" fill="currentColor" />
                        </div>
                      </div>
                    </>
                  ) : clip.gif_url ? (
                    <img 
                      src={clip.gif_url} 
                      alt={clip.label || clip.name || `Clip ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Film className="w-12 h-12" />
                    </div>
                  )}
                  
                  {/* Duration badge */}
                  {duration > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-2 right-2 bg-black/70 text-white"
                    >
                      {duration.toFixed(1)}s
                    </Badge>
                  )}

                  {/* Status badge */}
                  {clip.status && clip.status !== 'ready' && (
                    <Badge 
                      variant="outline" 
                      className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                    >
                      {clip.status === 'preparing' ? 'Processing...' : clip.status}
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="font-medium text-sm truncate">
                    {clip.label || clip.name || `Clip ${idx + 1}`}
                  </p>
                  
                  {clip.hook && (
                    <p className="text-xs text-muted-foreground truncate">
                      Hook: {clip.hook}
                    </p>
                  )}
                  
                  {clip.start_time !== undefined && clip.end_time !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {clip.start_time.toFixed(1)}s → {clip.end_time.toFixed(1)}s
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {clip.playback_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setPlayingClip(isPlaying ? null : clipId)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {isPlaying ? 'Stop' : 'Play'}
                      </Button>
                    )}
                    
                    {clip.download_url && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a href={clip.download_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
