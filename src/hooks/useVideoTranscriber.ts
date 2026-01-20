import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  transcript: string;
  segments?: TranscriptSegment[];
  duration_seconds?: number;
  language?: string;
  word_count?: number;
  formatted_output?: string;
}

type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'transcribing' | 'complete' | 'error';

export function useVideoTranscriber() {
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  const transcribeFromUrl = useCallback(async (
    url: string, 
    options: { includeTimestamps?: boolean; outputFormat?: 'json' | 'srt' | 'vtt' | 'text' } = {}
  ) => {
    try {
      reset();
      setStatus('processing');
      setProgress(10);

      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      
      setProgress(30);
      setStatus('transcribing');

      const { data, error: fnError } = await supabase.functions.invoke('video-transcribe', {
        body: {
          ...(isYouTube ? { youtube_url: url } : { video_url: url }),
          include_timestamps: options.includeTimestamps ?? true,
          output_format: options.outputFormat || 'json'
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        // Handle extraction failures with fallback options
        if (data.error === 'youtube_extraction_failed' || data.error === 'extraction_failed') {
          toast.error('Audio extraction failed', {
            description: data.message,
            action: data.fallback_urls?.[0] ? {
              label: 'Try Cobalt',
              onClick: () => window.open(data.fallback_urls[0], '_blank')
            } : undefined
          });
          setError(data.message);
          setStatus('error');
          return null;
        }
        throw new Error(data.error);
      }

      setProgress(100);
      setStatus('complete');
      setResult(data);
      toast.success('Transcription complete!');
      return data as TranscriptionResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
      setStatus('error');
      toast.error('Transcription failed', { description: message });
      return null;
    }
  }, [reset]);

  const transcribeFromFile = useCallback(async (
    file: File,
    options: { includeTimestamps?: boolean; outputFormat?: 'json' | 'srt' | 'vtt' | 'text' } = {}
  ) => {
    try {
      reset();
      setStatus('uploading');
      setProgress(5);

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      setProgress(30);
      setStatus('transcribing');

      const { data, error: fnError } = await supabase.functions.invoke('video-transcribe', {
        body: {
          audio_base64: base64,
          include_timestamps: options.includeTimestamps ?? true,
          output_format: options.outputFormat || 'json'
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setProgress(100);
      setStatus('complete');
      setResult(data);
      toast.success('Transcription complete!');
      return data as TranscriptionResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
      setStatus('error');
      toast.error('Transcription failed', { description: message });
      return null;
    }
  }, [reset]);

  const exportAs = useCallback((format: 'txt' | 'srt' | 'vtt') => {
    if (!result) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'txt') {
      content = result.transcript;
      filename = 'transcript.txt';
      mimeType = 'text/plain';
    } else if (format === 'srt') {
      content = result.formatted_output && result.formatted_output.includes('-->') 
        ? result.formatted_output 
        : generateSRT(result.segments || []);
      filename = 'transcript.srt';
      mimeType = 'application/x-subrip';
    } else {
      content = result.formatted_output && result.formatted_output.startsWith('WEBVTT')
        ? result.formatted_output
        : generateVTT(result.segments || []);
      filename = 'transcript.vtt';
      mimeType = 'text/vtt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }, [result]);

  const copyToClipboard = useCallback(async () => {
    if (!result?.transcript) return;
    
    await navigator.clipboard.writeText(result.transcript);
    toast.success('Copied to clipboard');
  }, [result]);

  return {
    status,
    progress,
    result,
    error,
    transcribeFromUrl,
    transcribeFromFile,
    exportAs,
    copyToClipboard,
    reset,
    isProcessing: status === 'uploading' || status === 'processing' || status === 'transcribing'
  };
}

// Helper functions for format conversion
function generateSRT(segments: TranscriptSegment[]): string {
  return segments.map((seg, i) => {
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    return `${i + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text.trim()}\n`;
  }).join('\n');
}

function generateVTT(segments: TranscriptSegment[]): string {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  const cues = segments.map(seg => 
    `${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text.trim()}`
  ).join('\n\n');
  
  return `WEBVTT\n\n${cues}`;
}
