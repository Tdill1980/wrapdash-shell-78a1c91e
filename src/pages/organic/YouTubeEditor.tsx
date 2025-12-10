import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Youtube,
  Upload,
  Clock,
  Scissors,
  Sparkles,
  Video,
  ListVideo,
  Zap,
  Package,
  RotateCcw,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useYouTubeEditor } from "@/hooks/useYouTubeEditor";
import { YouTubeProcessingStatus } from "@/components/youtube/YouTubeProcessingStatus";
import { SceneTimeline } from "@/components/youtube/SceneTimeline";
import { ShortPreviewCard } from "@/components/youtube/ShortPreviewCard";
import { LongFormEnhancementPanel } from "@/components/youtube/LongFormEnhancementPanel";

export default function YouTubeEditor() {
  const navigate = useNavigate();
  const YT = useYouTubeEditor();

  return (
    <div className="p-6 mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/organic")} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <Youtube className="w-8 h-8 text-pink-500" /> YouTube AI Editor
          </h1>
        </div>

        {YT.isAnalyzed && (
          <Button variant="outline" onClick={YT.reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Start Over
          </Button>
        )}
      </div>

      <p className="text-muted-foreground">
        Turn long-form YouTube content into high-performing shorts, reels, ads, and posts.
      </p>

      {/* INPUT BAR */}
      <Card className="border border-border bg-card overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-pink-500 to-orange-500" />
        <CardHeader>
          <CardTitle className="text-lg">Upload or Paste YouTube Link</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Paste YouTube URL..."
              value={YT.videoUrl}
              onChange={(e) => YT.setVideoUrl(e.target.value)}
              className="flex-1"
            />

            <Button 
              onClick={YT.analyze}
              disabled={YT.isAnalyzing}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white border-0"
            >
              <Youtube className="w-4 h-4 mr-2" />
              Analyze
            </Button>
          </div>

          <div
            className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 hover:border-pink-500/50 transition-all group"
            onClick={() => document.getElementById("yt-file")?.click()}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-pink-500 transition-colors" />
            <p className="text-muted-foreground group-hover:text-foreground transition-colors">
              Upload MP4 / MOV
            </p>
            {YT.uploadedFile && (
              <p className="text-sm text-pink-500 mt-2">{YT.uploadedFile.name}</p>
            )}
            <input
              id="yt-file"
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => YT.setUploadedFile(e.target.files?.[0] || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* PROCESSING STATUS */}
      <YouTubeProcessingStatus isAnalyzing={YT.isAnalyzing} />

      {/* ANALYSIS DASHBOARD */}
      {YT.isAnalyzed && (
        <Card className="border border-border bg-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Analysis Overview
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <StatCard label="Duration" value={YT.analysis.duration} icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Scenes" value={String(YT.analysis.scenes)} icon={<ListVideo className="w-5 h-5" />} />
            <StatCard label="Energy Spikes" value={String(YT.analysis.spikes)} icon={<Zap className="w-5 h-5" />} />
            <StatCard label="Shorts Found" value={String(YT.analysis.shorts)} icon={<Video className="w-5 h-5" />} />
            <StatCard label="Hook Score" value={`${YT.analysis.hookScore}%`} icon={<Scissors className="w-5 h-5" />} highlight />
            <StatCard label="Products" value={String(YT.analysis.productMentions)} icon={<Package className="w-5 h-5" />} />
          </CardContent>
        </Card>
      )}

      {/* SCENE TIMELINE */}
      {YT.isAnalyzed && (
        <SceneTimeline 
          scenes={YT.demoScenes} 
          onSceneClick={YT.setSelectedScene}
          selectedSceneId={YT.selectedScene?.id}
        />
      )}

      {/* TABS FOR SHORTS AND ENHANCEMENTS */}
      {YT.isAnalyzed && (
        <Tabs defaultValue="shorts" className="animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="shorts" className="gap-2">
              <Video className="w-4 h-4" />
              Shorts ({YT.shorts.length})
            </TabsTrigger>
            <TabsTrigger value="enhancements" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Enhancements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shorts">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Video className="w-5 h-5 text-pink-500" />
                Auto-Generated Shorts
              </h2>
              <div className="flex gap-2">
                <Button 
                  className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white border-0"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Render All
                </Button>
                <Button variant="outline">
                  Schedule All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {YT.shorts.map((short) => (
                <ShortPreviewCard 
                  key={short.id} 
                  short={short}
                  onSendToReel={() => navigate("/organic/reel-builder")}
                  onSendToAd={() => navigate("/contentbox")}
                  onSchedule={() => navigate("/content-schedule")}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="enhancements">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-pink-500" />
                Long-Form Enhancements
              </h2>
              {!YT.enhancementData && (
                <Button 
                  onClick={YT.generateEnhancements}
                  disabled={YT.isEnhancing || !YT.transcript}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white border-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {YT.isEnhancing ? "Analyzing..." : "Analyze for Enhancements"}
                </Button>
              )}
            </div>

            <LongFormEnhancementPanel 
              data={YT.enhancementData}
              isLoading={YT.isEnhancing}
              onApplyEnhancement={(type, item) => {
                console.log("Apply enhancement:", type, item);
                // TODO: Handle enhancement actions
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* INTEGRATION BUTTONS */}
      {YT.isAnalyzed && (
        <Card className="border border-border bg-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/organic/reel-builder")} variant="outline" className="hover:border-pink-500/50 hover:bg-pink-500/10">
                Send to Reel Builder
              </Button>

              <Button onClick={() => navigate("/contentbox")} variant="outline" className="hover:border-pink-500/50 hover:bg-pink-500/10">
                Send to Ad Creator
              </Button>

              <Button onClick={() => navigate("/organic/atomizer")} variant="outline" className="hover:border-pink-500/50 hover:bg-pink-500/10">
                Atomize Transcript
              </Button>

              <Button onClick={() => navigate("/content-schedule")} variant="outline" className="hover:border-pink-500/50 hover:bg-pink-500/10">
                Schedule Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon,
  highlight 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border flex flex-col items-center text-sm transition-all ${
      highlight 
        ? "border-pink-500/50 bg-pink-500/10" 
        : "border-border bg-muted/30"
    }`}>
      <div className={`mb-2 ${highlight ? "text-pink-500" : "text-primary"}`}>{icon}</div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`font-semibold text-lg ${highlight ? "text-pink-500" : ""}`}>{value}</p>
    </div>
  );
}
