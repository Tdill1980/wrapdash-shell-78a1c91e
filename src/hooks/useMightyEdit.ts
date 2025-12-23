import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VideoEditItem {
  id: string;
  organization_id: string | null;
  content_file_id: string | null;
  source_url: string;
  title: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  ai_edit_suggestions: any;
  selected_music_id: string | null;
  selected_music_url: string | null;
  text_overlays: any[];
  speed_ramps: any[];
  chapters: any[];
  shorts_extracted: any[];
  final_render_url: string | null;
  render_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  file_url: string;
  duration_seconds: number | null;
  bpm: number | null;
  energy: string;
  mood: string;
  genre: string | null;
  match_score?: number;
}

export function useMightyEdit() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editQueue, setEditQueue] = useState<VideoEditItem[]>([]);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicTrack[]>([]);

  const fetchEditQueue = useCallback(async () => {
    const { data, error } = await supabase
      .from("video_edit_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch edit queue:", error);
      return;
    }

    setEditQueue(data as VideoEditItem[]);
  }, []);

  const scanContentLibrary = useCallback(async (options?: { 
    contentFileId?: string; 
    scanAll?: boolean 
  }) => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-scan-content-library", {
        body: {
          content_file_id: options?.contentFileId,
          scan_all: options?.scanAll
        }
      });

      if (error) throw error;

      toast.success(`Scanned ${data.scanned} videos for AI editing`);
      await fetchEditQueue();
      return data;
    } catch (err) {
      console.error("Scan failed:", err);
      toast.error("Failed to scan content library");
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, [fetchEditQueue]);

  const matchMusic = useCallback(async (videoEditId: string, transcript?: string, durationSeconds?: number) => {
    setIsMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-match-music", {
        body: {
          video_edit_id: videoEditId,
          transcript,
          duration_seconds: durationSeconds
        }
      });

      if (error) throw error;

      setMusicRecommendations(data.recommendations || []);
      toast.success(`Found ${data.recommendations?.length || 0} music matches`);
      await fetchEditQueue();
      return data;
    } catch (err) {
      console.error("Music matching failed:", err);
      toast.error("Failed to match music");
      throw err;
    } finally {
      setIsMatching(false);
    }
  }, [fetchEditQueue]);

  const executeEdits = useCallback(async (videoEditId: string, renderType: "full" | "shorts" | "all" = "full") => {
    setIsExecuting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-execute-edits", {
        body: {
          video_edit_id: videoEditId,
          render_type: renderType
        }
      });

      if (error) throw error;

      toast.success("Rendering started! Check back in a few minutes.");
      await fetchEditQueue();
      return data;
    } catch (err) {
      console.error("Execute edits failed:", err);
      toast.error("Failed to execute edits");
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [fetchEditQueue]);

  const updateEditItem = useCallback(async (id: string, updates: Partial<VideoEditItem>) => {
    const { error } = await supabase
      .from("video_edit_queue")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update edit item");
      throw error;
    }

    await fetchEditQueue();
  }, [fetchEditQueue]);

  const selectMusic = useCallback(async (videoEditId: string, musicId: string, musicUrl: string) => {
    await updateEditItem(videoEditId, {
      selected_music_id: musicId,
      selected_music_url: musicUrl
    });
    toast.success("Music selected");
  }, [updateEditItem]);

  // Mark a linked task as complete after successful render
  const markTaskComplete = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId);

      if (error) {
        console.error("Failed to mark task complete:", error);
        return false;
      }

      toast.success("Task marked as complete!");
      return true;
    } catch (err) {
      console.error("Error marking task complete:", err);
      return false;
    }
  }, []);

  return {
    isScanning,
    isMatching,
    isExecuting,
    editQueue,
    musicRecommendations,
    fetchEditQueue,
    scanContentLibrary,
    matchMusic,
    executeEdits,
    updateEditItem,
    selectMusic,
    markTaskComplete
  };
}
