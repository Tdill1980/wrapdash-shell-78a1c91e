import { useState } from "react";
import { toast } from "sonner";

interface HybridGenerateParams {
  organizationId: string | null;
  mode: 'auto' | 'hybrid' | 'exact';
  contentType: string;
  hybridBrief: string;
  references: string;
  assets: string;
  mediaUrl?: string;
}

// Campaign-specific generation params
interface CampaignGenerateParams {
  organizationId: string | null;
  campaignId: string;
  contentType: string;
  contentMode: 'meta' | 'organic';
  title: string;
  intentPreset: string;
  brief: string;
  references?: string;
  assets?: string;
}

export interface HybridOutput {
  script?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  // Support both legacy (time, style) and campaign (start, end) formats
  overlays?: Array<{ text: string; time?: string; start?: number; end?: number; style?: string }>;
  media_plan?: {
    cuts?: Array<{ description?: string; duration?: string; start?: number; end?: number }>;
    music_url?: string;
    music_suggestion?: string;
    color_palette?: string[];
    layout_template?: string;
    reference_influence?: string;
  };
}

// Campaign-specific output types
interface CampaignReelOutput {
  type: 'reel';
  mode: 'meta' | 'organic';
  title: string;
  intent_preset?: string;
  overlay_style?: string;
  caption_style?: string;
  music_style?: string;
  overlays: Array<{ text: string; start: number; end: number }>;
  caption: string;
  cta?: string;
}

interface CampaignStaticOutput {
  type: 'static';
  headline: string;
  subtext?: string;
  caption: string;
  cta?: string;
}

interface CampaignCarouselOutput {
  type: 'carousel';
  slides: Array<{ headline: string; subtext?: string }>;
  caption: string;
}

export type CampaignOutput = CampaignReelOutput | CampaignStaticOutput | CampaignCarouselOutput;

export function useHybridGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<HybridOutput | null>(null);
  const [campaignOutput, setCampaignOutput] = useState<CampaignOutput | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<string[] | null>(null);

  const generate = async (params: HybridGenerateParams) => {
    setIsGenerating(true);
    setError(null);
    setOutput(null);
    setRawOutput(null);
    setViolations(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/hybrid-generate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            organization_id: params.organizationId,
            mode: params.mode,
            content_type: params.contentType,
            hybrid_brief: params.hybridBrief,
            references: params.references,
            assets: params.assets,
            media_url: params.mediaUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate hybrid content');
      }

      setRawOutput(data.output);

      // Try to parse the JSON output
      try {
        const parsed = JSON.parse(data.output);
        setOutput(parsed);
      } catch {
        // If not valid JSON, store as raw
        console.warn('Could not parse hybrid output as JSON');
      }

      toast.success("Hybrid content generated!");
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Campaign-locked generation
  const generateCampaignContent = async (params: CampaignGenerateParams) => {
    setIsGenerating(true);
    setError(null);
    setOutput(null);
    setCampaignOutput(null);
    setRawOutput(null);
    setViolations(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/hybrid-generate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            organization_id: params.organizationId,
            campaign_id: params.campaignId,
            content_type: params.contentType,
            content_mode: params.contentMode,
            title: params.title,
            intent_preset: params.intentPreset,
            hybrid_brief: params.brief,
            references: params.references || '',
            assets: params.assets || '',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate campaign content');
      }

      setRawOutput(data.output);
      
      // Track violations if any
      if (data.violations && data.violations.length > 0) {
        setViolations(data.violations);
        console.warn('Campaign output had violations:', data.violations);
      }

      // Try to parse the JSON output
      try {
        console.log('[CampaignGen] raw output:', data.output);
        const parsed = JSON.parse(data.output);
        console.log('[CampaignGen] parsed output:', parsed);
        setCampaignOutput(parsed as CampaignOutput);
        setOutput(parsed);
      } catch (parseErr) {
        console.warn('[CampaignGen] Could not parse campaign output as JSON:', parseErr);
      }

      toast.success("Campaign content generated!");
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setOutput(null);
    setCampaignOutput(null);
    setRawOutput(null);
    setError(null);
    setViolations(null);
  };

  return {
    generate,
    generateCampaignContent,
    reset,
    isGenerating,
    output,
    campaignOutput,
    rawOutput,
    error,
    violations,
  };
}
