import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Convert segments to SRT format
function toSRT(segments: Array<{ start: number; end: number; text: string }>): string {
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

// Convert segments to VTT format
function toVTT(segments: Array<{ start: number; end: number; text: string }>): string {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      youtube_url, 
      video_url,
      audio_base64,
      include_timestamps = true,
      output_format = 'json',
      language
    } = await req.json();
    
    console.log('Video transcribe request:', { 
      youtube_url: youtube_url ? 'provided' : 'none',
      video_url: video_url ? 'provided' : 'none', 
      audio_base64: audio_base64 ? 'provided' : 'none',
      include_timestamps,
      output_format 
    });

    let audioBlob: Blob;
    let mimeType = 'audio/webm';

    // Handle YouTube URLs - we'll use captions API as fallback or extract info
    if (youtube_url) {
      const videoId = extractYouTubeVideoId(youtube_url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL format');
      }
      
      console.log('YouTube video ID:', videoId);
      
      // For YouTube, we need to inform the user to download and upload the audio
      // Direct YouTube audio extraction requires additional infrastructure
      return new Response(
        JSON.stringify({ 
          error: 'youtube_not_direct',
          message: 'YouTube videos require downloading first. Please use a YouTube to MP3 converter and upload the audio file.',
          video_id: videoId,
          suggestion: 'Use the file upload option with the extracted audio'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle direct video URL - download and process
    if (video_url) {
      console.log('Fetching video from URL:', video_url);
      const videoResponse = await fetch(video_url);
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
      }
      
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
      const videoBuffer = await videoResponse.arrayBuffer();
      
      // For video files, we send them directly to Whisper (it can handle video)
      audioBlob = new Blob([videoBuffer], { type: contentType });
      mimeType = contentType;
      console.log('Video fetched, size:', videoBuffer.byteLength, 'type:', contentType);
    }
    // Handle base64 encoded audio
    else if (audio_base64) {
      console.log('Processing base64 audio...');
      const binaryAudio = processBase64Chunks(audio_base64);
      audioBlob = new Blob([binaryAudio], { type: 'audio/webm' });
      console.log('Audio blob created, size:', binaryAudio.length);
    }
    else {
      throw new Error('No video source provided. Please provide youtube_url, video_url, or audio_base64');
    }

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${mimeType.split('/')[1] || 'mp4'}`);
    formData.append('model', 'whisper-1');
    
    // Request verbose JSON for timestamps
    if (include_timestamps) {
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'segment');
    }
    
    if (language) {
      formData.append('language', language);
    }

    console.log('Sending to OpenAI Whisper...');
    
    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Transcription complete, segments:', result.segments?.length || 0);

    // Format the response based on output_format
    const segments = result.segments?.map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text
    })) || [];

    let formattedOutput: string | undefined;
    if (output_format === 'srt') {
      formattedOutput = toSRT(segments);
    } else if (output_format === 'vtt') {
      formattedOutput = toVTT(segments);
    } else if (output_format === 'text') {
      formattedOutput = result.text;
    }

    const responseData = {
      transcript: result.text,
      segments: include_timestamps ? segments : undefined,
      duration_seconds: result.duration,
      language: result.language,
      word_count: result.text?.split(/\s+/).length || 0,
      formatted_output: formattedOutput
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in video-transcribe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to transcribe video. Please try again or use a different video format.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
