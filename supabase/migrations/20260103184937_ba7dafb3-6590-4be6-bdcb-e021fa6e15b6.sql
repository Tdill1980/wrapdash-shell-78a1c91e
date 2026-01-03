-- Media Analysis: AI outputs raw facts only (no opinions, no vibes)
CREATE TABLE IF NOT EXISTS public.media_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.content_files(id) ON DELETE CASCADE,
  has_vehicle BOOLEAN DEFAULT false,
  has_people BOOLEAN DEFAULT false,
  has_install BOOLEAN DEFAULT false,
  has_before_after BOOLEAN DEFAULT false,
  has_reveal BOOLEAN DEFAULT false,
  has_motion BOOLEAN DEFAULT false,
  environment TEXT, -- shop, outdoor, event, studio
  motion_score FLOAT DEFAULT 0, -- 0-1
  energy_level TEXT, -- low, medium, high
  text_detected BOOLEAN DEFAULT false,
  detected_objects TEXT[] DEFAULT '{}',
  detected_actions TEXT[] DEFAULT '{}',
  confidence FLOAT DEFAULT 0,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id)
);

-- Media Tags: Human + System locked tags (authoritative)
CREATE TABLE IF NOT EXISTS public.media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.content_files(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system', -- ai, human, system
  locked BOOLEAN DEFAULT false,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id, tag)
);

-- Content Intent: What the user wants to create (deterministic)
CREATE TABLE IF NOT EXISTS public.content_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- meta_ad, instagram, tiktok, youtube
  goal TEXT, -- conversion, awareness, engagement
  angle TEXT, -- risk_reversal, authority, identity, transformation
  brand TEXT,
  required_tags TEXT[] DEFAULT '{}',
  forbidden_tags TEXT[] DEFAULT '{}',
  min_motion FLOAT DEFAULT 0,
  min_clips INT DEFAULT 3,
  max_clips INT DEFAULT 8,
  caption_style TEXT DEFAULT 'dara', -- sabri, dara, clean
  music_style TEXT DEFAULT 'upbeat',
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_analysis
CREATE POLICY "Users can view media analysis for their org content"
ON public.media_analysis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content_files cf
    JOIN public.organization_members om ON om.organization_id = cf.organization_id
    WHERE cf.id = media_analysis.asset_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert media analysis for their org content"
ON public.media_analysis FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_files cf
    JOIN public.organization_members om ON om.organization_id = cf.organization_id
    WHERE cf.id = asset_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update media analysis for their org content"
ON public.media_analysis FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.content_files cf
    JOIN public.organization_members om ON om.organization_id = cf.organization_id
    WHERE cf.id = media_analysis.asset_id
    AND om.user_id = auth.uid()
  )
);

-- RLS Policies for media_tags
CREATE POLICY "Users can view media tags for their org content"
ON public.media_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content_files cf
    JOIN public.organization_members om ON om.organization_id = cf.organization_id
    WHERE cf.id = media_tags.asset_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage media tags for their org content"
ON public.media_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.content_files cf
    JOIN public.organization_members om ON om.organization_id = cf.organization_id
    WHERE cf.id = media_tags.asset_id
    AND om.user_id = auth.uid()
  )
);

-- RLS Policies for content_intents
CREATE POLICY "Users can view content intents for their org"
ON public.content_intents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = content_intents.organization_id
    AND om.user_id = auth.uid()
  )
  OR is_template = true
);

CREATE POLICY "Users can manage content intents for their org"
ON public.content_intents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = content_intents.organization_id
    AND om.user_id = auth.uid()
  )
);

-- Indexes for fast selection queries
CREATE INDEX IF NOT EXISTS idx_media_analysis_asset_id ON public.media_analysis(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_analysis_has_vehicle ON public.media_analysis(has_vehicle) WHERE has_vehicle = true;
CREATE INDEX IF NOT EXISTS idx_media_analysis_has_install ON public.media_analysis(has_install) WHERE has_install = true;
CREATE INDEX IF NOT EXISTS idx_media_analysis_motion_score ON public.media_analysis(motion_score);
CREATE INDEX IF NOT EXISTS idx_media_tags_asset_tag ON public.media_tags(asset_id, tag);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag ON public.media_tags(tag);
CREATE INDEX IF NOT EXISTS idx_media_tags_locked ON public.media_tags(locked) WHERE locked = true;