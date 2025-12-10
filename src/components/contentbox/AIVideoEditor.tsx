import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Scissors, 
  Wand2, 
  Type, 
  Sparkles,
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Download,
  Copy,
  CheckCircle,
  Video,
  ExternalLink
} from "lucide-react";
import { ContentFile, VideoProcessResult } from "@/hooks/useContentBox";
import { useVideoRender } from "@/hooks/useVideoRender";
import { useOrganization } from "@/contexts/OrganizationContext";
import { MusicPicker } from "./MusicPicker";
import { BrandVoiceIndicator } from "./BrandVoiceIndicator";
import { toast } from "sonner";

interface AIVideoEditorProps {
  selectedFile: ContentFile | null;
  onProcess: (action: string, params: Record<string, unknown>) => Promise<VideoProcessResult>;
  processing: boolean;
}

export function AIVideoEditor({ selectedFile, onProcess, processing }: AIVideoEditorProps) {
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [result, setResult] = useState<VideoProcessResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Creatomate render state
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [selectedMusicUrl, setSelectedMusicUrl] = useState<string | null>(null);
  
  const { organizationId } = useOrganization();
  const { 
    status: renderStatus, 
    progress: renderProgress, 
    outputUrl, 
    isRendering, 
    startRender, 
    reset: resetRender 
  } = useVideoRender();

  const actions = [
    {
      id: 'auto_cut',
      name: 'Auto Cut',
      icon: <Scissors className="w-5 h-5" />,
      description: 'AI finds best moments and creates cuts automatically',
    },
    {
      id: 'add_captions',
      name: 'Auto Captions',
      icon: <Type className="w-5 h-5" />,
      description: 'Generate and download SRT/VTT caption files',
    },
    {
      id: 'enhance',
      name: 'AI Enhance',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Get color, pacing, and enhancement suggestions',
    },
  ];

  const handleRenderReel = async () => {
    if (!selectedFile?.file_url) {
      toast.error("No video selected");
      return;
    }

    await startRender({
      videoUrl: selectedFile.file_url,
      headline: headline || undefined,
      subtext: subtext || undefined,
      organizationId: organizationId || undefined,
      musicUrl: selectedMusicUrl || undefined,
    });
  };

  const handleProcess = async () => {
    if (!selectedAction || !selectedFile) return;
    
    try {
      const data = await onProcess(selectedAction, {
        file_id: selectedFile.id,
        file_url: selectedFile.file_url,
        trim_start: trimStart[0],
        trim_end: trimEnd[0],
        brand: selectedFile.brand
      });
      setResult(data);
    } catch (error) {
      console.error('Processing failed:', error);
    }
  };

  const downloadCaptions = (format: 'srt' | 'vtt') => {
    if (!result) return;
    const content = format === 'srt' ? result.captions_srt : result.captions_vtt;
    if (!content) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded captions.${format}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedFile) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Wand2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">Select a Video to Edit</h3>
        <p className="text-muted-foreground text-sm">
          Choose a video from your library to start AI-powered editing
        </p>
      </Card>
    );
  }

  const isVideo = selectedFile.file_type === 'video' || selectedFile.file_type === 'reel';

  if (!isVideo) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Wand2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">Video Required</h3>
        <p className="text-muted-foreground text-sm">
          Select a video file to use the AI Video Editor
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <Card className="bg-black overflow-hidden">
        <div className="aspect-video relative">
          <video
            src={selectedFile.file_url}
            className="w-full h-full object-contain"
            controls={false}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4 mb-3">
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button size="icon" className="bg-white text-black hover:bg-white/90">
                <Play className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Timeline */}
            <div className="space-y-2">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                  style={{ width: '35%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>0:00</span>
                <span>{selectedFile.duration_seconds ? `${Math.floor(selectedFile.duration_seconds / 60)}:${String(Math.floor(selectedFile.duration_seconds % 60)).padStart(2, '0')}` : '0:00'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Trim Controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Trim Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Start Point</label>
            <Slider
              value={trimStart}
              onValueChange={setTrimStart}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End Point</label>
            <Slider
              value={trimEnd}
              onValueChange={setTrimEnd}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Trimming from {trimStart[0]}% to {trimEnd[0]}%
          </p>
        </CardContent>
      </Card>

      {/* AI Actions */}
      <div className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <Card 
            key={action.id}
            className={`cursor-pointer transition-all ${
              selectedAction === action.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedAction(action.id)}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">{action.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        className="w-full bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
        size="lg"
        disabled={!selectedAction || processing}
        onClick={handleProcess}
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2" />
            Apply {selectedAction ? actions.find(a => a.id === selectedAction)?.name : 'Edit'}
          </>
        )}
      </Button>

      {/* ========== CREATOMATE RENDER SECTION ========== */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Render Reel with Creatomate
            </CardTitle>
            <BrandVoiceIndicator />
          </div>
          <p className="text-xs text-muted-foreground">
            Add text overlays and music, then render a polished reel
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Overlays */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headline" className="text-xs">Headline (Text-1)</Label>
              <Input
                id="headline"
                placeholder="Your Text Here"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtext" className="text-xs">Subtext (Text-2)</Label>
              <Input
                id="subtext"
                placeholder="Create & Automate Video"
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Music Picker */}
          <MusicPicker
            selectedUrl={selectedMusicUrl}
            onSelect={setSelectedMusicUrl}
          />

          {/* Render Progress */}
          {isRendering && (
            <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Rendering video...
                </span>
                <span className="text-muted-foreground">{renderProgress}%</span>
              </div>
              <Progress value={renderProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                This may take 1-2 minutes depending on video length
              </p>
            </div>
          )}

          {/* Render Complete */}
          {renderStatus === 'succeeded' && outputUrl && (
            <div className="space-y-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Render Complete!</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-[#405DE6] to-[#E1306C]"
                  asChild
                >
                  <a href={outputUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download MP4
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={outputUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Render Failed */}
          {renderStatus === 'failed' && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">
                Render failed. Please try again or check your video file.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={resetRender}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Render Button */}
          {renderStatus !== 'succeeded' && (
            <Button
              className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E]"
              size="lg"
              disabled={isRendering || !selectedFile}
              onClick={handleRenderReel}
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Rendering...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  Render Reel
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              AI Processing Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Captions */}
            {result.captions_srt && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Caption Files</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadCaptions('srt')}>
                    <Download className="w-4 h-4 mr-1" /> SRT
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadCaptions('vtt')}>
                    <Download className="w-4 h-4 mr-1" /> VTT
                  </Button>
                </div>
              </div>
            )}

            {/* Transcript */}
            {result.transcript && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Transcript</p>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.transcript!)}>
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
                  {result.transcript}
                </p>
              </div>
            )}

            {/* Beat Sheet */}
            {result.beat_sheet && result.beat_sheet.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Beat Sheet</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.beat_sheet.map((beat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-muted p-2 rounded">
                      <span className="text-primary font-mono">{beat.timestamp}</span>
                      <span className="text-muted-foreground">{beat.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cut Recommendations */}
            {result.cut_recommendations && result.cut_recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Recommended Cuts</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.cut_recommendations.map((cut, i) => (
                    <div key={i} className="text-xs bg-muted p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-mono">{cut.start} → {cut.end}</span>
                        <span className="text-green-500">Score: {cut.score}/10</span>
                      </div>
                      <p className="text-muted-foreground mt-1">{cut.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhancement Suggestions */}
            {result.enhancement_suggestions && result.enhancement_suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Enhancement Suggestions</p>
                <ul className="space-y-1">
                  {result.enhancement_suggestions.map((suggestion, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
