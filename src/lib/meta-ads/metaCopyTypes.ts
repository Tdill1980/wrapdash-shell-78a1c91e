// src/lib/meta-ads/metaCopyTypes.ts

import type { MetaCTA } from "./ctaMap";
import type { MetaPlacement } from "./metaPlacements";

export interface MetaAdCopy {
  primary_text: string;
  headline: string;
  description?: string;
  link_description?: string;
  cta: MetaCTA;
}

export type AdAngle =
  | "direct_offer"
  | "emotional"
  | "speed_turnaround"
  | "before_after"
  | "authority_trust"
  | "specialty_wrap"
  | "urgency"
  | "social_proof";

export interface MetaAdVariant {
  id: string;
  angle: AdAngle | string;
  angleName: string;
  copy: MetaAdCopy;
}

export interface MetaAdPackage {
  id: string;
  placement: MetaPlacement;
  copyVariants: MetaAdVariant[];
  videoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  createdAt: string;
  organizationId?: string;
}

export interface MetaAdGenerationRequest {
  mediaUrl: string;
  mediaType: "video" | "image";
  placement: MetaPlacement;
  organizationId?: string;
  customPrompt?: string;
  numberOfVariants?: number;
}

export interface MetaAdGenerationResponse {
  success: boolean;
  package?: MetaAdPackage;
  error?: string;
}

// Ad angle display names
export const AD_ANGLE_LABELS: Record<AdAngle, string> = {
  direct_offer: "Direct Offer",
  emotional: "Emotional Transformation",
  speed_turnaround: "Speed & Turnaround",
  before_after: "Before/After",
  authority_trust: "Authority & Trust",
  specialty_wrap: "Specialty Wrap",
  urgency: "Urgency/Scarcity",
  social_proof: "Social Proof",
};

// Character limits for Meta Ads
export const META_CHAR_LIMITS = {
  primary_text: {
    recommended: 125,
    max: 500,
  },
  headline: {
    recommended: 40,
    max: 255,
  },
  description: {
    recommended: 30,
    max: 255,
  },
  link_description: {
    recommended: 20,
    max: 30,
  },
};
