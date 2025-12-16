import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Check, Loader2, Zap, Volume2 } from "lucide-react";
import { useMightyEdit, VideoEditItem, MusicTrack } from "@/hooks/useMightyEdit";

interface MusicMatcherProps {
  selectedVideo: VideoEditItem | null;
}

export function MusicMatcher({ selectedVideo }: MusicMatcherProps) {
  const { isMatching, musicRecommendations, matchMusic, selectMusic } = useMightyEdit();
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const handleMatchMusic = async () => {
    if (!selectedVideo) return;
    await matchMusic(
      selectedVideo.id, 
      selectedVideo.transcript || undefined, 
      selectedVideo.duration_seconds || undefined
    );
  };

  const handleSelectTrack = async (track: MusicTrack) => {
    if (!selectedVideo) return;
    await selectMusic(selectedVideo.id, track.id, track.file_url);
  };

  const energyColors: Record<string, string> = {
    low: "bg-blue-500/20 text-blue-500",
    medium: "bg-yellow-500/20 text-yellow-500",
    high: "bg-red-500/20 text-red-500"
  };

  const moodIcons: Record<string, string> = {
    hype: "🔥",
    chill: "😌",
    dramatic: "🎭",
    motivational: "💪",
    neutral: "🎵"
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            AI Music Matcher
          </CardTitle>
          {selectedVideo && (
            <Button onClick={handleMatchMusic} disabled={isMatching}>
              {isMatching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Find Matching Music
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedVideo ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Video First</h3>
            <p className="text-muted-foreground">
              Go to the AI Editor tab and select a video to match music
            </p>
          </div>
        ) : musicRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Music Matched Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Find Matching Music" to analyze your video and get AI recommendations
            </p>
            <Button onClick={handleMatchMusic} disabled={isMatching}>
              <Zap className="w-4 h-4 mr-2" />
              Analyze & Match
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI analyzed your video and found {musicRecommendations.length} matching tracks based on mood, energy, and tempo.
            </p>
            
            <div className="grid gap-3">
              {musicRecommendations.map((track, idx) => (
                <Card 
                  key={track.id} 
                  className={`bg-muted/30 border-border hover:border-primary/50 transition-colors ${
                    selectedVideo.selected_music_id === track.id ? "border-primary" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Track Info */}
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            {track.title}
                            {idx === 0 && <Badge className="bg-primary/20 text-primary">Top Pick</Badge>}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{moodIcons[track.mood] || "🎵"} {track.mood}</span>
                            <span>•</span>
                            <Badge className={energyColors[track.energy]}>{track.energy} energy</Badge>
                            {track.bpm && (
                              <>
                                <span>•</span>
                                <span>{track.bpm} BPM</span>
                              </>
                            )}
                            {track.match_score !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-medium">{track.match_score}% match</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}
                        >
                          {playingTrack === track.id ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button 
                          size="sm"
                          variant={selectedVideo.selected_music_id === track.id ? "default" : "outline"}
                          onClick={() => handleSelectTrack(track)}
                        >
                          {selectedVideo.selected_music_id === track.id ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Selected
                            </>
                          ) : (
                            "Use This"
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {playingTrack === track.id && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <audio 
                          src={track.file_url} 
                          controls 
                          autoPlay
                          className="w-full h-8"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
