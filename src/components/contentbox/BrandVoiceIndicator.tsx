import { Mic2, Sparkles, Zap, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";
import { cn } from "@/lib/utils";

interface BrandVoiceIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function BrandVoiceIndicator({ showDetails = false, className }: BrandVoiceIndicatorProps) {
  const { mergedVoice, isLoading, brandDefaults } = useVoiceEngine();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 animate-pulse", className)}>
        <div className="h-6 w-24 bg-muted rounded" />
      </div>
    );
  }

  const brandName = (brandDefaults as any)?.brand_name || 'WePrintWraps';
  const { tone, energy, style_modifiers } = mergedVoice;

  // Determine dominant style
  const dominantStyle = 
    style_modifiers.sabri >= style_modifiers.garyvee && style_modifiers.sabri >= style_modifiers.dara ? 'Sabri' :
    style_modifiers.garyvee >= style_modifiers.dara ? 'Gary Vee' : 'Dara';

  const styleColors = {
    'Sabri': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Gary Vee': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Dara': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Brand Badge */}
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className="flex items-center gap-1.5 bg-primary/10 border-primary/30"
              style={{ 
                borderColor: mergedVoice.overlays.primary_color + '50',
                backgroundColor: mergedVoice.overlays.primary_color + '15'
              }}
            >
              <Mic2 className="h-3 w-3" style={{ color: mergedVoice.overlays.primary_color }} />
              <span className="font-medium">{brandName}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Brand: {brandName}</p>
            <p className="text-xs text-muted-foreground">Tone: {tone}</p>
          </TooltipContent>
        </Tooltip>

        {/* Style Framework Badge */}
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={cn("flex items-center gap-1.5", styleColors[dominantStyle as keyof typeof styleColors])}>
              <Sparkles className="h-3 w-3" />
              <span>{dominantStyle} Style</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Style Framework Mix:</p>
              <div className="text-xs space-y-0.5">
                <p>🎯 Sabri Suby: {Math.round(style_modifiers.sabri * 100)}%</p>
                <p>🔥 Gary Vee: {Math.round(style_modifiers.garyvee * 100)}%</p>
                <p>✨ Dara Denny: {Math.round(style_modifiers.dara * 100)}%</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Energy Badge */}
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <Zap className="h-3 w-3" />
              <span className="capitalize">{energy.split(',')[0]}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Energy: {energy}</p>
          </TooltipContent>
        </Tooltip>

        {/* Motion Style (if showing details) */}
        {showDetails && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-500/10 border-blue-500/30 text-blue-400">
                <Film className="h-3 w-3" />
                <span className="capitalize">{mergedVoice.overlays.motion_style.split(',')[0]}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Motion: {mergedVoice.overlays.motion_style}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
