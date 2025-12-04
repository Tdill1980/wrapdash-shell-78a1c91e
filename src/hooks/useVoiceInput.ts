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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recording in progress'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        
        // Check minimum recording duration
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        const MIN_RECORDING_DURATION = 800; // 800ms minimum for better quality
        const IDEAL_RECORDING_DURATION = 1500; // 1.5s for best results
        
        if (recordingDuration < MIN_RECORDING_DURATION) {
          toast({
            title: "Recording Too Short",
            description: "Hold the button for at least 1 second while speaking",
            variant: "destructive",
          });
          reject(new Error('Recording too short'));
          return;
        }
        
        // Warn if recording might be too short for complex input
        if (recordingDuration < IDEAL_RECORDING_DURATION) {
          console.log('⚠️ Short recording detected, may affect transcription quality');
        }

        setIsProcessing(true);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            setIsProcessing(false);
            reject(new Error('Failed to convert audio'));
            return;
          }

          try {
            // Call edge function for transcription
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
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
              console.error('⚠️ No transcription returned');
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
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, [toast]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};
