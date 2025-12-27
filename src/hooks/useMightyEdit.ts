import { useState, useCallback, useRef, useEffect } from "react";
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

export interface RenderProgress {
  videoEditId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  progress: number;
  message: string;
  outputUrl?: string;
  error?: string;
}

export function useMightyEdit() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editQueue, setEditQueue] = useState<VideoEditItem[]>([]);
  const [musicRecommendations, setMusicRecommendations] = useState<MusicTrack[]>([]);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  
  // Polling refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_COUNT = 60; // Stop polling after 5 minutes (60 * 5s)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchEditQueue = useCallback(async () => {
    const { data, error } = await supabase
      .from("video_edit_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[useMightyEdit] Failed to fetch edit queue:", error);
      return;
    }

    setEditQueue(data as VideoEditItem[]);
  }, []);

  const scanContentLibrary = useCallback(async (options?: { 
    contentFileId?: string; 
    scanAll?: boolean 
  }) => {
    setIsScanning(true);
    console.log("[useMightyEdit] Scanning content library:", options);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-scan-content-library", {
        body: {
          content_file_id: options?.contentFileId,
          scan_all: options?.scanAll
        }
      });

      if (error) {
        console.error("[useMightyEdit] Scan error:", error);
        throw error;
      }

      console.log("[useMightyEdit] Scan result:", data);
      toast.success(`Scanned ${data.scanned} videos for AI editing`);
      await fetchEditQueue();
      return data;
    } catch (err) {
      console.error("[useMightyEdit] Scan failed:", err);
      toast.error("Failed to scan content library");
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, [fetchEditQueue]);

  const matchMusic = useCallback(async (videoEditId: string, transcript?: string, durationSeconds?: number) => {
    setIsMatching(true);
    console.log("[useMightyEdit] Matching music for:", videoEditId);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-match-music", {
        body: {
          video_edit_id: videoEditId,
          transcript,
          duration_seconds: durationSeconds
        }
      });

      if (error) {
        console.error("[useMightyEdit] Music match error:", error);
        throw error;
      }

      console.log("[useMightyEdit] Music match result:", data);
      setMusicRecommendations(data.recommendations || []);
      toast.success(`Found ${data.recommendations?.length || 0} music matches`);
      await fetchEditQueue();
      return data;
    } catch (err) {
      console.error("[useMightyEdit] Music matching failed:", err);
      toast.error("Failed to match music");
      throw err;
    } finally {
      setIsMatching(false);
    }
  }, [fetchEditQueue]);

  // Poll for render status updates
  const startPollingRenderStatus = useCallback((videoEditId: string) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    pollCountRef.current = 0;

    console.log("[useMightyEdit] Starting render status polling for:", videoEditId);

    setRenderProgress({
      videoEditId,
      status: 'processing',
      progress: 10,
      message: 'Render started, processing...'
    });

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current++;
      
      if (pollCountRef.current > MAX_POLL_COUNT) {
        console.log("[useMightyEdit] Max poll count reached, stopping");
        clearInterval(pollIntervalRef.current!);
        setRenderProgress(prev => prev ? {
          ...prev,
          status: 'failed',
          message: 'Render timed out - check Render Queue for status'
        } : null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("video_edit_queue")
          .select("render_status, status, final_render_url, shorts_extracted")
          .eq("id", videoEditId)
          .single();

        if (error) {
          console.error("[useMightyEdit] Poll error:", error);
          return;
        }

        console.log("[useMightyEdit] Poll result:", data);

        // Update progress based on status
        if (data.render_status === 'complete' || data.status === 'complete') {
          clearInterval(pollIntervalRef.current!);
          setRenderProgress({
            videoEditId,
            status: 'complete',
            progress: 100,
            message: 'Render complete!',
            outputUrl: data.final_render_url || undefined
          });
          toast.success("Video rendered successfully!", {
            description: "Check the Render Queue tab to download",
            action: data.final_render_url ? {
              label: "Open",
              onClick: () => window.open(data.final_render_url, "_blank")
            } : undefined
          });
          await fetchEditQueue();
          return;
        }

        if (data.render_status === 'failed' || data.status === 'error') {
          clearInterval(pollIntervalRef.current!);
          setRenderProgress({
            videoEditId,
            status: 'failed',
            progress: 0,
            message: 'Render failed',
            error: 'Check logs for details'
          });
          toast.error("Render failed", {
            description: "Check the Render Queue for more details"
          });
          return;
        }

        // Still processing - update progress
        const progress = Math.min(10 + pollCountRef.current * 1.5, 90);
        setRenderProgress({
          videoEditId,
          status: 'processing',
          progress,
          message: data.render_status === 'processing' 
            ? 'Processing video with Mux...' 
            : 'Preparing render...'
        });
      } catch (err) {
        console.error("[useMightyEdit] Poll exception:", err);
      }
    }, 5000); // Poll every 5 seconds
  }, [fetchEditQueue]);

  const executeEdits = useCallback(async (videoEditId: string, renderType: "full" | "shorts" | "all" = "full") => {
    setIsExecuting(true);
    console.log("[useMightyEdit] ====== EXECUTE EDITS START ======");
    console.log("[useMightyEdit] Video Edit ID:", videoEditId);
    console.log("[useMightyEdit] Render Type:", renderType);
    
    try {
      // Show initial toast
      toast.loading("Starting render...", { id: `render-${videoEditId}` });
      
      console.log("[useMightyEdit] Invoking ai-execute-edits edge function...");
      
      const { data, error } = await supabase.functions.invoke("ai-execute-edits", {
        body: {
          video_edit_id: videoEditId,
          render_type: renderType
        }
      });

      console.log("[useMightyEdit] Edge function response:", { data, error });

      if (error) {
        console.error("[useMightyEdit] Edge function error:", error);
        toast.error("Render failed", { 
          id: `render-${videoEditId}`,
          description: error.message || "Check console for details"
        });
        throw error;
      }

      // Check for error in data
      if (data?.error) {
        console.error("[useMightyEdit] Render error in response:", data.error);
        toast.error("Render failed", { 
          id: `render-${videoEditId}`,
          description: data.error
        });
        throw new Error(data.error);
      }

      console.log("[useMightyEdit] Render started successfully:", data);
      
      toast.success("Rendering started!", { 
        id: `render-${videoEditId}`,
        description: "We'll notify you when it's ready"
      });
      
      // Start polling for status updates
      startPollingRenderStatus(videoEditId);
      
      await fetchEditQueue();
      return data;
    } catch (err) {
      console.error("[useMightyEdit] Execute edits failed:", err);
      setRenderProgress({
        videoEditId,
        status: 'failed',
        progress: 0,
        message: 'Failed to start render',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [fetchEditQueue, startPollingRenderStatus]);

  const updateEditItem = useCallback(async (id: string, updates: Partial<VideoEditItem>) => {
    console.log("[useMightyEdit] Updating edit item:", id, updates);
    
    const { error } = await supabase
      .from("video_edit_queue")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[useMightyEdit] Update failed:", error);
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
      console.log("[useMightyEdit] Marking task complete:", taskId);
      
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId);

      if (error) {
        console.error("[useMightyEdit] Failed to mark task complete:", error);
        return false;
      }

      toast.success("Task marked as complete!");
      return true;
    } catch (err) {
      console.error("[useMightyEdit] Error marking task complete:", err);
      return false;
    }
  }, []);

  // Stop polling (can be called manually)
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setRenderProgress(null);
  }, []);

  return {
    isScanning,
    isMatching,
    isExecuting,
    editQueue,
    musicRecommendations,
    renderProgress,
    fetchEditQueue,
    scanContentLibrary,
    matchMusic,
    executeEdits,
    updateEditItem,
    selectMusic,
    markTaskComplete,
    stopPolling
  };
}
