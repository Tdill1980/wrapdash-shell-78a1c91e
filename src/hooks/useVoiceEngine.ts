import { useQuery } from "@tanstack/react-query";
import { supabase, lovableFunctions, WPW_FUNCTIONS_URL } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

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

export interface MergedVoice {
  tone: string;
  energy: string;
  persona: string;
  vocabulary: string[];
  cta_style: string;
  humor_level: number;
  style_preference: string;
  overlays: BrandOverlays;
  style_modifiers: StyleModifiers;
}

export interface VoiceProfile {
  brand_defaults: Record<string, any>;
  organization_dna: Record<string, any>;
  customer_override: Record<string, any>;
  merged: MergedVoice;
}

const defaultVoice: MergedVoice = {
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
};

/**
 * Hook to access the Voice Engine for current organization
 * Returns merged voice profile with brand + org + customer overrides
 */
export function useVoiceEngine() {
  const { organizationId, organizationSettings } = useOrganization();

  const { data: voiceProfile, isLoading, error, refetch } = useQuery({
    queryKey: ['voice-profile', organizationId, organizationSettings.subdomain],
    queryFn: async (): Promise<VoiceProfile> => {
      const params = new URLSearchParams();
      if (organizationId) params.set('organizationId', organizationId);
      if (organizationSettings.subdomain) params.set('subdomain', organizationSettings.subdomain);

      const { data, error } = await lovableFunctions.functions.invoke('load-voice-profile', {
        body: null,
        method: 'GET',
      });

      // Fallback to direct fetch if invoke doesn't support GET properly
      if (error || !data?.success) {
        // Use WPW Supabase (NOT Lovable - that's for 3D only)
        const response = await fetch(
          `${WPW_FUNCTIONS_URL}/load-voice-profile?${params.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        const result = await response.json();
        if (result.success) {
          return result.profile;
        }
        throw new Error(result.error || 'Failed to load voice profile');
      }

      return data.profile;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: true,
  });

  return {
    voiceProfile,
    mergedVoice: voiceProfile?.merged || defaultVoice,
    brandDefaults: voiceProfile?.brand_defaults || {},
    organizationDna: voiceProfile?.organization_dna || {},
    customerOverride: voiceProfile?.customer_override || {},
    isLoading,
    error,
    refetch,
    // Helper getters
    tone: voiceProfile?.merged?.tone || defaultVoice.tone,
    energy: voiceProfile?.merged?.energy || defaultVoice.energy,
    persona: voiceProfile?.merged?.persona || defaultVoice.persona,
    styleModifiers: voiceProfile?.merged?.style_modifiers || defaultVoice.style_modifiers,
    overlays: voiceProfile?.merged?.overlays || defaultVoice.overlays,
  };
}

/**
 * Hook to get just the style preference for quick UI decisions
 */
export function useStylePreference() {
  const { mergedVoice } = useVoiceEngine();
  return mergedVoice.style_preference;
}

/**
 * Hook to get brand colors for theming
 */
export function useBrandColors() {
  const { overlays } = useVoiceEngine();
  return {
    primary: overlays.primary_color,
    secondary: overlays.secondary_color,
  };
}
