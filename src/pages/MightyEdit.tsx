import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Scan, 
  Music, 
  Play, 
  Download, 
  CheckCircle, 
  Clock, 
  Film,
  Wand2,
  RefreshCw,
  Scissors,
  Type
} from "lucide-react";
import { useMightyEdit, VideoEditItem } from "@/hooks/useMightyEdit";
import { VideoEditCard } from "@/components/mighty-edit/VideoEditCard";
import { MusicMatcher } from "@/components/mighty-edit/MusicMatcher";
import { RenderQueue } from "@/components/mighty-edit/RenderQueue";
import { ClipPreview } from "@/components/mighty-edit/ClipPreview";
import { RenderResult } from "@/components/mighty-edit/RenderResult";

interface ContentFactoryPreset {
  action?: string;
  content_type?: string;
  platform?: string;
  hook?: string;
  cta?: string;
  overlays?: Array<{ text: string; start: number; duration: number }>;
  caption?: string;
  hashtags?: string;
  attached_assets?: Array<{ url: string; type: string; name: string }>;
  claimed_asset_id?: string;
}

export default function MightyEdit() {
  const location = useLocation();
  const {
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
  } = useMightyEdit();

  const [activeTab, setActiveTab] = useState("scanner");
  const [selectedVideo, setSelectedVideo] = useState<VideoEditItem | null>(null);
  const [presetApplied, setPresetApplied] = useState(false);

  // Helper: Ensure video exists in video_edit_queue before executing edits
  const ensureVideoInQueue = async (video: VideoEditItem): Promise<string | null> => {
    // First check if it already exists in queue by source_url (more reliable than ID)
    const { data: existingByUrl } = await supabase
      .from('video_edit_queue')
      .select('id')
      .eq('source_url', video.source_url)
      .maybeSingle();
    
    if (existingByUrl) {
      console.log('[MightyEdit] Video already in queue by URL:', existingByUrl.id);
      return existingByUrl.id;
    }

    // Also check by ID in case it's a real DB record
    const { data: existingById } = await supabase
      .from('video_edit_queue')
      .select('id')
      .eq('id', video.id)
      .maybeSingle();
    
    if (existingById) {
      console.log('[MightyEdit] Video already in queue by ID:', existingById.id);
      return existingById.id;
    }

    console.log('[MightyEdit] Inserting new video into queue...');
    
    // First, create/resolve a valid content_files record for this video (video_edit_queue has an FK)
    let contentFileId: string | null = null;

    // If we were given a content_file_id, verify it exists in content_files before using it.
    if (video.content_file_id && !video.content_file_id.startsWith('preset-')) {
      const { data: existingContentFile, error: existingCfErr } = await supabase
        .from('content_files')
        .select('id')
        .eq('id', video.content_file_id)
        .maybeSingle();

      if (!existingCfErr && existingContentFile?.id) {
        contentFileId = existingContentFile.id;
      }
    }

    // If we still don't have a valid content file id, create one (common for Agent Chat uploads)
    if (!contentFileId && video.source_url) {
      const { data: contentFile, error: cfError } = await supabase
        .from('content_files')
        .insert({
          file_url: video.source_url,
          file_type: 'video',
          source: 'agent_chat',
          organization_id: video.organization_id,
          original_filename: video.title || 'Agent Upload',
        })
        .select('id')
        .single();

      if (cfError) {
        console.warn('[MightyEdit] Could not create content_files record, proceeding without:', cfError);
        // Proceed with content_file_id as null (FK allows null)
      } else {
        contentFileId = contentFile.id;
        console.log('[MightyEdit] Created content_files record:', contentFileId);
      }
    }

    // Insert the video into the queue with the real (or null) content_file_id
    const { data: inserted, error } = await supabase
      .from('video_edit_queue')
      .insert({
        organization_id: video.organization_id,
        content_file_id: contentFileId, // Use real ID or null
        source_url: video.source_url,
        transcript: video.transcript,
        duration_seconds: video.duration_seconds,
        ai_edit_suggestions: video.ai_edit_suggestions,
        text_overlays: video.text_overlays,
        selected_music_id: video.selected_music_id,
        selected_music_url: video.selected_music_url,
        render_status: 'pending',
        status: video.status || 'ready_for_review',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[MightyEdit] Failed to insert video into queue:', error);
      toast.error('Failed to prepare video for rendering');
      return null;
    }

    console.log('[MightyEdit] Inserted video into queue:', inserted.id);
    toast.success('Video ready for rendering');
    return inserted.id;
  };

  // Wrapper for executeEdits that ensures video is in queue first
  const handleExecuteEdits = async (renderType: "full" | "shorts" | "all") => {
    if (!selectedVideo) return;
    
    const queueId = await ensureVideoInQueue(selectedVideo);
    if (!queueId) {
      console.error('[MightyEdit] Could not ensure video in queue');
      return;
    }
    
    await executeEdits(queueId, renderType);
  };

  // Check for preset from Agent Chat (via sessionStorage)
  useEffect(() => {
    if (presetApplied) return;
    
    const storedPreset = sessionStorage.getItem('mightyedit_preset');
    if (storedPreset) {
      try {
        const preset: ContentFactoryPreset = JSON.parse(storedPreset);
        console.log('[MightyEdit] Loaded preset from sessionStorage:', preset);
        console.log('[MightyEdit] Preset overlays:', preset.overlays);
        
        // If preset has attached assets, create a video item from them
        if (preset.attached_assets && preset.attached_assets.length > 0) {
          const firstAsset = preset.attached_assets[0];
          
          // Map overlays from preset format to MightyEdit format
          const mappedOverlays = (preset.overlays || []).map((o) => {
            const mapped = {
              text: o.text,
              timestamp: `${o.start}s`,
              style: 'bold' as const,
              duration: o.duration,
            };
            console.log('[MightyEdit] Mapped overlay:', mapped);
            return mapped;
          });
          
          console.log('[MightyEdit] Total mapped overlays:', mappedOverlays.length);
          
          const videoFromPreset: VideoEditItem = {
            // This is a local-only placeholder; ensureVideoInQueue will create the DB row.
            id: preset.claimed_asset_id || `preset-${Date.now()}`,
            organization_id: null,
            content_file_id: null,
            title: firstAsset.name || 'Agent Upload',
            source_url: firstAsset.url,
            transcript: null,
            duration_seconds: null,
            ai_edit_suggestions: null,
            selected_music_id: null,
            selected_music_url: null,
            text_overlays: mappedOverlays,
            speed_ramps: [],
            chapters: [],
            shorts_extracted: [],
            final_render_url: null,
            render_status: 'pending',
            status: 'ready_for_review',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log('[MightyEdit] Auto-selecting video from preset with overlays:', videoFromPreset.text_overlays?.length);
          setSelectedVideo(videoFromPreset);
          setActiveTab("editor");
          setPresetApplied(true);
          
          // Clear the preset after use
          sessionStorage.removeItem('mightyedit_preset');
        }
      } catch (e) {
        console.error('[MightyEdit] Failed to parse preset:', e);
      }
    }
  }, [presetApplied]);

  // Fallback: If no preset and no selection, auto-select the most recent video asset
  useEffect(() => {
    async function loadFallbackVideo() {
      if (selectedVideo || presetApplied) return;
      
      // Check if we came from agent chat but have no selection yet
      const storedPreset = sessionStorage.getItem('mightyedit_preset');
      if (storedPreset) return; // Let the preset handler above take care of it
      
      // Fallback: load most recent video from contentbox_assets
      const { data: latestAsset, error } = await supabase
        .from('contentbox_assets')
        .select('*')
        .eq('asset_type', 'video')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestAsset && !error) {
        console.log('[MightyEdit] Fallback: auto-selecting latest asset:', latestAsset);
        const fallbackVideo: VideoEditItem = {
          id: latestAsset.id,
          organization_id: latestAsset.organization_id,
          content_file_id: latestAsset.id,
          title: latestAsset.original_name || 'Latest Video',
          source_url: latestAsset.file_url,
          transcript: null,
          duration_seconds: latestAsset.duration_seconds,
          ai_edit_suggestions: null,
          selected_music_id: null,
          selected_music_url: null,
          text_overlays: [],
          speed_ramps: [],
          chapters: [],
          shorts_extracted: [],
          final_render_url: null,
          render_status: 'pending',
          status: latestAsset.scan_status === 'ready' ? 'ready_for_review' : 'pending',
          created_at: latestAsset.created_at,
          updated_at: latestAsset.created_at,
        };
        setSelectedVideo(fallbackVideo);
        setActiveTab("editor");
      }
    }
    
    loadFallbackVideo();
  }, [selectedVideo, presetApplied]);

  useEffect(() => {
    fetchEditQueue();
  }, [fetchEditQueue]);

  const pendingCount = editQueue.filter(v => v.status === "pending").length;
  const readyCount = editQueue.filter(v => v.status === "ready_for_review").length;
  const renderingCount = editQueue.filter(v => v.status === "rendering").length;
  const completeCount = editQueue.filter(v => v.status === "complete").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              <span className="text-primary">Mighty</span>Edit
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered video editor - auto text overlays, music, and cuts
            </p>
          </div>
          <Button 
            onClick={() => scanContentLibrary({ scanAll: true })}
            disabled={isScanning}
            size="lg"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Scan All Videos
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Scan</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Wand2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{readyCount}</p>
                <p className="text-sm text-muted-foreground">Ready for Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Film className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{renderingCount}</p>
                <p className="text-sm text-muted-foreground">Rendering</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completeCount}</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="scanner" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Scan className="w-4 h-4 mr-2" />
              Content Scanner
            </TabsTrigger>
            <TabsTrigger value="editor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Wand2 className="w-4 h-4 mr-2" />
              AI Editor
            </TabsTrigger>
            <TabsTrigger value="music" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Music className="w-4 h-4 mr-2" />
              Music Matcher
            </TabsTrigger>
            <TabsTrigger value="render" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Film className="w-4 h-4 mr-2" />
              Render Queue
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="w-5 h-5 text-primary" />
                  Video Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editQueue.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Videos Scanned</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Scan All Videos" to analyze your content library for AI editing
                    </p>
                    <Button onClick={() => scanContentLibrary({ scanAll: true })} disabled={isScanning}>
                      <Scan className="w-4 h-4 mr-2" />
                      Start Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {editQueue.map((video) => (
                      <VideoEditCard 
                        key={video.id} 
                        video={video}
                        onSelect={() => {
                          setSelectedVideo(video);
                          setActiveTab("editor");
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            {selectedVideo ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" />
                      Editing: {selectedVideo.title}
                    </CardTitle>
                    <Button variant="outline" onClick={() => setSelectedVideo(null)}>
                      Back to List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Video Preview */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video 
                      src={selectedVideo.source_url} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* AI Edit Suggestions */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Text Overlays */}
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Text Overlays ({selectedVideo.text_overlays?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {(selectedVideo.text_overlays || []).map((overlay: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                            <div>
                              <p className="font-medium text-sm">{overlay.text}</p>
                              <p className="text-xs text-muted-foreground">
                                {overlay.timestamp} • {overlay.style}
                              </p>
                            </div>
                            <Badge variant="secondary">{overlay.duration}s</Badge>
                          </div>
                        ))}
                        {(!selectedVideo.text_overlays || selectedVideo.text_overlays.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No text overlays generated
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Chapters */}
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Scissors className="w-4 h-4" />
                          Chapters ({selectedVideo.chapters?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {(selectedVideo.chapters || []).map((chapter: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                            <p className="font-medium text-sm">{chapter.title}</p>
                            <Badge variant="outline">{chapter.time}</Badge>
                          </div>
                        ))}
                        {(!selectedVideo.chapters || selectedVideo.chapters.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No chapters detected
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Music Selection */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Background Music
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVideo.selected_music_url ? (
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded">
                              <Music className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Music Selected</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {selectedVideo.selected_music_url}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab("music")}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setActiveTab("music")}
                        >
                          <Music className="w-4 h-4 mr-2" />
                          Select Music
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Render Result - Show when video has been rendered */}
                  {selectedVideo.final_render_url && (
                    <RenderResult
                      renderUrl={selectedVideo.final_render_url}
                      status={selectedVideo.render_status}
                      title="Final Rendered Video"
                    />
                  )}

                  {/* Extracted Shorts/Clips Preview */}
                  {selectedVideo.shorts_extracted && selectedVideo.shorts_extracted.length > 0 && (
                    <ClipPreview
                      clips={selectedVideo.shorts_extracted}
                      title="Extracted Clips"
                    />
                  )}
                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap">
                    {/* Generate AI Suggestions - for videos that need scanning */}
                    {(!selectedVideo.ai_edit_suggestions && selectedVideo.text_overlays?.length === 0) && (
                      <Button 
                        variant="secondary"
                        size="lg"
                        onClick={() => scanContentLibrary({ contentFileId: selectedVideo.content_file_id || selectedVideo.id })}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate AI Suggestions
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Find Music */}
                    <Button 
                      variant="secondary"
                      size="lg"
                      onClick={() => matchMusic(selectedVideo.id, selectedVideo.transcript || undefined, selectedVideo.duration_seconds || undefined)}
                      disabled={isMatching}
                    >
                      {isMatching ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Finding Music...
                        </>
                      ) : (
                        <>
                          <Music className="w-4 h-4 mr-2" />
                          Find Music
                        </>
                      )}
                    </Button>
                    
                    {/* Render Full Video */}
                    <Button 
                      className="flex-1" 
                      size="lg"
                      onClick={() => handleExecuteEdits("full")}
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Rendering...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Render Full Video
                        </>
                      )}
                    </Button>
                    
                    {/* Extract Shorts */}
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleExecuteEdits("shorts")}
                      disabled={isExecuting}
                    >
                      <Scissors className="w-4 h-4 mr-2" />
                      Extract Shorts
                    </Button>
                    
                    {/* Export All */}
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => handleExecuteEdits("all")}
                      disabled={isExecuting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Wand2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Video Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a video from the Content Scanner to start editing
                  </p>
                  <Button onClick={() => setActiveTab("scanner")}>
                    Go to Scanner
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music">
            <MusicMatcher selectedVideo={selectedVideo} />
          </TabsContent>

          {/* Render Queue Tab */}
          <TabsContent value="render">
            <RenderQueue editQueue={editQueue.filter(v => v.status === "rendering" || v.status === "complete")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
