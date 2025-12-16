// Style Profile Loader - Load organization's extracted visual style from uploaded templates
// Used by render-video-reel and other content generators

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface OrganizationStyleProfile {
  // Name
  style_name?: string;
  
  // Typography
  font_headline: string;
  font_body: string;
  font_weight: string;
  text_case: string;
  
  // Positioning
  hook_position: string;
  body_position: string;
  cta_position: string;
  
  // Colors
  primary_text_color: string;
  secondary_text_color: string;
  accent_color: string;
  shadow_color: string;
  
  // Effects
  text_shadow_enabled: boolean;
  shadow_blur: number;
  text_outline_enabled: boolean;
  outline_width: number;
  
  // Animation
  text_animation: string;
  reveal_style: string;
  
  // Layout
  safe_zone_width: string;
  text_alignment: string;
}

const DEFAULT_STYLE: OrganizationStyleProfile = {
  font_headline: 'Bebas Neue',
  font_body: 'Poppins',
  font_weight: 'bold',
  text_case: 'uppercase',
  hook_position: '15%',
  body_position: '50%',
  cta_position: '85%',
  primary_text_color: '#FFFFFF',
  secondary_text_color: '#FFFFFF',
  accent_color: '#FF6B35',
  shadow_color: 'rgba(0,0,0,0.8)',
  text_shadow_enabled: true,
  shadow_blur: 10,
  text_outline_enabled: false,
  outline_width: 2,
  text_animation: 'fade_in',
  reveal_style: 'scale_pop',
  safe_zone_width: '70%',
  text_alignment: 'center',
};

/**
 * Load organization's style profile extracted from their uploaded Canva templates
 */
export async function loadOrganizationStyle(organizationId?: string): Promise<OrganizationStyleProfile> {
  if (!organizationId) {
    console.log('[StyleLoader] No org ID, returning defaults');
    return DEFAULT_STYLE;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data, error } = await supabase
      .from("organization_style_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (error || !data) {
      console.log('[StyleLoader] No style profile found for org:', organizationId, '- using defaults');
      return DEFAULT_STYLE;
    }

    console.log('[StyleLoader] Loaded style profile for org:', organizationId, 'style:', data.style_name);

    return {
      font_headline: data.font_headline || DEFAULT_STYLE.font_headline,
      font_body: data.font_body || DEFAULT_STYLE.font_body,
      font_weight: data.font_weight || DEFAULT_STYLE.font_weight,
      text_case: data.text_case || DEFAULT_STYLE.text_case,
      hook_position: data.hook_position || DEFAULT_STYLE.hook_position,
      body_position: data.body_position || DEFAULT_STYLE.body_position,
      cta_position: data.cta_position || DEFAULT_STYLE.cta_position,
      primary_text_color: data.primary_text_color || DEFAULT_STYLE.primary_text_color,
      secondary_text_color: data.secondary_text_color || DEFAULT_STYLE.secondary_text_color,
      accent_color: data.accent_color || DEFAULT_STYLE.accent_color,
      shadow_color: data.shadow_color || DEFAULT_STYLE.shadow_color,
      text_shadow_enabled: data.text_shadow_enabled ?? DEFAULT_STYLE.text_shadow_enabled,
      shadow_blur: data.shadow_blur ?? DEFAULT_STYLE.shadow_blur,
      text_outline_enabled: data.text_outline_enabled ?? DEFAULT_STYLE.text_outline_enabled,
      outline_width: data.outline_width ?? DEFAULT_STYLE.outline_width,
      text_animation: data.text_animation || DEFAULT_STYLE.text_animation,
      reveal_style: data.reveal_style || DEFAULT_STYLE.reveal_style,
      safe_zone_width: data.safe_zone_width || DEFAULT_STYLE.safe_zone_width,
      text_alignment: data.text_alignment || DEFAULT_STYLE.text_alignment,
    };
  } catch (err) {
    console.error('[StyleLoader] Error loading style profile:', err);
    return DEFAULT_STYLE;
  }
}

/**
 * Update or create organization style profile from analyzed image
 */
export async function updateOrganizationStyle(
  organizationId: string,
  extractedStyle: Partial<OrganizationStyleProfile>,
  sourceImageUrl: string
): Promise<void> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from("organization_style_profiles")
      .select("id, source_images, analysis_count")
      .eq("organization_id", organizationId)
      .single();

    const sourceImages = existing?.source_images || [];
    if (!sourceImages.includes(sourceImageUrl)) {
      sourceImages.push(sourceImageUrl);
    }

    const updateData = {
      ...extractedStyle,
      organization_id: organizationId,
      source_images: sourceImages,
      last_analyzed_at: new Date().toISOString(),
      analysis_count: (existing?.analysis_count || 0) + 1,
    };

    if (existing) {
      // Update existing
      await supabase
        .from("organization_style_profiles")
        .update(updateData)
        .eq("id", existing.id);
      console.log('[StyleLoader] Updated style profile for org:', organizationId);
    } else {
      // Insert new
      await supabase
        .from("organization_style_profiles")
        .insert(updateData);
      console.log('[StyleLoader] Created new style profile for org:', organizationId);
    }
  } catch (err) {
    console.error('[StyleLoader] Error updating style profile:', err);
    throw err;
  }
}
