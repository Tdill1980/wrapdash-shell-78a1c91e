import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Scene {
  id: number;
  type: "hook" | "value" | "reveal" | "cta" | "testimonial" | "filler";
  start: string;
  end: string;
  score: number;
  text?: string;
  energy_level?: "low" | "medium" | "high";
}

export interface GeneratedShort {
  id: string;
  title: string;
  duration: string;
  hookStrength: "Weak" | "Medium" | "Strong";
  start?: number;
  end?: number;
  hook?: string;
  virality_score?: number;
  ad_potential?: boolean;
  overlay_suggestions?: string[];
  caption_suggestions?: string[];
  cta?: string;
  music_suggestion?: string;
}

export interface AnalysisData {
  duration: string;
  scenes: number;
  spikes: number;
  shorts: number;
  hookScore: number;
  productMentions: number;
  chapters?: { time: string; title: string }[];
}

export interface EnhancementData {
  pacing?: {
    overall_score: number;
    slow_sections: Array<{ start: string; end: string; suggestion: string }>;
    rushed_sections: Array<{ start: string; end: string; suggestion: string }>;
  };
  filler_words?: {
    total_count: number;
    density_per_minute: number;
    instances: Array<{ word: string; timestamp: string }>;
  };
  dead_air?: {
    total_seconds: number;
    instances: Array<{ start: string; duration: number; suggestion: string }>;
  };
  emotional_beats?: {
    arc_type: string;
    high_points: Array<{ timestamp: string; description: string; energy: number }>;
    low_points: Array<{ timestamp: string; description: string }>;
  };
  broll_cues?: Array<{ timestamp: string; duration: number; suggestion: string; type: string }>;
  text_overlays?: Array<{ timestamp: string; text: string; style: string }>;
  chapters?: Array<{ time: string; title: string }>;
  quality_scores?: {
    pacing: number;
    engagement: number;
    clarity: number;
    production_notes: string[];
  };
}

export type ProcessingStatus = 
  | "idle" 
  | "uploading" 
  | "transcribing" 
  | "analyzing" 
  | "generating_shorts" 
  | "enhancing"
  | "complete" 
  | "failed";

export function useYouTubeEditor() {
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedShort, setSelectedShort] = useState<GeneratedShort | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [enhancementData, setEnhancementData] = useState<EnhancementData | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Placeholder stats for demo mode
  const [analysis, setAnalysis] = useState<AnalysisData>({
    duration: "24:17",
    scenes: 38,
    spikes: 7,
    shorts: 8,
    hookScore: 92,
    productMentions: 3,
  });

  const [demoScenes, setDemoScenes] = useState<Scene[]>([
    { id: 1, type: "hook", start: "0:00", end: "0:06", score: 92 },
    { id: 2, type: "value", start: "0:06", end: "0:18", score: 74 },
    { id: 3, type: "reveal", start: "0:18", end: "0:23", score: 89 },
    { id: 4, type: "cta", start: "0:23", end: "0:30", score: 70 },
    { id: 5, type: "value", start: "0:30", end: "0:45", score: 81 },
    { id: 6, type: "hook", start: "0:45", end: "0:52", score: 88 },
    { id: 7, type: "reveal", start: "0:52", end: "1:05", score: 95 },
    { id: 8, type: "cta", start: "1:05", end: "1:12", score: 76 },
  ]);

  const [shorts, setShorts] = useState<GeneratedShort[]>(
    Array.from({ length: 8 }).map((_, i) => ({
      id: `short_${i + 1}`,
      title: `Short Clip #${i + 1}`,
      duration: `${Math.floor(Math.random() * 8 + 5)}.${Math.floor(Math.random() * 9)}s`,
      hookStrength: (["Weak", "Medium", "Strong"] as const)[Math.floor(Math.random() * 3)],
    }))
  );

  // Poll for job status
  const pollJobStatus = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("youtube_editor_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to poll job status:", error);
      return null;
    }

    return data;
  }, []);

  // Demo analyze function
  const analyze = useCallback(() => {
    setIsAnalyzing(true);
    setProcessingStatus("analyzing");
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      setProcessingStatus("complete");
      toast.success("Video analysis complete!");
    }, 1500);
  }, []);

  // Real upload and analyze function
  const uploadAndAnalyze = useCallback(async (fileUrl: string, organizationId?: string) => {
    setIsAnalyzing(true);
    setProcessingStatus("uploading");

    try {
      const { data, error } = await supabase.functions.invoke("yt-analyze", {
        body: { file_url: fileUrl, organization_id: organizationId }
      });

      if (error) throw error;

      setJobId(data.job_id);
      setProcessingStatus("transcribing");
      toast.success("Upload started! Processing video...");

      // Start polling for status
      const pollInterval = setInterval(async () => {
        const job = await pollJobStatus(data.job_id);
        if (job) {
          setProcessingStatus(job.processing_status as ProcessingStatus);
          
          if (job.processing_status === "complete") {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            setIsAnalyzed(true);
            
            // Update UI with real data
            const analysisData = job.analysis_data as Record<string, unknown> | null;
            const generatedShorts = job.generated_shorts as unknown[] | null;
            
            if (analysisData && typeof analysisData === 'object') {
              setAnalysis({
                duration: String(analysisData.duration_estimate || "0:00"),
                scenes: Array.isArray(analysisData.scenes) ? analysisData.scenes.length : 0,
                spikes: Number(analysisData.energy_spikes) || 0,
                shorts: Array.isArray(generatedShorts) ? generatedShorts.length : 0,
                hookScore: Number(analysisData.hook_score) || 0,
                productMentions: Number(analysisData.product_mentions) || 0,
                chapters: analysisData.chapters as { time: string; title: string }[] | undefined,
              });
              if (Array.isArray(analysisData.scenes)) {
                setDemoScenes(analysisData.scenes as Scene[]);
              }
            }
            
            if (Array.isArray(generatedShorts)) {
              setShorts(generatedShorts.map((s: unknown) => {
                const short = s as Record<string, unknown>;
                return {
                  id: String(short.id || ''),
                  title: String(short.title || ''),
                  duration: `${Number(short.duration)?.toFixed(1) || 0}s`,
                  hookStrength: Number(short.hook_strength) > 80 ? "Strong" : Number(short.hook_strength) > 50 ? "Medium" : "Weak",
                  start: Number(short.start) || undefined,
                  end: Number(short.end) || undefined,
                  hook: String(short.hook || ''),
                  virality_score: Number(short.virality_score) || undefined,
                  ad_potential: Boolean(short.ad_potential),
                  overlay_suggestions: short.overlay_suggestions as string[] | undefined,
                  caption_suggestions: short.caption_suggestions as string[] | undefined,
                  cta: String(short.cta || ''),
                  music_suggestion: String(short.music_suggestion || ''),
                };
              }));
            }
            
            if (job.transcript) {
              setTranscript(job.transcript);
            }
            
            toast.success("Analysis complete!");
          } else if (job.processing_status === "failed") {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            setProcessingStatus("failed");
            toast.error("Analysis failed");
          }
        }
      }, 3000);

    } catch (err) {
      console.error("Upload failed:", err);
      setIsAnalyzing(false);
      setProcessingStatus("failed");
      toast.error("Failed to start analysis");
    }
  }, [pollJobStatus]);

  // Generate long-form enhancements
  const generateEnhancements = useCallback(async () => {
    if (!jobId || !transcript) {
      toast.error("No transcript available for enhancement analysis");
      return;
    }

    setIsEnhancing(true);
    setProcessingStatus("enhancing");

    try {
      const { data, error } = await supabase.functions.invoke("yt-enhance-longform", {
        body: { job_id: jobId, transcript }
      });

      if (error) throw error;

      if (data.enhancements) {
        setEnhancementData(data.enhancements);
        toast.success("Enhancement analysis complete!");
      }
    } catch (err) {
      console.error("Enhancement failed:", err);
      toast.error("Failed to generate enhancements");
    } finally {
      setIsEnhancing(false);
      setProcessingStatus("complete");
    }
  }, [jobId, transcript]);

  const reset = useCallback(() => {
    setVideoUrl("");
    setUploadedFile(null);
    setIsAnalyzing(false);
    setIsAnalyzed(false);
    setSelectedScene(null);
    setSelectedShort(null);
    setJobId(null);
    setProcessingStatus("idle");
    setTranscript(null);
    setEnhancementData(null);
    setIsEnhancing(false);
  }, []);

  return {
    videoUrl,
    setVideoUrl,
    uploadedFile,
    setUploadedFile,
    isAnalyzing,
    isAnalyzed,
    analyze,
    uploadAndAnalyze,
    reset,
    analysis,
    demoScenes,
    shorts,
    selectedScene,
    setSelectedScene,
    selectedShort,
    setSelectedShort,
    jobId,
    processingStatus,
    transcript,
    enhancementData,
    isEnhancing,
    generateEnhancements,
  };
}
