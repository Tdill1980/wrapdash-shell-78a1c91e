import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType = 'audio/webm' } = await req.json();
    
    if (!audio) {
      console.error('❌ No audio data provided');
      return new Response(
        JSON.stringify({ error: 'No audio data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 Received audio data, length:', audio.length, 'mimeType:', mimeType);

    // Use Deno's built-in base64 decoder (handles any size correctly)
    const binaryAudio = base64Decode(audio);
    console.log('🔄 Decoded to binary, size:', binaryAudio.length, 'bytes');
    
    // Check if we have enough audio data (at least 1KB)
    if (binaryAudio.length < 1000) {
      console.error('⚠️ Audio too short:', binaryAudio.length, 'bytes');
      return new Response(
        JSON.stringify({ error: 'Audio recording too short - please hold the button longer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map MIME type to correct file extension for Whisper
    const getFileExtension = (mime: string): string => {
      if (mime.includes('mp4') || mime.includes('m4a')) return 'mp4';
      if (mime.includes('ogg')) return 'ogg';
      if (mime.includes('wav')) return 'wav';
      return 'webm';
    };
    
    const fileExtension = getFileExtension(mimeType);
    console.log('📁 Using file extension:', fileExtension);

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(binaryAudio)], { type: mimeType });
    formData.append('file', blob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    console.log('📤 Sending to OpenAI Whisper API...');

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('❌ OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Transcription service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Transcription failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('✅ Transcription successful:', result.text?.substring(0, 100) + '...');

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in transcribe-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
