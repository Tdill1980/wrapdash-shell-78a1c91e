import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      // Try to use webm format first, fallback to mp4 for Safari
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      
      console.log('📼 Using MIME type:', mimeType || 'default');
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
        
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`📦 Chunk received: ${e.data.size} bytes`);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('❌ MediaRecorder error:', e);
      };

      // Request data every 250ms for smoother capture
      mediaRecorder.start(250);
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: error instanceof Error ? error.message : "Could not access microphone",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        console.error('❌ No MediaRecorder found');
        reject(new Error('No recording in progress'));
        return;
      }

      const recorder = mediaRecorderRef.current;
      
      recorder.onstop = async () => {
        setIsRecording(false);
        
        // Check minimum recording duration - lowered to 300ms
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        const MIN_RECORDING_DURATION = 300;
        
        console.log(`📊 Recording duration: ${recordingDuration}ms, Chunks: ${chunksRef.current.length}`);
        
        if (recordingDuration < MIN_RECORDING_DURATION) {
          toast({
            title: "Recording Too Short",
            description: `Hold longer (${Math.round(recordingDuration)}ms < 300ms minimum)`,
            variant: "destructive",
          });
          reject(new Error('Recording too short'));
          return;
        }

        if (chunksRef.current.length === 0) {
          toast({
            title: "No Audio Captured",
            description: "No audio data was recorded. Please try again.",
            variant: "destructive",
          });
          reject(new Error('No audio data captured'));
          return;
        }

        setIsProcessing(true);

        // Determine MIME type from first chunk or use default
        const mimeType = chunksRef.current[0]?.type || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log(`🎵 Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        if (audioBlob.size < 1000) {
          setIsProcessing(false);
          toast({
            title: "Audio Too Small",
            description: "Recording captured very little audio. Please speak louder or closer to the microphone.",
            variant: "destructive",
          });
          reject(new Error('Audio too small'));
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            setIsProcessing(false);
            toast({
              title: "Conversion Error",
              description: "Failed to process audio data",
              variant: "destructive",
            });
            reject(new Error('Failed to convert audio'));
            return;
          }

          console.log(`📤 Sending ${base64Audio.length} chars to transcription service, mimeType: ${mimeType}`);

          try {
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio, mimeType }
            });

            setIsProcessing(false);

            if (error) {
              console.error('❌ Function invoke error:', error);
              const errorMessage = error.message || 'Failed to connect to transcription service';
              toast({
                title: "Connection Error",
                description: errorMessage,
                variant: "destructive",
              });
              reject(new Error(errorMessage));
              return;
            }

            if (data?.error) {
              console.error('❌ Transcription error:', data.error);
              toast({
                title: "Transcription Failed",
                description: data.error,
                variant: "destructive",
              });
              reject(new Error(data.error));
              return;
            }

            if (!data?.text) {
              console.error('⚠️ No transcription returned:', data);
              toast({
                title: "No Speech Detected",
                description: "Please try speaking clearly into the microphone",
                variant: "destructive",
              });
              reject(new Error('No transcription returned'));
              return;
            }

            console.log('✅ Transcription success:', data.text);
            resolve(data.text);
          } catch (error) {
            console.error('❌ Transcription error:', error);
            setIsProcessing(false);
            toast({
              title: "Transcription Error",
              description: error instanceof Error ? error.message : "Unknown error occurred",
              variant: "destructive",
            });
            reject(error);
          }
        };

        reader.onerror = () => {
          setIsProcessing(false);
          console.error('❌ FileReader error');
          reject(new Error('Failed to read audio data'));
        };
      };

      // Stop the recorder and all tracks
      recorder.stop();
      recorder.stream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Track stopped:', track.kind);
      });
    });
  }, [toast]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};