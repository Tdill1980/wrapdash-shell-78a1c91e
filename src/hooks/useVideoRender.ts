import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type RenderStatus = 'idle' | 'starting' | 'rendering' | 'succeeded' | 'failed';

interface RenderOverlay {
  text: string;
  time: number;
  duration: number;
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
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/render-video-reel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            action: 'status',
            render_id: renderId,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to check status');
      }

      const creatomateStatus = data.status;
      let newStatus: RenderStatus = 'rendering';

      if (creatomateStatus === 'succeeded') {
        newStatus = 'succeeded';
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast.success('Video rendered successfully!');
      } else if (creatomateStatus === 'failed') {
        newStatus = 'failed';
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast.error(`Render failed: ${data.error_message || 'Unknown error'}`);
      }

      setState(prev => ({
        ...prev,
        status: newStatus,
        progress: data.progress || prev.progress,
        outputUrl: data.url || null,
        errorMessage: data.error_message || null,
      }));

      return { status: newStatus, url: data.url };
    } catch (error) {
      console.error('[useVideoRender] Status check error:', error);
      return { status: 'rendering' as RenderStatus, url: null };
    }
  }, []);

  const startRender = useCallback(async (params: RenderParams) => {
    const { videoUrl, additionalClips, headline, subtext, templateId, organizationId, musicUrl, overlays } = params;

    if (!videoUrl) {
      toast.error('Video URL is required');
      return null;
    }

    setState({
      status: 'starting',
      renderId: null,
      progress: 0,
      outputUrl: null,
      errorMessage: null,
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/render-video-reel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            action: 'start',
            video_url: videoUrl,
            additional_clips: additionalClips,
            headline,
            subtext,
            template_id: templateId,
            organization_id: organizationId,
            music_url: musicUrl,
            overlays,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start render');
      }

      const renderId = data.render_id;

      setState(prev => ({
        ...prev,
        status: 'rendering',
        renderId,
        progress: 5, // Initial progress
      }));

      toast.success('Video render started! This may take a minute...');

      // Start polling for status
      pollingRef.current = setInterval(async () => {
        const { status } = await checkStatus(renderId);
        if (status === 'succeeded' || status === 'failed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }, 3000); // Poll every 3 seconds

      return renderId;
    } catch (error) {
      console.error('[useVideoRender] Start render error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        status: 'failed',
        errorMessage,
      }));

      toast.error(`Failed to start render: ${errorMessage}`);
      return null;
    }
  }, [checkStatus]);

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
    startRender,
    checkStatus,
    reset,
  };
}
