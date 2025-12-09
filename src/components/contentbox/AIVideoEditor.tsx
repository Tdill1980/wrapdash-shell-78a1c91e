import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Scissors, 
  Wand2, 
  Type, 
  Music, 
  Sparkles,
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2
} from "lucide-react";
import { ContentFile } from "@/hooks/useContentBox";

interface AIVideoEditorProps {
  selectedFile: ContentFile | null;
  onProcess: (action: string, params: Record<string, unknown>) => Promise<void>;
  processing: boolean;
}

export function AIVideoEditor({ selectedFile, onProcess, processing }: AIVideoEditorProps) {
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

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
      description: 'Generate and overlay animated captions',
    },
    {
      id: 'add_music',
      name: 'Add Music',
      icon: <Music className="w-5 h-5" />,
      description: 'Add royalty-free background music',
    },
    {
      id: 'enhance',
      name: 'AI Enhance',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Color correct, stabilize, and enhance quality',
    },
  ];

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
      <div className="grid gap-3 md:grid-cols-2">
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
        onClick={() => selectedAction && onProcess(selectedAction, {
          file_id: selectedFile.id,
          trim_start: trimStart[0],
          trim_end: trimEnd[0],
        })}
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
    </div>
  );
}
