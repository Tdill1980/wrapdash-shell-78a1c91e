-- Create caption library table for deterministic caption selection
CREATE TABLE IF NOT EXISTS caption_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  wrap_type_category TEXT NOT NULL CHECK (
    wrap_type_category IN ('commercial_business', 'restyle_personal')
  ),
  pain_type TEXT NOT NULL,
  audience TEXT NOT NULL,
  intensity TEXT NOT NULL CHECK (intensity IN ('low','medium','high')),
  hook TEXT[] NOT NULL,
  agitate TEXT[] NOT NULL,
  resolve TEXT[] NOT NULL,
  cta TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_caption_library_lookup
ON caption_library (wrap_type_category, pain_type, audience, intensity);

-- Enable RLS
ALTER TABLE caption_library ENABLE ROW LEVEL SECURITY;

-- Users can view system captions or their org's captions
CREATE POLICY "Users can view captions"
ON caption_library FOR SELECT
USING (is_system = true OR organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Users can insert captions for their org
CREATE POLICY "Users can insert captions"
ON caption_library FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- Users can update their org's captions (not system ones)
CREATE POLICY "Users can update their captions"
ON caption_library FOR UPDATE
USING (organization_id = get_user_organization_id() AND is_system = false);

-- Users can delete their org's captions (not system ones)
CREATE POLICY "Users can delete their captions"
ON caption_library FOR DELETE
USING (organization_id = get_user_organization_id() AND is_system = false);