// src/lib/meta-ads/generateMetaCopy.ts

import type { MetaAdCopy, MetaAdVariant, MetaAdPackage, AdAngle } from "./metaCopyTypes";
import { normalizeCTA } from "./ctaMap";
import { AD_ANGLE_LABELS } from "./metaCopyTypes";
import type { MetaPlacement } from "./metaPlacements";
import { getPlacement } from "./metaPlacements";

// Map AI response to structured variants
export function mapAIResponseToVariants(aiOutput: any): MetaAdVariant[] {
  if (!aiOutput || !aiOutput.variants) return [];

  return aiOutput.variants.map((variant: any, index: number) => {
    const angle = variant.angle || `variant_${index + 1}`;
    const angleName = AD_ANGLE_LABELS[angle as AdAngle] || variant.angle_name || `Variant ${index + 1}`;

    return {
      id: `variant_${index + 1}`,
      angle,
      angleName,
      copy: {
        primary_text: variant.primary_text || "",
        headline: variant.headline || "",
        description: variant.description || "",
        link_description: variant.link_description || "",
        cta: normalizeCTA(variant.cta || "learn more"),
      } as MetaAdCopy,
    };
  });
}

// Create a complete MetaAdPackage from AI response
export function createMetaAdPackage(
  aiOutput: any,
  placement: MetaPlacement,
  mediaUrl: string,
  mediaType: "video" | "image",
  organizationId?: string
): MetaAdPackage {
  const placementFormat = getPlacement(placement);
  const variants = mapAIResponseToVariants(aiOutput);

  return {
    id: `meta_ad_${Date.now()}`,
    placement,
    copyVariants: variants,
    videoUrl: mediaType === "video" ? mediaUrl : undefined,
    imageUrl: mediaType === "image" ? mediaUrl : undefined,
    thumbnailUrl: aiOutput.thumbnailUrl,
    width: placementFormat.width,
    height: placementFormat.height,
    createdAt: new Date().toISOString(),
    organizationId,
  };
}

// Generate CSV row for Meta Ads Manager bulk import
export function generateCSVRow(variant: MetaAdVariant, mediaUrl: string): string {
  const { copy } = variant;
  return [
    `"${copy.primary_text.replace(/"/g, '""')}"`,
    `"${copy.headline.replace(/"/g, '""')}"`,
    `"${copy.description?.replace(/"/g, '""') || ""}"`,
    copy.cta,
    `"${mediaUrl}"`,
  ].join(",");
}

// Generate full CSV for Meta Ads Manager
export function generateMetaAdsCSV(adPackage: MetaAdPackage): string {
  const headers = "Primary Text,Headline,Description,CTA,Media URL";
  const mediaUrl = adPackage.videoUrl || adPackage.imageUrl || "";
  
  const rows = adPackage.copyVariants.map((variant) =>
    generateCSVRow(variant, mediaUrl)
  );

  return [headers, ...rows].join("\n");
}

// Generate JSON for Meta Marketing API
export function generateMetaAPIJson(adPackage: MetaAdPackage): object {
  return {
    ad_creative: {
      object_story_spec: {
        page_id: "{{PAGE_ID}}",
        video_data: adPackage.videoUrl
          ? {
              video_id: "{{VIDEO_ID}}",
              image_url: adPackage.thumbnailUrl,
              title: adPackage.copyVariants[0]?.copy.headline || "",
              message: adPackage.copyVariants[0]?.copy.primary_text || "",
              call_to_action: {
                type: adPackage.copyVariants[0]?.copy.cta || "LEARN_MORE",
                value: {
                  link: "{{LANDING_PAGE_URL}}",
                },
              },
            }
          : undefined,
        link_data: !adPackage.videoUrl
          ? {
              image_hash: "{{IMAGE_HASH}}",
              link: "{{LANDING_PAGE_URL}}",
              message: adPackage.copyVariants[0]?.copy.primary_text || "",
              name: adPackage.copyVariants[0]?.copy.headline || "",
              description: adPackage.copyVariants[0]?.copy.description || "",
              call_to_action: {
                type: adPackage.copyVariants[0]?.copy.cta || "LEARN_MORE",
              },
            }
          : undefined,
      },
    },
    variants: adPackage.copyVariants.map((v) => ({
      angle: v.angle,
      angleName: v.angleName,
      ...v.copy,
    })),
    placement: adPackage.placement,
    dimensions: {
      width: adPackage.width,
      height: adPackage.height,
    },
  };
}

// Validate copy against Meta character limits
export function validateMetaCopy(copy: MetaAdCopy): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (copy.primary_text.length > 500) {
    warnings.push(`Primary text exceeds max limit (${copy.primary_text.length}/500)`);
  } else if (copy.primary_text.length > 125) {
    warnings.push(`Primary text exceeds recommended limit (${copy.primary_text.length}/125)`);
  }

  if (copy.headline.length > 255) {
    warnings.push(`Headline exceeds max limit (${copy.headline.length}/255)`);
  } else if (copy.headline.length > 40) {
    warnings.push(`Headline exceeds recommended limit (${copy.headline.length}/40)`);
  }

  if (copy.description && copy.description.length > 255) {
    warnings.push(`Description exceeds max limit (${copy.description.length}/255)`);
  }

  return {
    valid: warnings.filter((w) => w.includes("max")).length === 0,
    warnings,
  };
}
