import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Trash2, 
  Play, 
  Image as ImageIcon, 
  Video, 
  Wand2,
  Loader2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InspoFile } from "@/hooks/useInspoLibrary";

interface InspoImageCardProps {
  file: InspoFile;
  onAnalyze: (file: InspoFile) => void;
  onDelete: (id: string) => void;
  onGenerateSimilar: (file: InspoFile) => void;
  isAnalyzing?: boolean;
}

export function InspoImageCard({ 
  file, 
  onAnalyze, 
  onDelete, 
  onGenerateSimilar,
  isAnalyzing 
}: InspoImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isVideo = file.file_type === "video";

  return (
    <Card 
      className="overflow-hidden group cursor-pointer transition-all hover:ring-2 hover:ring-primary"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square">
        {isVideo ? (
          <video
            src={file.file_url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
            onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
          />
        ) : (
          <img
            src={file.thumbnail_url || file.file_url}
            alt={file.original_filename || "Inspiration"}
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity",
          isHovered ? "opacity-100" : "opacity-60"
        )} />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs bg-black/50 backdrop-blur-sm border-0">
            {isVideo ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
            {isVideo ? "Video" : "Image"}
          </Badge>
        </div>

        {/* Duration for videos */}
        {isVideo && file.duration_seconds && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-black/50 backdrop-blur-sm border-0">
              {Math.floor(file.duration_seconds / 60)}:{String(file.duration_seconds % 60).padStart(2, '0')}
            </Badge>
          </div>
        )}

        {/* Play icon for videos */}
        {isVideo && !isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Action buttons on hover */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 space-y-2 transition-all",
          isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-primary/90 hover:bg-primary"
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze(file);
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              Analyze Style
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateSimilar(file);
              }}
            >
              <Wand2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                window.open(file.file_url, "_blank");
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              View Full
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Filename */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-xs text-white/80 truncate">
            {file.original_filename || "Untitled"}
          </p>
        </div>
      </div>
    </Card>
  );
}
