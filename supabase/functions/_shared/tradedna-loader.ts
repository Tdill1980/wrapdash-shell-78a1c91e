import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface TradeDNAProfile {
  persona?: string;
  brand_voice_summary?: string;
  tone?: {
    primary?: string;
    energy_level?: string;
    formality?: string;
  };
  vocabulary?: {
    signature_phrases?: string[];
    common_words?: string[];
    words_to_avoid?: string[];
  };
  sales_style?: {
    approach?: string;
    pressure?: string;
    cta_style?: string;
    closing_flavor?: string;
  };
  customer_profile?: {
    demographics?: string;
    pain_points?: string[];
    desires?: string[];
  };
  brand_values?: string[];
  do_not_do?: string[];
  communication_rules?: {
    email?: string[];
    chat?: string[];
    approveflow?: string[];
  };
}

export interface TradeDNAData {
  business_name?: string;
  tagline?: string;
  business_category?: string;
  tradedna_profile?: TradeDNAProfile;
}

// Default TradeDNA for WePrintWraps (fallback when no profile exists)
const DEFAULT_TRADEDNA: TradeDNAData = {
  business_name: "WePrintWraps",
  tagline: "Printed Fast. Shipped Fast.",
  business_category: "Vehicle Wrap Printing",
  tradedna_profile: {
    persona: "A confident, fast-moving wrap printing expert who gets it done right",
    brand_voice_summary: "Professional but approachable. Speed and quality focused. Industry expert who speaks installer language.",
    tone: {
      primary: "Confident and Direct",
      energy_level: "High",
      formality: "Professional-Casual"
    },
    vocabulary: {
      signature_phrases: [
        "Printed Fast. Shipped Fast.",
        "We've got you covered",
        "Let's get this wrapped up"
      ],
      common_words: ["print", "wrap", "quality", "fast", "ship"],
      words_to_avoid: ["cheap", "discount", "budget", "slow"]
    },
    sales_style: {
      approach: "Value-driven, not pushy",
      pressure: "Low-pressure but responsive",
      cta_style: "Direct action CTAs",
      closing_flavor: "Reassuring and trust-building"
    },
    customer_profile: {
      demographics: "Wrap installers, shop owners, resellers",
      pain_points: ["Slow printers", "Inconsistent quality", "Unreliable vendors"],
      desires: ["Fast turnaround", "Consistent quality", "Reliable partner"]
    },
    brand_values: ["Speed", "Quality", "Reliability", "Industry expertise"],
    do_not_do: [
      "Sound generic or corporate",
      "Use aggressive sales tactics",
      "Overpromise on timelines",
      "Use jargon customers won't understand"
    ]
  }
};

// Cache for TradeDNA profiles (edge function instance lifetime)
const profileCache = new Map<string, { data: TradeDNAData; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load TradeDNA profile for an organization.
 * Returns default WePrintWraps profile if none exists or on error.
 */
export async function loadTradeDNA(
  organizationId?: string | null
): Promise<TradeDNAData> {
  // If no organization ID, return default
  if (!organizationId) {
    console.log('[TradeDNA] No organization ID provided, using default profile');
    return DEFAULT_TRADEDNA;
  }

  // Check cache first
  const cached = profileCache.get(organizationId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[TradeDNA] Using cached profile for org:', organizationId);
    return cached.data;
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[TradeDNA] Supabase credentials missing, using default profile');
      return DEFAULT_TRADEDNA;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('organization_tradedna')
      .select('business_name, tagline, business_category, tradedna_profile')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('[TradeDNA] Database error:', error.message);
      return DEFAULT_TRADEDNA;
    }

    if (!data || !data.tradedna_profile) {
      console.log('[TradeDNA] No profile found for org:', organizationId, ', using default');
      return DEFAULT_TRADEDNA;
    }

    const profile: TradeDNAData = {
      business_name: data.business_name || DEFAULT_TRADEDNA.business_name,
      tagline: data.tagline || DEFAULT_TRADEDNA.tagline,
      business_category: data.business_category || DEFAULT_TRADEDNA.business_category,
      tradedna_profile: data.tradedna_profile as TradeDNAProfile
    };

    // Cache the profile
    profileCache.set(organizationId, { data: profile, timestamp: Date.now() });
    console.log('[TradeDNA] Loaded and cached profile for org:', organizationId);

    return profile;
  } catch (err) {
    console.error('[TradeDNA] Error loading profile:', err);
    return DEFAULT_TRADEDNA;
  }
}

/**
 * Generate a brand voice prompt section from TradeDNA profile.
 * This can be injected into any AI system prompt.
 */
export function generateBrandVoicePrompt(tradeDNA: TradeDNAData): string {
  const profile = tradeDNA.tradedna_profile;
  if (!profile) {
    return '';
  }

  const sections: string[] = [];

  // Company identity
  sections.push(`You are writing for ${tradeDNA.business_name || 'a vehicle wrap business'}${tradeDNA.tagline ? ` ("${tradeDNA.tagline}")` : ''}.`);

  // Persona
  if (profile.persona) {
    sections.push(`\nBRAND PERSONA: ${profile.persona}`);
  }

  // Voice summary
  if (profile.brand_voice_summary) {
    sections.push(`\nBRAND VOICE: ${profile.brand_voice_summary}`);
  }

  // Tone
  if (profile.tone) {
    const toneDetails = [];
    if (profile.tone.primary) toneDetails.push(`Tone: ${profile.tone.primary}`);
    if (profile.tone.energy_level) toneDetails.push(`Energy: ${profile.tone.energy_level}`);
    if (profile.tone.formality) toneDetails.push(`Formality: ${profile.tone.formality}`);
    if (toneDetails.length > 0) {
      sections.push(`\nTONE: ${toneDetails.join(' | ')}`);
    }
  }

  // Vocabulary
  if (profile.vocabulary) {
    if (profile.vocabulary.signature_phrases?.length) {
      sections.push(`\nSIGNATURE PHRASES TO USE: ${profile.vocabulary.signature_phrases.join(', ')}`);
    }
    if (profile.vocabulary.words_to_avoid?.length) {
      sections.push(`\nWORDS TO AVOID: ${profile.vocabulary.words_to_avoid.join(', ')}`);
    }
  }

  // Sales style
  if (profile.sales_style) {
    const salesDetails = [];
    if (profile.sales_style.approach) salesDetails.push(`Approach: ${profile.sales_style.approach}`);
    if (profile.sales_style.cta_style) salesDetails.push(`CTAs: ${profile.sales_style.cta_style}`);
    if (salesDetails.length > 0) {
      sections.push(`\nSALES STYLE: ${salesDetails.join(' | ')}`);
    }
  }

  // Do not do
  if (profile.do_not_do?.length) {
    sections.push(`\nDO NOT: ${profile.do_not_do.join('; ')}`);
  }

  return sections.join('\n');
}
