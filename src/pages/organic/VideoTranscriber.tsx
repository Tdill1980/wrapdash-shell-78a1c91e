import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  Mic,
  Upload,
  Link2,
  Copy,
  Download,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Subtitles,
  Atom,
  Sparkles,
  ArrowLeft,
  Youtube,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVideoTranscriber } from "@/hooks/useVideoTranscriber";
import { cn } from "@/lib/utils";

export default function VideoTranscriber() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
  
  const {
    status,
    progress,
    result,
    error,
    transcribeFromUrl,
    transcribeFromFile,
    exportAs,
    copyToClipboard,
    reset,
    isProcessing
  } = useVideoTranscriber();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await transcribeFromFile(file);
    }
  }, [transcribeFromFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: isProcessing
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      await transcribeFromUrl(urlInput.trim());
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/organic")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Hub
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary">
            <Mic className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Video Transcriber</h1>
          <Badge variant="secondary">AI</Badge>
        </div>
        <p className="text-muted-foreground">
          Transcribe YouTube videos, reels, or any video/audio file into text with timestamps.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "url" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" disabled={isProcessing}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Paste URL
                </TabsTrigger>
                <TabsTrigger value="upload" disabled={isProcessing}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 pt-4">
                <form onSubmit={handleUrlSubmit} className="space-y-3">
                  <Input
                    placeholder="Paste video URL (YouTube, MP4, etc.)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isProcessing}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Youtube className="w-4 h-4 text-primary" />
                    <span>YouTube, TikTok, Instagram & direct video URLs supported</span>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!urlInput.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Transcribe
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="upload" className="pt-4">
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    isProcessing && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  {isDragActive ? (
                    <p className="text-primary font-medium">Drop your file here...</p>
                  ) : (
                    <>
                      <p className="font-medium">Drop video or audio file here</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        MP4, MOV, WebM, MP3, WAV (max 500MB)
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Processing Status */}
            {isProcessing && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {status === 'uploading' && (
                      <>
                        <Upload className="w-4 h-4 text-primary" />
                        Uploading file...
                      </>
                    )}
                    {status === 'processing' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Processing video...
                      </>
                    )}
                    {status === 'transcribing' && (
                      <>
                        <Mic className="w-4 h-4 text-primary animate-pulse" />
                        Transcribing audio...
                      </>
                    )}
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Transcription Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={reset}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcript
              </CardTitle>
              {result && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDuration(result.duration_seconds)}
                  <span className="text-muted-foreground/50">•</span>
                  {result.word_count} words
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {status === 'complete' && result ? (
              <div className="space-y-4">
                {/* Transcript with timestamps */}
                <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-4">
                  {result.segments && result.segments.length > 0 ? (
                    <div className="space-y-3">
                      {result.segments.map((seg, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">
                            [{formatTimestamp(seg.start)}]
                          </span>
                          <p className="text-sm leading-relaxed">{seg.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{result.transcript}</p>
                  )}
                </ScrollArea>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportAs('txt')}>
                    <Download className="w-4 h-4 mr-2" />
                    TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportAs('srt')}>
                    <Subtitles className="w-4 h-4 mr-2" />
                    SRT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportAs('vtt')}>
                    <Subtitles className="w-4 h-4 mr-2" />
                    VTT
                  </Button>
                </div>

                {/* Next Steps */}
                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Next Steps
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => navigate('/organic/atomizer', { 
                        state: { initialText: result.transcript } 
                      })}
                    >
                      <Atom className="w-4 h-4 mr-2" />
                      Send to Atomizer
                    </Button>
                    <Button variant="secondary" size="sm" disabled>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze with AI
                      <Badge variant="outline" className="ml-2 text-[10px]">Soon</Badge>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No transcript yet</p>
                  <p className="text-sm mt-1">
                    Upload a video or paste a URL to get started
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Pro Tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Paste any YouTube, TikTok, or Instagram URL to auto-extract and transcribe</li>
                  <li>• Shorter clips (under 10 minutes) transcribe faster and more accurately</li>
                  <li>• Clear audio with minimal background noise gives the best results</li>
                  <li>• Use SRT/VTT exports to add captions directly to your videos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
