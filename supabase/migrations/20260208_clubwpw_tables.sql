-- ClubWPW Vault + Wrap of the Week Tables
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CLUBWPW VAULT DROPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clubwpw_vault_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Design Info
  design_name TEXT NOT NULL,
  design_description TEXT,
  designer_name TEXT,
  designer_instagram TEXT,
  
  -- Preview Images
  preview_image_url TEXT NOT NULL,
  hero_render_url TEXT,
  thumbnail_url TEXT,
  
  -- Downloadable Files (by size)
  files JSONB DEFAULT '{}',
  
  -- Panel Type
  panel_type TEXT DEFAULT 'full_panel',
  
  -- Scheduling
  featured_month TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft',
  is_exclusive BOOLEAN DEFAULT true,
  
  -- Stats
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  restyle_clicks INTEGER DEFAULT 0,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_drops_month ON clubwpw_vault_drops(featured_month);
CREATE INDEX IF NOT EXISTS idx_vault_drops_status ON clubwpw_vault_drops(status);

-- =====================================================
-- 2. WRAP OF THE WEEK - NOMINEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wotw_nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Wrap Info
  wrap_title TEXT,
  wrap_description TEXT,
  
  -- Artist Info
  artist_name TEXT NOT NULL,
  artist_instagram TEXT NOT NULL,
  artist_email TEXT,
  
  -- Images
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  hero_image_url TEXT,
  
  -- Vehicle Info
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  
  -- Voting Period
  week_of TEXT NOT NULL,
  voting_starts TIMESTAMPTZ,
  voting_ends TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending',
  is_finalist BOOLEAN DEFAULT false,
  is_winner BOOLEAN DEFAULT false,
  
  -- Votes
  vote_count INTEGER DEFAULT 0,
  
  -- Printed by WPW?
  printed_by_wpw BOOLEAN DEFAULT false,
  wpw_order_number TEXT,
  
  -- Social
  instagram_post_url TEXT,
  notified_at TIMESTAMPTZ,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wotw_week ON wotw_nominees(week_of);
CREATE INDEX IF NOT EXISTS idx_wotw_status ON wotw_nominees(status);
CREATE INDEX IF NOT EXISTS idx_wotw_finalist ON wotw_nominees(is_finalist);

-- =====================================================
-- 3. WRAP OF THE WEEK - VOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wotw_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  nominee_id UUID REFERENCES wotw_nominees(id) ON DELETE CASCADE,
  
  -- Voter Info
  voter_fingerprint TEXT NOT NULL,
  voter_email TEXT,
  voter_ip TEXT,
  
  -- Week
  week_of TEXT NOT NULL,
  
  -- Timestamps
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate votes per week
  UNIQUE(voter_fingerprint, week_of)
);

CREATE INDEX IF NOT EXISTS idx_votes_nominee ON wotw_votes(nominee_id);
CREATE INDEX IF NOT EXISTS idx_votes_week ON wotw_votes(week_of);

-- =====================================================
-- 4. VAULT DOWNLOADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clubwpw_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  drop_id UUID REFERENCES clubwpw_vault_drops(id) ON DELETE SET NULL,
  
  -- Downloader Info
  email TEXT NOT NULL,
  name TEXT,
  company_name TEXT,
  instagram TEXT,
  
  -- Download Details
  size_downloaded TEXT,
  
  -- Source
  source TEXT DEFAULT 'shopflow',
  
  -- Timestamps
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_drop ON clubwpw_downloads(drop_id);
CREATE INDEX IF NOT EXISTS idx_downloads_email ON clubwpw_downloads(email);

-- =====================================================
-- 5. Enable RLS
-- =====================================================
ALTER TABLE clubwpw_vault_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE wotw_nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE wotw_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubwpw_downloads ENABLE ROW LEVEL SECURITY;

-- Public read for active drops
CREATE POLICY "Public can view active drops" ON clubwpw_vault_drops
  FOR SELECT USING (status = 'active');

-- Public read for finalists
CREATE POLICY "Public can view finalists" ON wotw_nominees
  FOR SELECT USING (is_finalist = true OR is_winner = true);

-- Public can vote
CREATE POLICY "Public can vote" ON wotw_votes
  FOR INSERT WITH CHECK (true);

-- Public can download
CREATE POLICY "Public can download" ON clubwpw_downloads
  FOR INSERT WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access vault" ON clubwpw_vault_drops
  FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "Service role full access nominees" ON wotw_nominees
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access votes" ON wotw_votes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access downloads" ON clubwpw_downloads
  FOR ALL USING (true) WITH CHECK (true);
