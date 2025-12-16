-- Create organization_style_profiles table
-- Stores extracted visual styles from uploaded Canva templates/inspo images
CREATE TABLE public.organization_style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  style_name TEXT DEFAULT 'House Style',
  
  -- Typography
  font_headline TEXT DEFAULT 'Bebas Neue',
  font_body TEXT DEFAULT 'Poppins',
  font_weight TEXT DEFAULT 'bold',
  text_case TEXT DEFAULT 'uppercase',
  
  -- Text Positioning (percentages from top)
  hook_position TEXT DEFAULT '15%',
  body_position TEXT DEFAULT '50%',
  cta_position TEXT DEFAULT '85%',
  
  -- Colors
  primary_text_color TEXT DEFAULT '#FFFFFF',
  secondary_text_color TEXT DEFAULT '#FFFFFF',
  accent_color TEXT DEFAULT '#FF6B35',
  shadow_color TEXT DEFAULT 'rgba(0,0,0,0.8)',
  
  -- Text Effects
  text_shadow_enabled BOOLEAN DEFAULT true,
  shadow_blur INTEGER DEFAULT 10,
  text_outline_enabled BOOLEAN DEFAULT false,
  outline_width INTEGER DEFAULT 2,
  
  -- Animation Style
  text_animation TEXT DEFAULT 'fade_in',
  reveal_style TEXT DEFAULT 'scale_pop',
  
  -- Layout
  safe_zone_width TEXT DEFAULT '70%',
  text_alignment TEXT DEFAULT 'center',
  
  -- Source tracking
  source_images JSONB DEFAULT '[]',
  last_analyzed_at TIMESTAMPTZ,
  analysis_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_org_style UNIQUE (organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_style_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their org style" ON public.organization_style_profiles
  FOR SELECT USING (public.is_member_of_organization(auth.uid(), organization_id));

CREATE POLICY "Users can update their org style" ON public.organization_style_profiles
  FOR UPDATE USING (public.is_member_of_organization(auth.uid(), organization_id));

CREATE POLICY "Users can insert their org style" ON public.organization_style_profiles
  FOR INSERT WITH CHECK (public.is_member_of_organization(auth.uid(), organization_id));

-- Update trigger
CREATE TRIGGER update_organization_style_profiles_updated_at
  BEFORE UPDATE ON public.organization_style_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index
CREATE INDEX idx_org_style_profiles_org ON public.organization_style_profiles(organization_id);