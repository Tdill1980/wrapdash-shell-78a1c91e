import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Youtube,
  Upload,
  PlayCircle,
  Clock,
  Scissors,
  Sparkles,
  Video,
  ListVideo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function YouTubeEditor() {
  const navigate = useNavigate();

  const [videoUrl, setVideoUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const demoScenes = [
    { id: 1, type: "hook", start: "0:00", end: "0:06", score: 92 },
    { id: 2, type: "value", start: "0:06", end: "0:18", score: 74 },
    { id: 3, type: "reveal", start: "0:18", end: "0:23", score: 89 },
    { id: 4, type: "cta", start: "0:23", end: "0:30", score: 70 },
  ];

  const handleAnalyze = () => {
    setIsAnalyzed(true);
  };

  return (
    <div className="p-6 mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("/organic")} className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>

        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Youtube className="w-8 h-8 text-red-600" /> YouTube AI Editor
        </h1>
      </div>

      <p className="text-muted-foreground -mt-3">
        Turn long-form videos into shorts, reels, ads, and micro-content — automatically.
      </p>

      {/* INPUT BAR */}
      <Card className="border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Upload or Paste YouTube Link</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Paste YouTube URL..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleAnalyze}>
              <Youtube className="w-4 h-4 mr-2" />
              Analyze
            </Button>
          </div>

          <div
            className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
            onClick={() => document.getElementById("yt-file")?.click()}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Upload MP4 / MOV</p>
            {uploadedFile && <p className="text-sm text-primary mt-2">{uploadedFile.name}</p>}
            <input
              id="yt-file"
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ANALYSIS DASHBOARD */}
      {isAnalyzed && (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Analysis Overview</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <StatCard label="Duration" value="24:17" icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Scenes" value="38" icon={<ListVideo className="w-5 h-5" />} />
            <StatCard label="Energy Spikes" value="7" icon={<Sparkles className="w-5 h-5" />} />
            <StatCard label="Shorts Suggested" value="8" icon={<Video className="w-5 h-5" />} />
            <StatCard label="Hook Score" value="92/100" icon={<Scissors className="w-5 h-5" />} />
            <StatCard label="Transcript" value="Ready" icon={<PlayCircle className="w-5 h-5" />} />
          </CardContent>
        </Card>
      )}

      {/* SCENE TIMELINE */}
      {isAnalyzed && (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Scene Timeline</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex gap-3 overflow-x-auto py-3">
              {demoScenes.map((scene) => (
                <div
                  key={scene.id}
                  className={cn(
                    "min-w-[150px] p-3 rounded-lg border text-sm cursor-pointer hover:opacity-80 transition-opacity",
                    scene.type === "hook" && "bg-pink-500/20 border-pink-500/30",
                    scene.type === "value" && "bg-blue-500/20 border-blue-500/30",
                    scene.type === "reveal" && "bg-purple-500/20 border-purple-500/30",
                    scene.type === "cta" && "bg-green-500/20 border-green-500/30"
                  )}
                >
                  <p className="font-semibold capitalize">{scene.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {scene.start} → {scene.end}
                  </p>
                  <p className="text-xs mt-1">Score: {scene.score}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GENERATED SHORTS */}
      {isAnalyzed && (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Auto-Generated Shorts</CardTitle>
          </CardHeader>

          <CardContent className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <ShortCard key={i} number={i} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* INTEGRATION BUTTONS */}
      {isAnalyzed && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/organic/reel-builder")}>
            Send to Reel Builder
          </Button>

          <Button onClick={() => navigate("/contentbox")} variant="secondary">
            Send to Ad Creator
          </Button>

          <Button onClick={() => navigate("/organic/atomizer")} variant="secondary">
            Atomize Transcript
          </Button>

          <Button onClick={() => navigate("/content-schedule")} variant="outline">
            Schedule Content
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-muted/30 flex flex-col items-center text-sm">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function ShortCard({ number }: { number: number }) {
  return (
    <Card className="border hover:bg-muted/50 cursor-pointer transition">
      <CardContent className="p-4 space-y-3">
        <div className="aspect-[9/16] bg-muted rounded-md flex items-center justify-center">
          <PlayCircle className="w-10 h-10 text-muted-foreground" />
        </div>

        <p className="font-semibold text-sm">Short Clip #{number}</p>
        <p className="text-xs text-muted-foreground">12.8s • Hook: Strong</p>

        <Button className="w-full" size="sm">Edit Clip</Button>
        <Button variant="outline" className="w-full" size="sm">Render</Button>
      </CardContent>
    </Card>
  );
}
