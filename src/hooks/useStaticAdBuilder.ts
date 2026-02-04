// src/hooks/useStaticAdBuilder.ts

import { useState } from "react";
import { toast } from "sonner";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { MetaPlacement } from "@/lib/meta-ads";

export interface StaticAdLayout {
  mode: "template" | "ai" | "grid";
  template_id?: string;
  layout: Record<string, any>;
  content: {
    headline: string;
    primary_text?: string;
    cta: string;
    media_url?: string;
  };
  size: {
    width: number;
    height: number;
  };
}

export interface StaticAdTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const STATIC_AD_TEMPLATES: StaticAdTemplate[] = [
  {
    id: "bold_premium",
    name: "Bold Premium",
    description: "Full bleed vehicle with thick border and large headline",
    preview: "🎯",
  },
  {
    id: "before_after",
    name: "Before/After Split",
    description: "Diagonal split showing transformation",
    preview: "↔️",
  },
  {
    id: "gradient_slick",
    name: "Gradient Slick",
    description: "Modern gradient with centered vehicle",
    preview: "🌈",
  },
  {
    id: "luxury_dark",
    name: "Luxury Dark Mode",
    description: "Matte black with spotlight effect",
    preview: "✨",
  },
  {
    id: "text_left_image_right",
    name: "Text Left / Image Right",
    description: "Classic side-by-side layout",
    preview: "📐",
  },
  {
    id: "ugc_social_proof",
    name: "UGC Social Proof",
    description: "Quote bubble testimonial style",
    preview: "💬",
  },
];

export function useStaticAdBuilder() {
  const [loading, setLoading] = useState(false);
  const [adLayout, setAdLayout] = useState<StaticAdLayout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateStaticAd = async ({
    mode,
    templateId,
    placement,
    headline,
    primaryText,
    cta,
    mediaUrl,
    organizationId,
    brandColors,
  }: {
    mode: "template" | "ai" | "grid";
    templateId?: string;
    placement: MetaPlacement;
    headline: string;
    primaryText?: string;
    cta: string;
    mediaUrl?: string;
    organizationId?: string;
    brandColors?: string[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await lovableFunctions.functions.invoke(
        "ai-generate-static-ad",
        {
          body: {
            mode,
            template_id: templateId,
            placement,
            headline,
            primary_text: primaryText,
            cta,
            media_url: mediaUrl,
            organization_id: organizationId,
            brand_colors: brandColors,
          },
        }
      );

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "Generation failed");

      setAdLayout(data.output);
      toast.success(`Static ad ${mode === "template" ? "template" : "design"} generated!`);
      return data.output;
    } catch (e: any) {
      console.error("Static ad generation error:", e);
      setError(e.message);
      toast.error("Failed to generate static ad");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAdLayout(null);
    setError(null);
  };

  return {
    generateStaticAd,
    loading,
    adLayout,
    error,
    reset,
    templates: STATIC_AD_TEMPLATES,
  };
}
