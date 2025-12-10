import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Scissors,
  Sparkles,
  Play,
  Edit,
  Download,
  Film,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MicroReel {
  id: string;
  title: string;
  type: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

export default function AutoSplit() {
  const navigate = useNavigate();
  const [sourceVideo, setSourceVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reels, setReels] = useState<MicroReel[]>([]);

  const handleUpload = () => {
    // Placeholder for file upload
    setSourceVideo({ name: "my-video.mp4" } as File);
  };

  const handleGenerate = async () => {
    if (!sourceVideo) return;
    setIsProcessing(true);

    // Simulated processing
    await new Promise((r) => setTimeout(r, 3000));

    setReels([
      { id: "1", title: "Hook → Reveal", type: "hook_reveal", startTime: 0, endTime: 4 },
      { id: "2", title: "Installer POV", type: "pov", startTime: 4, endTime: 9 },
      { id: "3", title: "Detail Sequence", type: "detail", startTime: 2, endTime: 5 },
      { id: "4", title: "Before/After", type: "comparison", startTime: 1, endTime: 4 },
      { id: "5", title: "Overlay Trend", type: "trend", startTime: 3, endTime: 7 },
    ]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/organic")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Auto-Split Engine
              </h1>
              <p className="text-xs text-muted-foreground">
                Turn 1 video into 5 viral micro-reels
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Upload Section */}
        {!sourceVideo && (
          <Card>
            <CardContent className="p-8">
              <div
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleUpload}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">Upload Source Video</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Drag & drop your long-form video here, or click to browse.
                  AI will analyze and split it into 5 optimized micro-reels.
                </p>
                <Button className="mt-6" variant="outline">
                  Select Video
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Source Video Selected */}
        {sourceVideo && reels.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-32 aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{sourceVideo.name}</h3>
                  <p className="text-sm text-muted-foreground">Ready to process</p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Generate 5 Micro-Reels
                    </>
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing video...</span>
                    <span className="text-muted-foreground">This may take a moment</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#405DE6] to-[#E1306C] w-1/2 animate-pulse" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generated Reels */}
        {reels.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your 5 Reels Are Ready 🎉
              </h2>
              <Button variant="outline" onClick={() => setReels([])}>
                Start Over
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reels.map((reel, index) => (
                <Card key={reel.id} className="overflow-hidden group">
                  <div className="aspect-[9/16] bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <Badge className="absolute top-2 left-2 bg-black/70">
                      Reel {index + 1}
                    </Badge>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white bg-black/70 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {reel.endTime - reel.startTime}s
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary">
                        <Play className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{reel.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {reel.startTime.toFixed(1)}s – {reel.endTime.toFixed(1)}s
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                      >
                        Render
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bulk Actions */}
            <Card className="border-primary/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Render All Reels</h3>
                  <p className="text-sm text-muted-foreground">
                    Export all 5 micro-reels at once
                  </p>
                </div>
                <Button className="bg-gradient-to-r from-[#405DE6] to-[#E1306C]">
                  <Zap className="w-4 h-4 mr-2" />
                  Render All (5)
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
