import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum file size: 25MB (OpenAI Whisper limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

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

// Decode base64 and return size info
function decodeBase64(base64String: string): { data: Blob; size: number; detectedMime: string | null } {
  // Remove data URL prefix if present
  let base64Data = base64String;
  let detectedMime: string | null = null;
  
  if (base64String.startsWith('data:')) {
    const mimeMatch = base64String.match(/^data:([^;]+);/);
    if (mimeMatch) {
      detectedMime = mimeMatch[1];
    }
    const commaIndex = base64String.indexOf(',');
    if (commaIndex !== -1) {
      base64Data = base64String.substring(commaIndex + 1);
    }
  }
  
  // Use Deno's built-in base64 decoding
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create blob from the array buffer directly
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: detectedMime || 'audio/webm' });
  
  return { data: blob, size: binaryString.length, detectedMime };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { 
      youtube_url, 
      video_url,
      audio_base64,
      include_timestamps = true,
      output_format = 'json',
      language
    } = requestBody;
    
    console.log('Video transcribe request:', { 
      youtube_url: youtube_url ? 'provided' : 'none',
      video_url: video_url ? 'provided' : 'none', 
      audio_base64: audio_base64 ? `provided (${Math.round((audio_base64?.length || 0) / 1024)}KB base64)` : 'none',
      include_timestamps,
      output_format 
    });

    let audioBlob: Blob;
    let mimeType = 'audio/webm';
    let fileName = 'audio.mp4';

    // Handle YouTube URLs
    if (youtube_url) {
      const videoId = extractYouTubeVideoId(youtube_url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL format');
      }
      
      console.log('YouTube video ID:', videoId);
      
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
      
      const videoResponse = await fetch(video_url, {
        headers: {
          'Accept': 'audio/*, video/*',
        }
      });
      
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
      }
      
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
      const contentLength = videoResponse.headers.get('content-length');
      
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 25MB for transcription. Your file is ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB.`);
      }
      
      // Stream the response to avoid loading entire file in memory at once
      const videoBuffer = await videoResponse.arrayBuffer();
      
      if (videoBuffer.byteLength > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 25MB for transcription.`);
      }
      
      audioBlob = new Blob([videoBuffer], { type: contentType });
      mimeType = contentType;
      
      // Determine file extension
      const extension = contentType.split('/')[1]?.split(';')[0] || 'mp4';
      fileName = `audio.${extension}`;
      
      console.log('Video fetched, size:', videoBuffer.byteLength, 'type:', contentType);
    }
    // Handle base64 encoded audio
    else if (audio_base64) {
      console.log('Processing base64 audio...');
      
      // Check approximate decoded size (base64 is ~33% larger than binary)
      const estimatedSize = Math.floor(audio_base64.length * 0.75);
      if (estimatedSize > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 25MB for transcription. Your file is approximately ${Math.round(estimatedSize / 1024 / 1024)}MB.`);
      }
      
      // Decode base64
      const decoded = decodeBase64(audio_base64);
      
      if (decoded.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 25MB for transcription.`);
      }
      
      // Use detected mime type or default
      mimeType = decoded.detectedMime || 'audio/webm';
      audioBlob = decoded.data;
      
      // Determine file extension
      const extension = mimeType.split('/')[1]?.split(';')[0] || 'mp4';
      fileName = `audio.${extension}`;
      
      console.log('Audio blob created, size:', decoded.size, 'type:', mimeType);
    }
    else {
      throw new Error('No video source provided. Please provide youtube_url, video_url, or audio_base64');
    }

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
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
        details: 'Failed to transcribe video. Please try again with a smaller file (max 25MB).'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
