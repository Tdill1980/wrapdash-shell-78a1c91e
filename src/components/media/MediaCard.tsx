import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Image, Music, Check, Video, Wand2, ImageIcon } from "lucide-react";

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  original_filename: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  brand: string;
  created_at: string;
  duration_seconds: number | null;
}

export type MediaSelectMode = "select" | "reel" | "static" | "hybrid";

interface MediaCardProps {
  file: MediaFile;
  selected: boolean;
  onClick: (file: MediaFile, mode?: MediaSelectMode) => void;
  selectionMode?: boolean;
}

export function MediaCard({ file, selected, onClick, selectionMode }: MediaCardProps) {
  const isImage = file.file_type === "image";
  const isVideo = file.file_type === "video";
  const isAudio = file.file_type === "audio";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative group rounded-lg overflow-hidden border cursor-pointer transition-all ${
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50"
      }`}
      onClick={() => onClick(file, "select")}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted relative">
        {isImage || file.thumbnail_url ? (
          <img
            src={file.thumbnail_url || file.file_url}
            alt={file.original_filename || ""}
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : isAudio ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Duration Badge */}
        {file.duration_seconds && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
            {formatDuration(file.duration_seconds)}
          </Badge>
        )}

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Hover Actions - Use in Reel/Static/Hybrid */}
        {!selectionMode && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="w-28"
              onClick={(e) => { e.stopPropagation(); onClick(file, "reel"); }}
            >
              <Video className="w-4 h-4 mr-2" />
              Use in Reel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-28"
              onClick={(e) => { e.stopPropagation(); onClick(file, "static"); }}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Use in Static
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-28"
              onClick={(e) => { e.stopPropagation(); onClick(file, "hybrid"); }}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Use in Hybrid
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium truncate">
          {file.original_filename || "Untitled"}
        </p>
        {file.tags && file.tags.length > 0 && (
          <div className="flex gap-1 mt-1 overflow-hidden">
            {file.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1">
                +{file.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
