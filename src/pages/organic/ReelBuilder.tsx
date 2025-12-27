import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Wand2,
  Music,
  Type,
  Sparkles,
  GripVertical,
  Trash2,
  Clock,
  Zap,
  Palette,
  Layers,
  Scissors,
  Loader2,
  Brain,
  Download,
  ChevronDown,
  Upload,
  Video,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { SceneBlueprint, validateBlueprint, createTestBlueprint } from "@/types/SceneBlueprint";
import { cn } from "@/lib/utils";
import { useReelBeatSync } from "@/hooks/useReelBeatSync";
import { useReelCaptions, CaptionStyle } from "@/hooks/useReelCaptions";
import { useReelOverlays, BrandPackId } from "@/hooks/useReelOverlays";
import { useEditorBrain } from "@/hooks/useEditorBrain";
import { useSmartAssist } from "@/hooks/useSmartAssist";
import { useAutoCreateReel, DaraFormatType } from "@/hooks/useAutoCreateReel";
import { useMightyEdit, RenderProgress } from "@/hooks/useMightyEdit";
import { RenderProgressBar } from "@/components/mighty-edit/RenderProgressBar";
import { BeatSyncPanel } from "@/components/reel/BeatSyncPanel";
import { CaptionsPanel } from "@/components/reel/CaptionsPanel";
import { BrandOverlayPanel } from "@/components/reel/BrandOverlayPanel";
import { SmartAssistPanel } from "@/components/reel-builder/SmartAssistPanel";
import { DaraFormatSelector } from "@/components/reel-builder/DaraFormatSelector";
import { MediaLibraryModal } from "@/components/media/MediaLibraryModal";
import { PostRenderModal } from "@/components/reel-builder/PostRenderModal";
import { ContentMetadataPanel, useContentMetadata, ContentMetadata } from "@/components/content/ContentMetadataPanel";
import { MediaFile } from "@/components/media/MediaLibrary";
import { DARA_FORMATS, DaraFormat } from "@/lib/dara-denney-formats";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Clip {
  id: string;
  name: string;
  url: string;
  duration: number;
  thumbnail?: string;
  trimStart: number;
  trimEnd: number;
  speed?: number;
  hookScore?: number;
  energyLevel?: number;
  suggestedOverlay?: string;
  reason?: string;
}

interface AutoCreateState {
  autoCreatedClips?: Array<{
    id: string;
    order: number;
    trim_start: number;
    trim_end: number;
    reason?: string;
    suggested_overlay?: string;
    file_url?: string;
    thumbnail_url?: string;
    original_filename?: string;
    duration_seconds?: number;
  }>;
  reelConcept?: string;
  suggestedHook?: string;
  suggestedCta?: string;
  musicVibe?: string;
  autoRunSmartAssist?: boolean;
}

export default function ReelBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const autoCreateState = location.state as AutoCreateState | undefined;

  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("clip");
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [reelConcept, setReelConcept] = useState<string | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [showPostRenderModal, setShowPostRenderModal] = useState(false);
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null);
  const [extractedInspoStyle, setExtractedInspoStyle] = useState<any>(null);
  const [suggestedHook, setSuggestedHook] = useState<string | null>(null);
  const [suggestedCta, setSuggestedCta] = useState<string | null>(null);
  const [selectedDaraFormat, setSelectedDaraFormat] = useState<DaraFormat | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [contentMetadata, setContentMetadata] = useContentMetadata("wpw");
  
  // ============ SCENE BLUEPRINT AUTHORITY ============
  // This is the ONLY object that controls rendering.
  // If this is null, NOTHING renders. Period.
  const [sceneBlueprint, setSceneBlueprint] = useState<SceneBlueprint | null>(null);
  const [blueprintValidation, setBlueprintValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: false, errors: ['No blueprint created yet'] });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadVideoRef = useRef<HTMLVideoElement>(null);

  const beatSync = useReelBeatSync();
  const captionsEngine = useReelCaptions();
  const overlaysEngine = useReelOverlays();
  const editorBrain = useEditorBrain();
  const smartAssist = useSmartAssist();
  const { executeEdits, renderProgress, isExecuting, stopPolling } = useMightyEdit();
  const [isRenderingReel, setIsRenderingReel] = useState(false);
  const autoCreateReel = useAutoCreateReel();

  // Validate blueprint whenever it changes
  useEffect(() => {
    const validation = validateBlueprint(sceneBlueprint);
    setBlueprintValidation(validation);
    if (sceneBlueprint) {
      console.log('[ReelBuilder] Blueprint updated:', sceneBlueprint);
      console.log('[ReelBuilder] Blueprint validation:', validation);
    }
  }, [sceneBlueprint]);

  // Generate test blueprint from clips (for verification)
  const handleCreateTestBlueprint = useCallback(() => {
    if (clips.length === 0) {
      toast.error('Add clips first to create a test blueprint');
      return;
    }
    
    const testBlueprint = createTestBlueprint(
      clips.map(c => ({ id: c.id, url: c.url, duration: c.duration }))
    );
    setSceneBlueprint(testBlueprint);
    toast.success('Test blueprint created!', {
      description: `${testBlueprint.scenes.length} scenes, ${testBlueprint.totalDuration.toFixed(1)}s total`,
    });
  }, [clips]);

  // Single video upload handler - uploads video, then AI analyzes and finds best scenes
  const handleVideoUpload = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Uploading video...");

    try {
      // Upload to Supabase storage
      const fileName = `reel-source-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(`uploads/${fileName}`, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media-library')
        .getPublicUrl(`uploads/${fileName}`);

      const videoUrl = urlData.publicUrl;
      setUploadedVideoUrl(videoUrl);

      // Get video duration
      const videoDuration = await new Promise<number>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
        video.onerror = () => resolve(60); // Default 60s if can't read
        video.src = videoUrl;
      });

      toast.success("Video uploaded! AI analyzing...");
      setIsAutoProcessing(true);

      // Call AI to analyze this single video and find best scenes
      const result = await autoCreateReel.autoCreate({
        videoUrl: videoUrl,
        videoDuration: videoDuration,
        daraFormat: selectedDaraFormat as DaraFormatType | undefined,
      });

      if (result && result.selected_videos && result.selected_videos.length > 0) {
        // Convert AI scene cuts into clips (all from same source video)
        const newClips: Clip[] = result.selected_videos
          .sort((a, b) => a.order - b.order)
          .map((scene) => ({
            id: scene.id,
            name: scene.reason || `Scene ${scene.order}`,
            url: videoUrl, // All clips use the same source video
            duration: (scene.trim_end || 5) - (scene.trim_start || 0),
            trimStart: scene.trim_start || 0,
            trimEnd: scene.trim_end || 5,
            speed: 1,
            suggestedOverlay: scene.suggested_overlay,
            reason: scene.reason,
          }));

        setClips(newClips);
        setReelConcept(result.reel_concept);
        setSuggestedHook(result.suggested_hook);
        setSuggestedCta(result.suggested_cta);

        // Apply hook overlay
        if (result.suggested_hook) {
          overlaysEngine.addOverlay({
            text: result.suggested_hook,
            style: "modern",
            position: "top-center",
            start: 0,
            end: 3,
            color: "#E1306C",
          });
        }

        toast.success(`AI found ${newClips.length} best scenes!`, {
          description: result.reel_concept,
        });
      } else {
        toast.error("AI couldn't find good scenes. Try a different video.");
      }
    } catch (error) {
      console.error("Upload/analysis failed:", error);
      toast.error("Failed to process video");
    } finally {
      setIsUploading(false);
      setIsAutoProcessing(false);
    }
  }, [selectedDaraFormat, autoCreateReel, overlaysEngine]);

  // Dropzone for single video upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleVideoUpload,
    accept: { 'video/*': ['.mp4', '.mov', '.webm', '.avi'] },
    maxFiles: 1,
    disabled: isUploading || isAutoProcessing,
  });

  // AI Auto-Create handler - uses inspo styles, format, and picks best videos
  const handleAIAutoCreate = async (format?: DaraFormat) => {
    const useFormat = format || selectedDaraFormat;
    setIsAutoProcessing(true);
    const result = await autoCreateReel.autoCreate({
      maxVideos: 50,
      daraFormat: useFormat as DaraFormatType | undefined,
    });
    
    if (result && result.selected_videos && result.selected_videos.length > 0) {
      // Load the AI-selected clips directly
      const newClips: Clip[] = result.selected_videos
        .sort((a, b) => a.order - b.order)
        .map((video) => ({
          id: video.id,
          name: video.original_filename || `Clip ${video.order}`,
          url: video.file_url || "",
          duration: video.duration_seconds || 10,
          thumbnail: video.thumbnail_url,
          trimStart: video.trim_start || 0,
          trimEnd: video.trim_end || (video.duration_seconds || 10),
          speed: 1,
          suggestedOverlay: video.suggested_overlay,
          reason: video.reason,
        }));

      setClips(newClips);
      setReelConcept(result.reel_concept);
      setSuggestedHook(result.suggested_hook);
      setSuggestedCta(result.suggested_cta);
      
      // Store extracted visual style for rendering
      if (result.extracted_style) {
        setExtractedInspoStyle(result.extracted_style);
        console.log("Using inspo style:", result.extracted_style);
      }

      // Apply the suggested hook as overlay with inspo colors
      if (result.suggested_hook) {
        overlaysEngine.addOverlay({
          text: result.suggested_hook,
          style: "modern",
          position: "top-center",
          start: 0,
          end: 3,
          color: result.extracted_style?.text_color || "#E1306C",
        });
      }

      const formatInfo = useFormat ? DARA_FORMATS[useFormat] : null;
      toast.success(`AI created reel with ${newClips.length} clips!`, {
        description: `${result.reel_concept}${formatInfo ? ` • ${formatInfo.emoji} ${formatInfo.name}` : ''}${result.extracted_style ? ' • Style matched!' : ''}`,
      });
    }
    setIsAutoProcessing(false);
  };

  // Handle play/pause with ref
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Auto-save when render succeeds via renderProgress
  useEffect(() => {
    const saveRenderedVideo = async () => {
      if (renderProgress?.status === 'complete' && renderProgress.outputUrl) {
        try {
          // Save to content_files (Media Library)
          const { data: fileData, error: fileError } = await supabase
            .from('content_files')
            .insert({
              file_url: renderProgress.outputUrl,
              file_type: 'video',
              source: 'ai_reel_builder',
              brand: contentMetadata.brand,
              tags: ['ai-created', 'reel', 'auto-generated'],
              original_filename: `AI-Reel-${Date.now()}.mp4`,
              ai_labels: {
                concept: reelConcept,
                clips_used: clips.length,
                hook: autoCreateState?.suggestedHook,
                cta: autoCreateState?.suggestedCta,
              },
            })
            .select()
            .single();

          if (fileError) throw fileError;

          // Save to content_queue (for scheduling/review) with metadata
          const { error: queueError } = await supabase
            .from('content_queue')
            .insert({
              content_type: 'reel',
              status: 'draft',
              output_url: renderProgress.outputUrl,
              caption: autoCreateState?.suggestedHook || reelConcept,
              brand: contentMetadata.brand,
              channel: contentMetadata.channel,
              content_purpose: contentMetadata.contentPurpose,
              platform: contentMetadata.platform,
              ad_placement: contentMetadata.adPlacement,
              ai_metadata: {
                concept: reelConcept,
                clips_used: clips.map(c => c.id),
                generated_at: new Date().toISOString(),
              },
              mode: 'auto',
            });

          if (queueError) throw queueError;

          setSavedVideoUrl(renderProgress.outputUrl);
          setShowPostRenderModal(true);
          toast.success('Reel saved to library and queue!');
        } catch (error) {
          console.error('Failed to save rendered video:', error);
          toast.error('Render complete but failed to save');
        }
      }
    };

    saveRenderedVideo();
  }, [renderProgress?.status, renderProgress?.outputUrl, contentMetadata]);

  // Handle render reel - REQUIRES SCENE BLUEPRINT (Authority enforced)
  const handleRenderReel = async () => {
    // ============ AUTHORITY CHECK ============
    // If no blueprint exists, REFUSE TO RENDER
    if (!sceneBlueprint) {
      toast.error('Cannot render without Scene Blueprint', {
        description: 'Create a blueprint first using "Create Test Blueprint" or AI generation.',
      });
      console.error('[ReelBuilder] BLOCKED: Render attempted without blueprint');
      return;
    }

    const validation = validateBlueprint(sceneBlueprint);
    if (!validation.valid) {
      toast.error('Blueprint validation failed', {
        description: validation.errors.join(', '),
      });
      console.error('[ReelBuilder] BLOCKED: Invalid blueprint', validation.errors);
      return;
    }

    console.log('[ReelBuilder] ✅ Rendering with AUTHORITATIVE BLUEPRINT:', sceneBlueprint);

    if (clips.length === 0) {
      toast.error('Add clips first');
      return;
    }

    setIsRenderingReel(true);

    try {
      // Collect all clip URLs from BLUEPRINT (not from clips state)
      const clipUrls = sceneBlueprint.scenes.map(s => s.clipUrl).filter(Boolean);
      if (clipUrls.length === 0) {
        toast.error('No video URLs in blueprint');
        setIsRenderingReel(false);
        return;
      }

      // Build overlays FROM BLUEPRINT (not from clips state)
      const allOverlays = sceneBlueprint.scenes
        .filter(scene => scene.text)
        .map((scene, idx) => {
          // Calculate timestamp based on scene order
          const timestamp = sceneBlueprint.scenes
            .slice(0, idx)
            .reduce((acc, s) => acc + (s.end - s.start), 0);
          return {
            text: scene.text!,
            timestamp: `${timestamp}s`,
            style: 'bold' as const,
            duration: 2,
            position: scene.textPosition || 'center',
            animation: scene.animation || 'pop',
          };
        });

      // First create a content_files entry for the primary clip
      const primaryClipUrl = clipUrls[0];
      const { data: contentFile, error: cfError } = await supabase
        .from('content_files')
        .insert({
          file_url: primaryClipUrl,
          file_type: 'video',
          source: 'reel_builder',
          original_filename: 'ReelBuilder Upload',
        })
        .select('id')
        .single();

      if (cfError) {
        console.error('[ReelBuilder] Failed to create content file:', cfError);
        toast.error('Failed to prepare video for rendering');
        setIsRenderingReel(false);
        return;
      }

      // Create video_edit_queue entry with BLUEPRINT as the authoritative source
      const { data: queueEntry, error: queueError } = await supabase
        .from('video_edit_queue')
        .insert({
          content_file_id: contentFile.id,
          source_url: primaryClipUrl,
          title: reelConcept || 'Reel Builder Export',
          text_overlays: allOverlays,
          selected_music_url: audioUrl,
          // AUTHORITY: Scene blueprint IS the edit plan
          ai_edit_suggestions: {
            blueprint_id: sceneBlueprint.id,
            blueprint_source: sceneBlueprint.source,
            scenes: sceneBlueprint.scenes.map((scene, i) => ({
              order: i + 1,
              scene_id: scene.sceneId,
              clip_id: scene.clipId,
              clip_url: scene.clipUrl,
              start_time: scene.start,
              end_time: scene.end,
              purpose: scene.purpose,
              label: scene.purpose,
              text: scene.text,
              text_position: scene.textPosition,
              animation: scene.animation,
              cut_reason: scene.cutReason,
            })),
            end_card: sceneBlueprint.endCard,
            hook: sceneBlueprint.scenes.find(s => s.purpose === 'hook')?.text,
            cta: sceneBlueprint.endCard?.cta || sceneBlueprint.scenes.find(s => s.purpose === 'cta')?.text,
          },
          render_status: 'pending',
          status: 'ready_for_review',
        })
        .select('id')
        .single();

      if (queueError) {
        console.error('[ReelBuilder] Failed to create queue entry:', queueError);
        toast.error('Failed to start render');
        setIsRenderingReel(false);
        return;
      }

      console.log('[ReelBuilder] ✅ Created queue entry with BLUEPRINT:', queueEntry.id, sceneBlueprint.id);
      toast.success('Render started!', { description: `Blueprint: ${sceneBlueprint.id}` });

      // Call executeEdits with the queue ID
      await executeEdits(queueEntry.id, 'full');
      
    } catch (err) {
      console.error('[ReelBuilder] Render failed:', err);
      toast.error('Render failed', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      });
    } finally {
      setIsRenderingReel(false);
    }
  };

  const handleDownloadVideo = () => {
    if (savedVideoUrl) {
      window.open(savedVideoUrl, '_blank');
    }
  };

  const handleViewInLibrary = () => {
    setShowPostRenderModal(false);
    navigate('/contentbox');
  };

  const handleSchedule = () => {
    setShowPostRenderModal(false);
    navigate('/content-schedule');
  };

  const handleSendToReview = () => {
    setShowPostRenderModal(false);
    navigate('/content-schedule');
    toast.success('Video ready for review in Content Schedule');
  };

  // Handle auto-created clips from ContentBox - FULL AUTO PROCESSING
  useEffect(() => {
    const runAutoProcess = async () => {
      if (!autoCreateState?.autoCreatedClips || autoCreateState.autoCreatedClips.length === 0) {
        return;
      }

      setIsAutoProcessing(true);

      // Step 1: Load clips with AI-suggested trims already applied
      const newClips: Clip[] = autoCreateState.autoCreatedClips
        .sort((a, b) => a.order - b.order)
        .map((ac) => ({
          id: ac.id,
          name: ac.original_filename || `Clip ${ac.order}`,
          url: ac.file_url || "",
          duration: ac.duration_seconds || 10,
          thumbnail: ac.thumbnail_url,
          trimStart: ac.trim_start || 0,
          trimEnd: ac.trim_end || (ac.duration_seconds || 10),
          speed: 1,
          suggestedOverlay: ac.suggested_overlay,
          reason: ac.reason,
        }));

      setClips(newClips);
      setReelConcept(autoCreateState.reelConcept || null);

      toast.success(`AI editing ${newClips.length} clips...`, {
        description: autoCreateState.reelConcept,
      });

      // Step 2: Run Smart Assist to analyze and create creative plan
      if (autoCreateState.autoRunSmartAssist && newClips.length > 0) {
        const result = await smartAssist.runSmartAssist(newClips);

        // Step 3: Auto-apply the AI plan
        if (result?.creative?.sequence) {
          const editedClips: Clip[] = result.creative.sequence.map((seq, idx) => {
            const originalClip = newClips[idx] || newClips[0];
            return {
              ...originalClip,
              id: originalClip?.id || `ai_${idx}`,
              name: seq.label?.replace(/_/g, " ") || originalClip.name,
              url: originalClip?.url || newClips[0].url,
              duration: seq.end - seq.start,
              trimStart: seq.start,
              trimEnd: seq.end,
              speed: seq.speed || 1,
            };
          });

          setClips(editedClips);
          
          // Step 4: Apply brand overlays if available
          if (autoCreateState.suggestedHook) {
            overlaysEngine.addOverlay({
              text: autoCreateState.suggestedHook,
              style: "modern",
              position: "top-center",
              start: 0,
              end: 3,
              color: "#E1306C",
            });
          }

          toast.success("AI Reel Created!", {
            description: `${editedClips.length} clips edited and ready to render`,
          });
        }
      }

      setIsAutoProcessing(false);
      // Clear location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    };

    runAutoProcess();
  }, [autoCreateState]);

  const handleRunSmartAssist = async () => {
    await smartAssist.runSmartAssist(clips);
  };

  const handleApplyAIPlan = () => {
    if (!smartAssist.creative) return;

    const newClips: Clip[] = smartAssist.creative.sequence.map((seq, idx) => {
      const originalClip = clips[idx] || clips[0];
      return {
        ...originalClip,
        id: originalClip?.id || `ai_${idx}`,
        name: seq.label?.replace(/_/g, " ") || `Scene ${idx + 1}`,
        url: originalClip?.url || clips[0].url,
        duration: seq.end - seq.start,
        trimStart: seq.start,
        trimEnd: seq.end,
        speed: seq.speed || 1,
      };
    });

    setClips(newClips);
    toast.success("AI Timeline Applied!");
  };

  const handleAddClipsFromLibrary = (files: MediaFile[]) => {
    const videoFiles = files.filter((f) => f.file_type === "video");
    const newClips: Clip[] = videoFiles.map((file) => ({
      id: file.id,
      name: file.original_filename || "Untitled",
      url: file.file_url,
      duration: file.duration_seconds || 10,
      thumbnail: file.thumbnail_url || undefined,
      trimStart: 0,
      trimEnd: file.duration_seconds || 10,
      speed: 1,
    }));
    setClips((prev) => [...prev, ...newClips]);
    toast.success(`Added ${newClips.length} clip(s)`);
  };

  const handleRemoveClip = (id: string) => {
    setClips(clips.filter((c) => c.id !== id));
    if (selectedClip === id) setSelectedClip(null);
  };

  const handleAnalyzeBeats = async () => {
    if (!audioUrl) return;
    const result = await beatSync.analyzeMusic(audioUrl);
    if (result) {
      toast.success(`Detected ${result.bpm} BPM with ${result.beats.length} beats`);
    }
  };

  const handleApplyBeatSync = () => {
    const syncedClips = beatSync.applyBeatSync(clips);
    setClips(syncedClips as Clip[]);
    toast.success("Beat sync applied to clips!");
  };

  const handleGenerateCaptions = async (style: CaptionStyle) => {
    const captions = await captionsEngine.generateCaptions("", style);
    if (captions.length > 0) {
      toast.success(`Generated ${captions.length} captions`);
    }
  };

  const handleApplyBrandPack = (packId: BrandPackId) => {
    overlaysEngine.applyBrandPack(packId, totalDuration);
    toast.success(`Applied ${packId.toUpperCase()} overlay pack`);
  };

  const totalDuration = clips.reduce(
    (acc, clip) => acc + (clip.trimEnd - clip.trimStart) / (clip.speed || 1),
    0
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* AI Processing Overlay */}
      {(isAutoProcessing || smartAssist.loading) && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
              <Loader2 className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">AI Creating Your Reel</h2>
              <p className="text-muted-foreground mt-1">
                Analyzing clips • Choosing best scenes • Editing timeline
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organic")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Multi-Clip Reel Builder</h1>
              <p className="text-xs text-muted-foreground">
                {clips.length} clips • {totalDuration.toFixed(1)}s total
                {reelConcept && <span className="ml-2 text-primary">• {reelConcept}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Content Metadata Toggle */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMetadataOpen(!metadataOpen)}
              className={metadataOpen ? "bg-primary/10 border-primary/40" : ""}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              {contentMetadata.brand.toUpperCase()} • {contentMetadata.contentPurpose === 'paid' ? '💰' : '🌱'}
            </Button>
            
            {/* Dara Format Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[140px]">
                  {selectedDaraFormat ? (
                    <>
                      {DARA_FORMATS[selectedDaraFormat].emoji} {DARA_FORMATS[selectedDaraFormat].name}
                    </>
                  ) : (
                    "Select Format"
                  )}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setSelectedDaraFormat(null)}>
                  <span className="text-muted-foreground">Auto (AI Chooses)</span>
                </DropdownMenuItem>
                {Object.values(DARA_FORMATS).map((format) => (
                  <DropdownMenuItem 
                    key={format.id} 
                    onClick={() => setSelectedDaraFormat(format.id)}
                    className={selectedDaraFormat === format.id ? "bg-primary/10" : ""}
                  >
                    <span className="mr-2">{format.emoji}</span>
                    {format.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Auto-Create - The main action button */}
            <Button 
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => handleAIAutoCreate()}
              disabled={autoCreateReel.loading || isAutoProcessing}
            >
              {autoCreateReel.loading || isAutoProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  AI Auto-Create
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => editorBrain.extractBestScenes(clips, setClips)}
              disabled={clips.length === 0 || editorBrain.isAnalyzing}
            >
              <Scissors className="w-4 h-4 mr-1.5" />
              Best Scenes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => editorBrain.autoSequence(clips, setClips)}
              disabled={clips.length < 2 || editorBrain.isSequencing}
            >
              {editorBrain.isSequencing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Layers className="w-4 h-4 mr-1.5" />
              )}
              AI Sequence
            </Button>
            
            {/* Test Blueprint Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTestBlueprint}
              disabled={clips.length === 0}
              className={sceneBlueprint ? "border-green-500/50 bg-green-500/10" : ""}
            >
              {sceneBlueprint ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
                  Blueprint Ready
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
                  Create Test Blueprint
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
              disabled={clips.length === 0 || isRenderingReel || isExecuting || !sceneBlueprint}
              onClick={handleRenderReel}
              title={!sceneBlueprint ? "Create a blueprint first" : "Render with blueprint"}
            >
              {isRenderingReel || isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Rendering...
                </>
              ) : (
                'Render Reel'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Metadata Panel (Collapsible) */}
      {metadataOpen && (
        <div className="max-w-7xl mx-auto px-4 py-3 border-b border-border/30 bg-card/30">
          <ContentMetadataPanel 
            metadata={contentMetadata} 
            onChange={setContentMetadata}
          />
        </div>
      )}

      {/* SCENE BLUEPRINT STATUS PANEL */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Alert variant={blueprintValidation.valid ? "default" : "destructive"} className="border-l-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {blueprintValidation.valid ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <div>
                <AlertTitle className="text-sm font-semibold">
                  {blueprintValidation.valid ? 'Blueprint Ready' : 'No Blueprint - Cannot Render'}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  {blueprintValidation.valid 
                    ? `${sceneBlueprint?.scenes.length} scenes • ${sceneBlueprint?.totalDuration.toFixed(1)}s • Source: ${sceneBlueprint?.source}`
                    : blueprintValidation.errors.join(' • ')
                  }
                </AlertDescription>
              </div>
            </div>
            {sceneBlueprint && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  console.log('[ReelBuilder] Current Blueprint:', JSON.stringify(sceneBlueprint, null, 2));
                  toast.info('Blueprint logged to console');
                }}
              >
                View JSON
              </Button>
            )}
          </div>
        </Alert>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Preview + Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {/* Empty State - AI Auto-Create from Library (Primary) */}
            {clips.length === 0 && (
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
                <CardContent className="p-8">
                  {isAutoProcessing ? (
                    <div className="aspect-[9/16] max-h-[500px] mx-auto rounded-xl flex flex-col items-center justify-center bg-background/50">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
                          <Loader2 className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                        </div>
                        <div>
                          <p className="font-bold text-xl text-foreground">AI Creating Your Reel</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Scanning your library • Selecting best clips • Learning your style
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] max-h-[500px] mx-auto rounded-xl flex flex-col items-center justify-center bg-background/30">
                      <div className="text-center space-y-6 max-w-sm">
                        {/* Primary Action - AI Create from Library */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                          <Brain className="w-12 h-12 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-foreground">AI Auto-Create</h3>
                          <p className="text-muted-foreground mt-2">
                            AI will scan your uploaded videos, pick the best clips, and create a scroll-stopping reel
                          </p>
                        </div>
                        
                        {/* Format Selection */}
                        <div className="space-y-2">
                          <DaraFormatSelector 
                            value={selectedDaraFormat} 
                            onChange={setSelectedDaraFormat}
                          />
                        </div>

                        {/* Main CTA */}
                        <Button 
                          size="lg"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
                          onClick={() => handleAIAutoCreate()}
                          disabled={autoCreateReel.loading}
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Create Reel from My Library
                        </Button>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>Powered by Dara Denney AI + Your Inspiration</span>
                        </div>

                        {/* Divider */}
                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">or</span>
                          </div>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setShowLibraryModal(true)}
                          >
                            <Video className="w-4 h-4 mr-1.5" />
                            Pick Clips
                          </Button>
                          <div {...getRootProps()} className="flex-1">
                            <input {...getInputProps()} />
                            <Button variant="outline" className="w-full" disabled={isUploading}>
                              <Upload className="w-4 h-4 mr-1.5" />
                              Upload New
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview - Shows when clips exist */}
            {clips.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="aspect-[9/16] max-h-[400px] mx-auto bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                    <video
                      ref={videoRef}
                      key={selectedClip || clips[0]?.id}
                      src={selectedClip ? clips.find(c => c.id === selectedClip)?.url : clips[0]?.url}
                      className="absolute inset-0 w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                      onEnded={() => setIsPlaying(false)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute z-10"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timeline
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowLibraryModal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Clips
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clips.length === 0 ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowLibraryModal(true)}
                  >
                    <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to add clips</p>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {clips.map((clip, index) => (
                      <div
                        key={clip.id}
                        className={cn(
                          "shrink-0 w-32 rounded-lg border-2 cursor-pointer transition-all",
                          selectedClip === clip.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedClip(clip.id)}
                      >
                        <div className="aspect-video bg-muted rounded-t-md flex items-center justify-center relative group overflow-hidden">
                          {clip.thumbnail ? (
                            <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : clip.url ? (
                            <video src={clip.url} className="w-full h-full object-cover" muted />
                          ) : (
                            <span className="text-lg font-bold text-primary">{index + 1}</span>
                          )}
                          <GripVertical className="w-4 h-4 text-white drop-shadow absolute top-1 left-1 opacity-0 group-hover:opacity-100" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="w-5 h-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveClip(clip.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {/* Show suggested overlay text */}
                          {clip.suggestedOverlay && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                              <p className="text-[8px] text-white font-bold leading-tight truncate">
                                {clip.suggestedOverlay}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="p-1.5">
                          <p className="text-[10px] font-medium truncate">{clip.name}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {(clip.trimEnd - clip.trimStart).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Assist Panel */}
            <SmartAssistPanel
              analysis={smartAssist.analysis}
              creative={smartAssist.creative}
              loading={smartAssist.loading}
              onRunAnalysis={handleRunSmartAssist}
              onApply={handleApplyAIPlan}
              hasClips={clips.length > 0}
            />
          </div>

          {/* Right: Editor Panels */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="ai" className="text-xs"><Brain className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="clip" className="text-xs"><Wand2 className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="audio" className="text-xs"><Music className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="captions" className="text-xs"><Type className="w-3 h-3" /></TabsTrigger>
                <TabsTrigger value="overlays" className="text-xs"><Palette className="w-3 h-3" /></TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="mt-4">
                <SmartAssistPanel
                  analysis={smartAssist.analysis}
                  creative={smartAssist.creative}
                  loading={smartAssist.loading}
                  onRunAnalysis={handleRunSmartAssist}
                  onApply={handleApplyAIPlan}
                  hasClips={clips.length > 0}
                />
              </TabsContent>

              <TabsContent value="clip" className="mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">{selectedClip ? "Edit Clip" : "Select Clip"}</CardTitle></CardHeader>
                  <CardContent>
                    {selectedClip ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground">Speed</label>
                          <div className="flex gap-2 mt-1">
                            {["0.5x", "1x", "1.5x", "2x"].map((speed) => (
                              <Button key={speed} size="sm" variant={speed === "1x" ? "default" : "outline"} className="flex-1">{speed}</Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Select a clip to edit</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audio" className="mt-4">
                <BeatSyncPanel audioUrl={audioUrl} beats={beatSync.beats} bpm={beatSync.bpm} loading={beatSync.loading} onSelectAudio={() => setAudioUrl("https://example.com/audio.mp3")} onAnalyze={handleAnalyzeBeats} onApplyBeatSync={handleApplyBeatSync} />
              </TabsContent>

              <TabsContent value="captions" className="mt-4">
                <CaptionsPanel captions={captionsEngine.captions} settings={captionsEngine.settings} loading={captionsEngine.loading} onGenerateCaptions={handleGenerateCaptions} onUpdateSettings={captionsEngine.updateSettings} onRemoveCaption={captionsEngine.removeCaption} />
              </TabsContent>

              <TabsContent value="overlays" className="mt-4">
                <BrandOverlayPanel overlays={overlaysEngine.overlays} activePack={overlaysEngine.activePack} totalDuration={totalDuration} onApplyPack={handleApplyBrandPack} onAddOverlay={() => overlaysEngine.addOverlay({ text: "Custom", style: "modern", position: "center", start: 0, end: 3, color: "#E1306C" })} onRemoveOverlay={overlaysEngine.removeOverlay} onClearOverlays={overlaysEngine.clearOverlays} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        multiSelect
        onMultiSelect={handleAddClipsFromLibrary}
        filterType="video"
      />

      {/* Post-Render Modal */}
      <PostRenderModal
        open={showPostRenderModal}
        onClose={() => setShowPostRenderModal(false)}
        videoUrl={savedVideoUrl || ''}
        onDownload={handleDownloadVideo}
        onViewInLibrary={handleViewInLibrary}
        onSchedule={handleSchedule}
        onSendToReview={handleSendToReview}
      />

      {/* Render Progress Bar - Shows during Mux rendering */}
      {renderProgress && (
        <div className="fixed bottom-4 right-4 z-50 w-96">
          <RenderProgressBar 
            progress={renderProgress}
            onDismiss={stopPolling}
          />
        </div>
      )}
    </div>
  );
}
