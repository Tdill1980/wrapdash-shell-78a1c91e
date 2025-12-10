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

interface HybridOutput {
  script?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  overlays?: Array<{ text: string; time: string; style: string }>;
  media_plan?: {
    cuts?: Array<{ description?: string; duration?: string; start?: number; end?: number }>;
    music_url?: string;
    music_suggestion?: string;
    color_palette?: string[];
    layout_template?: string;
    reference_influence?: string;
  };
}

export function useHybridGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<HybridOutput | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (params: HybridGenerateParams) => {
    setIsGenerating(true);
    setError(null);
    setOutput(null);
    setRawOutput(null);

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

  const reset = () => {
    setOutput(null);
    setRawOutput(null);
    setError(null);
  };

  return {
    generate,
    reset,
    isGenerating,
    output,
    rawOutput,
    error,
  };
}
