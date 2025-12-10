import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Beat {
  time: number;
  strength: number;
}

export interface BeatAnalysis {
  bpm: number;
  beats: Beat[];
  downbeats: number[];
  suggestedCutPoints: number[];
}

export function useReelBeatSync() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [bpm, setBpm] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [suggestedCutPoints, setSuggestedCutPoints] = useState<number[]>([]);

  const analyzeMusic = useCallback(async (audioUrl: string): Promise<BeatAnalysis | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-audio-beats", {
        body: { audio_url: audioUrl },
      });

      if (error) {
        console.error("Beat analysis error:", error);
        return null;
      }

      const analysis: BeatAnalysis = {
        bpm: data.bpm || 120,
        beats: data.beats || [],
        downbeats: data.downbeats || [],
        suggestedCutPoints: data.suggestedCutPoints || [],
      };

      setBeats(analysis.beats);
      setBpm(analysis.bpm);
      setSuggestedCutPoints(analysis.suggestedCutPoints);

      return analysis;
    } catch (err) {
      console.error("Failed to analyze music:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyBeatSync = useCallback(
    <T extends { duration: number; trimStart: number; trimEnd: number }>(
      clips: T[]
    ): (T & { syncedStart: number; syncedEnd: number })[] => {
      if (!suggestedCutPoints.length || !clips.length) {
        return clips.map((clip, i) => ({
          ...clip,
          syncedStart: i === 0 ? 0 : clips.slice(0, i).reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0),
          syncedEnd: clips.slice(0, i + 1).reduce((acc, c) => acc + (c.trimEnd - c.trimStart), 0),
        }));
      }

      let currentTime = 0;
      return clips.map((clip, i) => {
        const clipDuration = clip.trimEnd - clip.trimStart;
        const beatStart = suggestedCutPoints[i] ?? currentTime;
        const beatEnd = suggestedCutPoints[i + 1] ?? beatStart + clipDuration;

        const result = {
          ...clip,
          syncedStart: beatStart,
          syncedEnd: Math.min(beatEnd, beatStart + clipDuration),
        };

        currentTime = result.syncedEnd;
        return result;
      });
    },
    [suggestedCutPoints]
  );

  const getOptimalClipDuration = useCallback(
    (targetBars: number = 2): number => {
      if (!bpm) return 3;
      const beatsPerBar = 4;
      const secondsPerBeat = 60 / bpm;
      return targetBars * beatsPerBar * secondsPerBeat;
    },
    [bpm]
  );

  return {
    beats,
    bpm,
    loading,
    suggestedCutPoints,
    analyzeMusic,
    applyBeatSync,
    getOptimalClipDuration,
  };
}
