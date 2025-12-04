import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceProcessResult {
  transcript: string;
  formData: {
    title: string;
    vehicle_year: string;
    vehicle_make: string;
    vehicle_model: string;
    finish: string;
    job_price: string;
  };
  suggestedTags: string[];
}

export const usePortfolioVoiceInput = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processTranscript = async (transcript: string): Promise<VoiceProcessResult> => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-portfolio-voice', {
        body: { transcript }
      });

      if (error) {
        throw new Error(error.message || 'Processing failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      toast({
        title: 'Voice Processed',
        description: `Extracted: ${data.title || 'Job details'}`
      });

      return {
        transcript: data.transcript,
        formData: {
          title: data.title || '',
          vehicle_year: data.vehicle_year?.toString() || '',
          vehicle_make: data.vehicle_make || '',
          vehicle_model: data.vehicle_model || '',
          finish: data.finish || '',
          job_price: data.job_price?.toString() || ''
        },
        suggestedTags: data.suggested_tags || []
      };
    } catch (error: any) {
      console.error('Voice processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processTranscript, isProcessing };
};
