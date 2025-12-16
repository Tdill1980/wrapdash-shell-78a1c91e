import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Film, Clock, Type, Music, ChevronRight } from "lucide-react";
import { VideoEditItem } from "@/hooks/useMightyEdit";

interface VideoEditCardProps {
  video: VideoEditItem;
  onSelect: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  ready_for_review: "bg-blue-500/20 text-blue-500",
  rendering: "bg-purple-500/20 text-purple-500",
  complete: "bg-green-500/20 text-green-500",
  failed: "bg-red-500/20 text-red-500"
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  ready_for_review: "Ready for Review",
  rendering: "Rendering",
  complete: "Complete",
  failed: "Failed"
};

export function VideoEditCard({ video, onSelect }: VideoEditCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer group" onClick={onSelect}>
      <CardContent className="p-4 space-y-3">
        {/* Thumbnail / Video Preview */}
        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden relative">
          <video 
            src={video.source_url} 
            className="w-full h-full object-cover"
            muted
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(video.duration_seconds)}
            </Badge>
          </div>
          <Badge className={`absolute top-2 right-2 ${statusColors[video.status]}`}>
            {statusLabels[video.status]}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground truncate">{video.title || "Untitled Video"}</h3>

        {/* AI Stats */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Type className="w-4 h-4" />
            <span>{video.text_overlays?.length || 0} overlays</span>
          </div>
          <div className="flex items-center gap-1">
            <Music className="w-4 h-4" />
            <span>{video.selected_music_url ? "Music set" : "No music"}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Film className="w-4 h-4 mr-2" />
          Edit Video
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
