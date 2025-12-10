import { useState, useRef } from "react";
import { Music, Play, Pause, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MusicTrack {
  id: string;
  name: string;
  url: string;
  duration: string;
  energy: 'calm' | 'upbeat' | 'hype';
  bpm?: number;
}

// Sample tracks - in production, these would come from Supabase storage
const SAMPLE_TRACKS: MusicTrack[] = [
  {
    id: '1',
    name: 'Drive Forward',
    url: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/music/drive-forward.mp3',
    duration: '0:30',
    energy: 'upbeat',
    bpm: 120,
  },
  {
    id: '2',
    name: 'Hype Machine',
    url: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/music/hype-machine.mp3',
    duration: '0:30',
    energy: 'hype',
    bpm: 140,
  },
  {
    id: '3',
    name: 'Smooth Ride',
    url: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/music/smooth-ride.mp3',
    duration: '0:30',
    energy: 'calm',
    bpm: 90,
  },
  {
    id: '4',
    name: 'Transform',
    url: 'https://wzwqhfbmymrengjqikjl.supabase.co/storage/v1/object/public/media-library/music/transform.mp3',
    duration: '0:30',
    energy: 'upbeat',
    bpm: 110,
  },
];

interface MusicPickerProps {
  selectedUrl: string | null;
  onSelect: (url: string | null) => void;
  className?: string;
}

export function MusicPicker({ selectedUrl, onSelect, className }: MusicPickerProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = (track: MusicTrack) => {
    if (playingId === track.id) {
      // Stop playing
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // Start playing new track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.url);
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(console.error);
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  const handleSelect = (track: MusicTrack) => {
    if (selectedUrl === track.url) {
      onSelect(null); // Deselect
    } else {
      onSelect(track.url);
    }
  };

  const energyColors = {
    calm: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    upbeat: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hype: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Card className={cn("bg-card/50 backdrop-blur border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Music className="h-4 w-4 text-primary" />
          Background Music
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SAMPLE_TRACKS.map((track) => {
          const isSelected = selectedUrl === track.url;
          const isPlaying = playingId === track.id;

          return (
            <div
              key={track.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-border bg-background/50 hover:bg-background"
              )}
              onClick={() => handleSelect(track)}
            >
              {/* Play/Pause Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(track);
                }}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{track.duration}</span>
                  {track.bpm && <span>{track.bpm} BPM</span>}
                </div>
              </div>

              {/* Energy Badge */}
              <Badge
                variant="outline"
                className={cn("text-xs capitalize shrink-0", energyColors[track.energy])}
              >
                {track.energy}
              </Badge>

              {/* Selected Indicator */}
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
          );
        })}

        {/* No Music Option */}
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer",
            selectedUrl === null
              ? "border-primary bg-primary/10"
              : "border-border/50 hover:border-border bg-background/50 hover:bg-background"
          )}
          onClick={() => onSelect(null)}
        >
          <div className="h-8 w-8 flex items-center justify-center shrink-0">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">No Music</p>
            <p className="text-xs text-muted-foreground">Use original audio</p>
          </div>
          {selectedUrl === null && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
