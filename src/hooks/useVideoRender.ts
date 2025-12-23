import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type RenderStatus = 'idle' | 'starting' | 'rendering' | 'succeeded' | 'failed' | 'deprecated';

interface RenderOverlay {
  text: string;
  time: number;
  duration: number;
}

export interface InspoStyle {
  font_style?: string;
  font_weight?: string;
  text_color?: string;
  text_shadow?: boolean;
  text_position?: string;
  background_style?: string;
  accent_color?: string;
  text_animation?: string;
  hook_format?: string;
  emoji_usage?: boolean;
}

interface RenderParams {
  videoUrl: string;
  additionalClips?: string[];
  headline?: string;
  subtext?: string;
  templateId?: string;
  organizationId?: string;
  musicUrl?: string;
  overlays?: RenderOverlay[];
  inspoStyle?: InspoStyle;
}

interface RenderState {
  status: RenderStatus;
  renderId: string | null;
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
}

export function useVideoRender() {
  const [state, setState] = useState<RenderState>({
    status: 'idle',
    renderId: null,
    progress: 0,
    outputUrl: null,
    errorMessage: null,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const checkStatus = useCallback(async (renderId: string) => {
    // Deprecated - MightyEdit uses different status checking
    console.warn('[useVideoRender] DEPRECATED: This render pipeline is no longer available. Use MightyEdit instead.');
    return { status: 'deprecated' as RenderStatus, url: null };
  }, []);

  const startRender = useCallback(async (params: RenderParams) => {
    // Show deprecation notice and redirect users to MightyEdit
    console.warn('[useVideoRender] DEPRECATED: render-video-reel is disabled. Redirecting to MightyEdit flow.');
    
    setState({
      status: 'deprecated',
      renderId: null,
      progress: 0,
      outputUrl: null,
      errorMessage: 'This render pipeline has been replaced by MightyEdit.',
    });

    // Store video info in sessionStorage for MightyEdit to pick up
    if (params.videoUrl) {
      const preset = {
        attached_assets: [{ url: params.videoUrl, type: 'video' }],
        overlays: params.overlays?.map(o => ({
          text: o.text,
          start: o.time,
          duration: o.duration,
        })) || [],
        headline: params.headline,
        subtext: params.subtext,
        musicUrl: params.musicUrl,
      };
      sessionStorage.setItem('mightyedit_preset', JSON.stringify(preset));
    }

    toast.error('Creatomate render is disabled', {
      description: 'Opening MightyEdit instead...',
      action: {
        label: 'Open MightyEdit',
        onClick: () => {
          window.location.href = '/mighty-edit';
        },
      },
      duration: 8000,
    });

    return null;
  }, []);

  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setState({
      status: 'idle',
      renderId: null,
      progress: 0,
      outputUrl: null,
      errorMessage: null,
    });
  }, []);

  return {
    ...state,
    isRendering: state.status === 'starting' || state.status === 'rendering',
    isDeprecated: state.status === 'deprecated',
    startRender,
    checkStatus,
    reset,
  };
}
