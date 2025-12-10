CREATE TABLE IF NOT EXISTS youtube_editor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  source_file_url TEXT NOT NULL,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  processing_status TEXT DEFAULT 'pending',
  analysis_data JSONB,
  generated_shorts JSONB,
  enhancement_data JSONB,
  seo_data JSONB,
  thumbnail_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE youtube_editor_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow org-scoped read"
  ON youtube_editor_jobs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Allow org-scoped insert"
  ON youtube_editor_jobs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Allow org-scoped update"
  ON youtube_editor_jobs FOR UPDATE
  USING (organization_id = get_user_organization_id());