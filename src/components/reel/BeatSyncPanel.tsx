import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Zap, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Beat } from "@/hooks/useReelBeatSync";

interface BeatSyncPanelProps {
  audioUrl: string | null;
  beats: Beat[];
  bpm: number;
  loading: boolean;
  onSelectAudio: () => void;
  onAnalyze: () => void;
  onApplyBeatSync: () => void;
}

export function BeatSyncPanel({
  audioUrl,
  beats,
  bpm,
  loading,
  onSelectAudio,
  onAnalyze,
  onApplyBeatSync,
}: BeatSyncPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Music className="w-4 h-4" />
          Audio & Beat Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {audioUrl ? (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-xs truncate flex-1">Audio selected</span>
              <Button variant="ghost" size="sm" onClick={onSelectAudio}>
                Change
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full justify-start" onClick={onSelectAudio}>
            <Music className="w-4 h-4 mr-2" />
            Select Music Track
          </Button>
        )}

        {audioUrl && (
          <>
            <Button
              variant="secondary"
              className="w-full"
              onClick={onAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Beats...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze Beat Pattern
                </>
              )}
            </Button>

            {bpm > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Detected BPM</span>
                  <span className="text-lg font-bold text-primary">{bpm}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium">Beat Points</span>
                  <span className="text-sm">{beats.length}</span>
                </div>

                {/* Beat visualization */}
                <div className="h-6 bg-muted rounded-md overflow-hidden flex gap-0.5">
                  {beats.slice(0, 20).map((beat, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-sm",
                        beat.strength > 0.7
                          ? "bg-primary"
                          : beat.strength > 0.4
                          ? "bg-primary/60"
                          : "bg-primary/30"
                      )}
                      style={{ height: `${beat.strength * 100}%`, marginTop: "auto" }}
                    />
                  ))}
                </div>

                <Button
                  className="w-full mt-3 bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                  onClick={onApplyBeatSync}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Beat Sync to Clips
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
