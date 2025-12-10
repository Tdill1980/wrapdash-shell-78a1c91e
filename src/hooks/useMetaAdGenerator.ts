// src/hooks/useMetaAdGenerator.ts

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface MetaAdOutput {
  short_texts: string[];
  long_texts: string[];
  headlines: string[];
  descriptions: string[];
  cta: string;
  angles: Array<{
    name: string;
    primary_text: string;
    headline: string;
  }>;
}

export function useMetaAdGenerator() {
  const [loading, setLoading] = useState(false);
  const [adOutput, setAdOutput] = useState<MetaAdOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async ({
    mediaUrl,
    placement,
    organizationId,
  }: {
    mediaUrl?: string;
    placement: string;
    organizationId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "ai-generate-meta-ads",
        {
          body: {
            media_url: mediaUrl,
            placement,
            organization_id: organizationId,
          },
        }
      );

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "Generation failed");

      setAdOutput(data.output);
      toast.success("Meta ads generated!");
      return data.output;
    } catch (e: any) {
      console.error("Meta ad generation error:", e);
      setError(e.message);
      toast.error("Failed to generate Meta ads");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAdOutput(null);
    setError(null);
  };

  return { generate, loading, adOutput, error, reset };
}
