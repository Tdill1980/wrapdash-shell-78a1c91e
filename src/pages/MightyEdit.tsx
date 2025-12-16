import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function MightyEdit() {
  const {
    isScanning,
    editQueue,
    fetchEditQueue,
    scanContentLibrary,
  } = useMightyEdit();

  const [activeTab, setActiveTab] = useState("scanner");
  const [selectedVideo, setSelectedVideo] = useState<VideoEditItem | null>(null);

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

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button className="flex-1" size="lg">
                      <Play className="w-4 h-4 mr-2" />
                      Render Full Video
                    </Button>
                    <Button variant="outline" size="lg">
                      <Scissors className="w-4 h-4 mr-2" />
                      Extract Shorts
                    </Button>
                    <Button variant="outline" size="lg">
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
