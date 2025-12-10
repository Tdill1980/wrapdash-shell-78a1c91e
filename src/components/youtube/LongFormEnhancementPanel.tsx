import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Clock, 
  MessageSquare, 
  Film, 
  Type, 
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Scissors
} from "lucide-react";

interface EnhancementData {
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

interface LongFormEnhancementPanelProps {
  data: EnhancementData | null;
  isLoading?: boolean;
  onApplyEnhancement?: (type: string, item: unknown) => void;
}

export function LongFormEnhancementPanel({ 
  data, 
  isLoading,
  onApplyEnhancement 
}: LongFormEnhancementPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-black/40 border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-[#FF0050] animate-pulse" />
          <h3 className="text-white font-semibold">Analyzing Long-Form Content...</h3>
        </div>
        <Progress value={45} className="h-2" />
        <p className="text-white/60 text-sm mt-2">Detecting pacing, filler words, and enhancement opportunities</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-black/40 border-white/10 p-6">
        <p className="text-white/60 text-center">No enhancement data available yet</p>
      </Card>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-4">
      {/* Quality Scores */}
      {data.quality_scores && (
        <Card className="bg-black/40 border-white/10 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF0050]" />
            Quality Scores
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${scoreColor(data.quality_scores.pacing)}`}>
                {data.quality_scores.pacing}
              </p>
              <p className="text-white/60 text-xs">Pacing</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${scoreColor(data.quality_scores.engagement)}`}>
                {data.quality_scores.engagement}
              </p>
              <p className="text-white/60 text-xs">Engagement</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${scoreColor(data.quality_scores.clarity)}`}>
                {data.quality_scores.clarity}
              </p>
              <p className="text-white/60 text-xs">Clarity</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filler Words */}
      {data.filler_words && data.filler_words.total_count > 0 && (
        <Card className="bg-black/40 border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-yellow-400" />
              Filler Words
            </h3>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
              {data.filler_words.total_count} found
            </Badge>
          </div>
          <p className="text-white/60 text-sm mb-2">
            Density: {data.filler_words.density_per_minute.toFixed(1)}/min
          </p>
          <div className="flex flex-wrap gap-2">
            {data.filler_words.instances.slice(0, 10).map((instance, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-yellow-500/20 text-yellow-300 cursor-pointer hover:bg-yellow-500/30"
                onClick={() => onApplyEnhancement?.('remove_filler', instance)}
              >
                "{instance.word}" @ {instance.timestamp}
              </Badge>
            ))}
            {data.filler_words.instances.length > 10 && (
              <Badge variant="outline" className="text-white/60">
                +{data.filler_words.instances.length - 10} more
              </Badge>
            )}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-3 text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/20"
            onClick={() => onApplyEnhancement?.('remove_all_fillers', data.filler_words)}
          >
            <Scissors className="w-3 h-3 mr-1" />
            Auto-Remove All
          </Button>
        </Card>
      )}

      {/* Dead Air */}
      {data.dead_air && data.dead_air.total_seconds > 0 && (
        <Card className="bg-black/40 border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              Dead Air
            </h3>
            <Badge variant="outline" className="text-orange-400 border-orange-400/50">
              {data.dead_air.total_seconds}s total
            </Badge>
          </div>
          <div className="space-y-2">
            {data.dead_air.instances.slice(0, 5).map((instance, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-white/80 text-sm">
                  {instance.start} ({instance.duration}s)
                </span>
                <Badge 
                  variant="secondary"
                  className={
                    instance.suggestion === 'cut' 
                      ? 'bg-red-500/20 text-red-300' 
                      : instance.suggestion === 'speed_ramp'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-green-500/20 text-green-300'
                  }
                >
                  {instance.suggestion}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* B-Roll Cues */}
      {data.broll_cues && data.broll_cues.length > 0 && (
        <Card className="bg-black/40 border-white/10 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            B-Roll Suggestions
          </h3>
          <div className="space-y-2">
            {data.broll_cues.slice(0, 5).map((cue, i) => (
              <div 
                key={i} 
                className="bg-white/5 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/60 text-xs">{cue.timestamp}</span>
                  <Badge variant="outline" className="text-purple-300 border-purple-300/50 text-xs">
                    {cue.type}
                  </Badge>
                </div>
                <p className="text-white/80 text-sm">{cue.suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Text Overlays */}
      {data.text_overlays && data.text_overlays.length > 0 && (
        <Card className="bg-black/40 border-white/10 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-400" />
            Suggested Overlays
          </h3>
          <div className="space-y-2">
            {data.text_overlays.slice(0, 6).map((overlay, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10"
                onClick={() => onApplyEnhancement?.('add_overlay', overlay)}
              >
                <div>
                  <span className="text-white/60 text-xs">{overlay.timestamp}</span>
                  <p className="text-white text-sm font-medium">"{overlay.text}"</p>
                </div>
                <Badge variant="outline" className="text-cyan-300 border-cyan-300/50 text-xs">
                  {overlay.style}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chapters */}
      {data.chapters && data.chapters.length > 0 && (
        <Card className="bg-black/40 border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-400" />
              YouTube Chapters
            </h3>
            <Button 
              size="sm" 
              variant="outline"
              className="text-green-400 border-green-400/50 hover:bg-green-400/20"
              onClick={() => onApplyEnhancement?.('copy_chapters', data.chapters)}
            >
              Copy All
            </Button>
          </div>
          <div className="space-y-1 font-mono text-sm">
            {data.chapters.map((chapter, i) => (
              <div key={i} className="text-white/80">
                <span className="text-green-400">{chapter.time}</span> {chapter.title}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Emotional Arc */}
      {data.emotional_beats && (
        <Card className="bg-black/40 border-white/10 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-pink-400" />
            Emotional Arc: {data.emotional_beats.arc_type}
          </h3>
          <div className="space-y-2">
            {data.emotional_beats.high_points.slice(0, 3).map((point, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 bg-pink-500/10 rounded-lg px-3 py-2"
              >
                <span className="text-pink-400 text-xs">{point.timestamp}</span>
                <span className="text-white/80 text-sm flex-1">{point.description}</span>
                <Badge className="bg-pink-500/30 text-pink-200">
                  {point.energy}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Production Notes */}
      {data.quality_scores?.production_notes && data.quality_scores.production_notes.length > 0 && (
        <Card className="bg-black/40 border-white/10 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Production Notes
          </h3>
          <ul className="space-y-1">
            {data.quality_scores.production_notes.map((note, i) => (
              <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                <span className="text-amber-400">•</span>
                {note}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
