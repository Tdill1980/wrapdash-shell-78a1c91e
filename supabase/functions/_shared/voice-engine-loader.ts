// Voice Engine Layer - Shared TradeDNA & Brand Voice Loader
// Used by all edge functions to load per-org/per-brand voice profiles

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface BrandVoice {
  tone: string;
  energy: string;
  persona: string;
  vocabulary: string[];
  cta_style: string;
  humor_level: number;
}

export interface BrandOverlays {
  primary_color: string;
  secondary_color: string;
  font_headline: string;
  font_body: string;
  motion_style: string;
}

export interface StyleModifiers {
  sabri: number;
  garyvee: number;
  dara: number;
}

export interface VoiceProfile {
  brand_defaults: {
    brand_id?: string;
    subdomain?: string;
    brand_name?: string;
    brand_voice?: BrandVoice;
    brand_overlays?: BrandOverlays;
    style_modifiers?: StyleModifiers;
  };
  organization_dna: {
    tone?: string;
    persona?: string;
    vocabulary?: {
      signature_phrases?: string[];
      words_to_avoid?: string[];
    };
    sentence_style?: {
      length?: string;
      cadence?: string;
      complexity?: string;
    };
    sales_style?: {
      approach?: string;
      pressure_level?: string;
      confidence_level?: string;
      cta_style?: string;
    };
    customer_profile?: {
      demographics?: string;
      pain_points?: string[];
      desires?: string[];
      emotional_triggers?: string[];
    };
    communication_rules?: Record<string, any>;
  };
  customer_override: {
    persona?: Record<string, any>;
    style_preference?: string;
    ad_angle_preferences?: Record<string, any>;
    content_examples?: any[];
  };
  merged: {
    tone: string;
    energy: string;
    persona: string;
    vocabulary: string[];
    cta_style: string;
    humor_level: number;
    style_preference: string;
    overlays: BrandOverlays;
    style_modifiers: StyleModifiers;
  };
}

/**
 * Load complete voice profile for an organization
 * Merges: brand_defaults < organization_tradedna < customer_voice_profiles
 * Customer overrides take precedence
 */
export async function loadVoiceProfile(
  organizationId?: string,
  subdomain?: string
): Promise<VoiceProfile> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Default empty profile
  const defaultProfile: VoiceProfile = {
    brand_defaults: {},
    organization_dna: {},
    customer_override: {},
    merged: {
      tone: 'professional, confident',
      energy: 'high-performance',
      persona: 'wrap industry expert',
      vocabulary: ['wrap', 'vinyl', 'installation', 'transformation'],
      cta_style: 'action-driven',
      humor_level: 0.2,
      style_preference: 'hybrid',
      overlays: {
        primary_color: '#00AFFF',
        secondary_color: '#4EEAFF',
        font_headline: 'bold sans-serif',
        font_body: 'clean sans',
        motion_style: 'fast, punchy cuts'
      },
      style_modifiers: { sabri: 0.33, garyvee: 0.33, dara: 0.33 }
    }
  };

  try {
    // 1. Load brand defaults by subdomain
    let brandData = null;
    if (subdomain) {
      const { data } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("subdomain", subdomain)
        .single();
      brandData = data;
    }
    
    // Fallback to 'main' if no subdomain match
    if (!brandData) {
      const { data } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("subdomain", "main")
        .single();
      brandData = data;
    }

    // 2. Load organization TradeDNA
    let orgDNA = null;
    if (organizationId) {
      const { data } = await supabase
        .from("organization_tradedna")
        .select("tradedna_profile")
        .eq("organization_id", organizationId)
        .single();
      orgDNA = data?.tradedna_profile;
    }

    // 3. Load customer voice overrides
    let customerVoice = null;
    if (organizationId) {
      const { data } = await supabase
        .from("customer_voice_profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .single();
      customerVoice = data;
    }

    // Build profile
    const profile: VoiceProfile = {
      brand_defaults: brandData || {},
      organization_dna: orgDNA || {},
      customer_override: customerVoice || {},
      merged: defaultProfile.merged
    };

    // Merge with priority: customer > org > brand > defaults
    const brandVoice = brandData?.brand_voice || {};
    const brandOverlays = brandData?.brand_overlays || {};
    const brandModifiers = brandData?.style_modifiers || {};

    profile.merged = {
      tone: customerVoice?.persona?.tone || orgDNA?.tone || brandVoice.tone || defaultProfile.merged.tone,
      energy: customerVoice?.persona?.energy || orgDNA?.sentence_style?.cadence || brandVoice.energy || defaultProfile.merged.energy,
      persona: customerVoice?.persona?.persona || orgDNA?.persona || brandVoice.persona || defaultProfile.merged.persona,
      vocabulary: [
        ...(brandVoice.vocabulary || []),
        ...(orgDNA?.vocabulary?.signature_phrases || []),
        ...(customerVoice?.persona?.vocabulary || [])
      ].filter(Boolean),
      cta_style: customerVoice?.persona?.cta_style || orgDNA?.sales_style?.cta_style || brandVoice.cta_style || defaultProfile.merged.cta_style,
      humor_level: customerVoice?.persona?.humor_level ?? brandVoice.humor_level ?? defaultProfile.merged.humor_level,
      style_preference: customerVoice?.style_preference || 'hybrid',
      overlays: {
        ...defaultProfile.merged.overlays,
        ...brandOverlays,
        ...(customerVoice?.persona?.overlays || {})
      },
      style_modifiers: {
        ...defaultProfile.merged.style_modifiers,
        ...brandModifiers,
        ...(customerVoice?.style_preference === 'sabri' ? { sabri: 0.6, garyvee: 0.2, dara: 0.2 } :
           customerVoice?.style_preference === 'garyvee' ? { sabri: 0.2, garyvee: 0.6, dara: 0.2 } :
           customerVoice?.style_preference === 'dara' ? { sabri: 0.2, garyvee: 0.2, dara: 0.6 } : {})
      }
    };

    console.log('[VoiceEngine] Loaded profile for org:', organizationId, 'subdomain:', subdomain);
    return profile;

  } catch (error) {
    console.error('[VoiceEngine] Error loading voice profile:', error);
    return defaultProfile;
  }
}

/**
 * Quick helper to get just the merged voice for simple use cases
 */
export async function getMergedVoice(organizationId?: string, subdomain?: string) {
  const profile = await loadVoiceProfile(organizationId, subdomain);
  return profile.merged;
}
