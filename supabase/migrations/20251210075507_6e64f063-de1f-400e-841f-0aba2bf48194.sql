-- ===============================
--  CONTENT ATOM STORAGE SYSTEM
-- ===============================

-- 1. Main atom table
CREATE TABLE IF NOT EXISTS content_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- source category
  source_type TEXT NOT NULL DEFAULT 'other',
  
  -- atom classification
  atom_type TEXT NOT NULL DEFAULT 'idea',
  
  original_text TEXT NOT NULL,
  processed_text TEXT,
  
  -- AI tag support
  tags TEXT[] DEFAULT '{}',
  
  -- link to product (optional)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- AI-detected ad angles
  ad_angles TEXT[] DEFAULT '{}',
  
  -- suggested output formats
  suggested_formats TEXT[] DEFAULT '{}',
  
  -- usage intelligence
  is_used BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS — secure per organization
ALTER TABLE content_atoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org can read atoms"
  ON content_atoms FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "org can insert atoms"
  ON content_atoms FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "org can update atoms"
  ON content_atoms FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "org can delete atoms"
  ON content_atoms FOR DELETE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);