import { Button } from "@/components/ui/button";
import { Play, Image, Video, Music, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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
      {/* THUMBNAIL - Taller on mobile for better touch targets */}
      <div className="w-full h-32 sm:h-40 bg-muted overflow-hidden">
        {file.thumbnail_url || (isImage && file.file_url) ? (
          <img 
            src={file.thumbnail_url || file.file_url} 
            alt={file.original_filename || "Media"} 
            className="w-full h-full object-cover" 
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Video className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
          </div>
        ) : isAudio ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Music className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
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

      {/* HOVER/TAP ACTIONS - Always visible on mobile, hover on desktop */}
      {!selectionMode && (
        <div 
          className={`absolute inset-0 bg-black/60 flex flex-col justify-center items-center gap-2 p-2 transition-opacity ${
            isMobile 
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Button
            size="sm"
            variant="secondary"
            className="w-full max-w-[120px] h-9 text-xs sm:text-sm"
            onClick={(e) => { e.stopPropagation(); onClick(file, "reel"); }}
          >
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Reel
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="w-full max-w-[120px] h-9 text-xs sm:text-sm"
            onClick={(e) => { e.stopPropagation(); onClick(file, "static"); }}
          >
            <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Static
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="w-full max-w-[120px] h-9 text-xs sm:text-sm"
            onClick={(e) => { e.stopPropagation(); onClick(file, "hybrid"); }}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Hybrid
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