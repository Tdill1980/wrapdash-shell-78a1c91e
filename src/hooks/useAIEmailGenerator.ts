import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EmailTone = 'installer' | 'luxury' | 'hype';
export type EmailType = 'quote_initial' | 'quote_followup' | 'proof_ready' | 'order_confirmation' | 'shipping_notification' | 'custom';

interface VehicleInfo {
  year?: string;
  make?: string;
  model?: string;
}

interface GenerateEmailParams {
  customerName: string;
  customerEmail?: string;
  companyName?: string;
  vehicle?: VehicleInfo;
  product?: string;
  price?: number;
  sqft?: number;
  tone: EmailTone;
  emailType: EmailType;
  customPrompt?: string;
  previousEmails?: number;
}

interface GeneratedEmail {
  subjectVariants: string[];
  bodyHtml: string;
  bodyHtmlPreview: string;
  ctaText: string;
  previewText: string;
  mergeTags: Record<string, string>;
}

export function useAIEmailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateEmail = async (params: GenerateEmailParams): Promise<GeneratedEmail | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-generate-email-content', {
        body: params
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('AI rate limit reached. Please wait a moment and try again.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          toast.error(data.error);
        }
        setError(data.error);
        return null;
      }

      setGeneratedEmail(data);
      toast.success('Email content generated!');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate email';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearGenerated = () => {
    setGeneratedEmail(null);
    setError(null);
  };

  return {
    generateEmail,
    isGenerating,
    generatedEmail,
    error,
    clearGenerated
  };
}
