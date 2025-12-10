-- Voice Engine Layer: Multi-Brand / Multi-Tenant Voice Profiles

-- Brand profiles for core brands (WPW, WrapTV, Ink&Edge, RestylePro, WC Software)
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  brand_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain text UNIQUE NOT NULL,
  brand_name text NOT NULL,
  brand_voice jsonb DEFAULT '{}'::jsonb,
  brand_overlays jsonb DEFAULT '{}'::jsonb,
  brand_ad_examples jsonb DEFAULT '[]'::jsonb,
  style_modifiers jsonb DEFAULT '{"sabri": 0.33, "garyvee": 0.33, "dara": 0.33}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Customer voice profiles for SaaS customers (Houdini, JBSWraps, etc.)
CREATE TABLE IF NOT EXISTS public.customer_voice_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  trade_dna jsonb DEFAULT '{}'::jsonb,
  persona jsonb DEFAULT '{}'::jsonb,
  ad_angle_preferences jsonb DEFAULT '{}'::jsonb,
  style_preference text DEFAULT 'hybrid',
  content_examples jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_voice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_profiles (public read, admin write)
CREATE POLICY "Anyone can view brand profiles" ON public.brand_profiles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage brand profiles" ON public.brand_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for customer_voice_profiles (org-scoped)
CREATE POLICY "Users can view their org voice profile" ON public.customer_voice_profiles
  FOR SELECT USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can manage their org voice profile" ON public.customer_voice_profiles
  FOR ALL USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Seed default brand profiles
INSERT INTO public.brand_profiles (subdomain, brand_name, brand_voice, brand_overlays, style_modifiers) VALUES
(
  'main',
  'WePrintWraps',
  '{"tone": "direct, confident, B2B professional", "energy": "high-performance, controlled hype", "persona": "the print provider pros trust", "vocabulary": ["visualization", "print-ready", "production", "wholesale"], "cta_style": "order-driven", "humor_level": 0.2}'::jsonb,
  '{"primary_color": "#00AFFF", "secondary_color": "#4EEAFF", "font_headline": "bold sans-serif", "font_body": "clean sans", "motion_style": "fast, punchy cuts"}'::jsonb,
  '{"sabri": 0.4, "garyvee": 0.3, "dara": 0.3}'::jsonb
),
(
  'wraptv',
  'WrapTV',
  '{"tone": "entertaining, educational, industry insider", "energy": "broadcast energy, polished", "persona": "the wrap industrys media hub", "vocabulary": ["industry", "trends", "installers", "community"], "cta_style": "subscribe-driven", "humor_level": 0.4}'::jsonb,
  '{"primary_color": "#FF6B35", "secondary_color": "#FFD700", "font_headline": "bold display", "font_body": "readable sans", "motion_style": "broadcast quality, smooth transitions"}'::jsonb,
  '{"sabri": 0.2, "garyvee": 0.5, "dara": 0.3}'::jsonb
),
(
  'inkandedge',
  'Ink & Edge',
  '{"tone": "creative, visionary, design-forward", "energy": "artistic, inspired", "persona": "the designers design partner", "vocabulary": ["creative", "custom", "artistry", "vision"], "cta_style": "design-driven", "humor_level": 0.1}'::jsonb,
  '{"primary_color": "#833AB4", "secondary_color": "#E1306C", "font_headline": "elegant sans", "font_body": "refined sans", "motion_style": "cinematic, slow reveals"}'::jsonb,
  '{"sabri": 0.3, "garyvee": 0.2, "dara": 0.5}'::jsonb
),
(
  'software',
  'WrapCommand AI',
  '{"tone": "innovative, tech-forward, SaaS professional", "energy": "cutting-edge, confident", "persona": "the AI platform for wrap shops", "vocabulary": ["AI-powered", "automation", "scale", "efficiency"], "cta_style": "demo-driven", "humor_level": 0.15}'::jsonb,
  '{"primary_color": "#405DE6", "secondary_color": "#833AB4", "font_headline": "modern tech sans", "font_body": "clean system font", "motion_style": "sleek, tech-inspired"}'::jsonb,
  '{"sabri": 0.35, "garyvee": 0.35, "dara": 0.3}'::jsonb
)
ON CONFLICT (subdomain) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_profiles_subdomain ON public.brand_profiles(subdomain);
CREATE INDEX IF NOT EXISTS idx_customer_voice_profiles_org ON public.customer_voice_profiles(organization_id);