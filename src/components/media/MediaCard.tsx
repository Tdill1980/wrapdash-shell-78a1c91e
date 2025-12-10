import { Button } from "@/components/ui/button";
import { Play, Image, Video, Music, Check } from "lucide-react";

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
  selected?: boolean;
  onClick: (file: MediaFile, mode?: MediaSelectMode) => void;
  selectionMode?: boolean;
}

export function MediaCard({ file, selected, onClick, selectionMode }: MediaCardProps) {
  const isImage = file.file_type === "image";
  const isVideo = file.file_type === "video";
  const isAudio = file.file_type === "audio";

  const formatDuration = (seconds: number) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all group ${
        selected
          ? "ring-2 ring-primary"
          : "hover:ring-2 hover:ring-primary/50"
      }`}
      onClick={() => onClick(file, "select")}
    >
      {/* THUMBNAIL */}
      <div className="w-full h-40 bg-muted overflow-hidden">
        {file.thumbnail_url || (isImage && file.file_url) ? (
          <img 
            src={file.thumbnail_url || file.file_url} 
            alt={file.original_filename || "Media"} 
            className="w-full h-full object-cover" 
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Video className="w-12 h-12 text-muted-foreground" />
          </div>
        ) : isAudio ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Music className="w-12 h-12 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* DURATION BADGE */}
      {file.duration_seconds && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 text-xs rounded">
          {formatDuration(file.duration_seconds)}
        </div>
      )}

      {/* SELECTED INDICATOR */}
      {selected && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* HOVER ACTIONS */}
      {!selectionMode && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-28"
            onClick={(e) => { e.stopPropagation(); onClick(file, "reel"); }}
          >
            <Video className="w-4 h-4 mr-2" />
            Use in Reel
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="w-28"
            onClick={(e) => { e.stopPropagation(); onClick(file, "static"); }}
          >
            <Image className="w-4 h-4 mr-2" />
            Use in Static
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="w-28"
            onClick={(e) => { e.stopPropagation(); onClick(file, "hybrid"); }}
          >
            <Play className="w-4 h-4 mr-2" />
            Use in Hybrid
          </Button>
        </div>
      )}

      {/* FILENAME */}
      <div className="p-2 text-xs font-medium truncate bg-card">
        {file.original_filename || "Untitled"}
      </div>
    </div>
  );
}
