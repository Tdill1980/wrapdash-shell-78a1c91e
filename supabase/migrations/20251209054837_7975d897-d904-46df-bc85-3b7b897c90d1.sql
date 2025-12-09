-- ContentBox AI: Full Media Ingestion + Auto Content Generation System

-- 1. content_files - Stores every uploaded or auto-ingested media file
CREATE TABLE public.content_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  uploader_id UUID,
  source TEXT NOT NULL DEFAULT 'upload', -- instagram, google_drive, dropbox, upload, canva
  source_id TEXT, -- external ID from source platform
  brand TEXT NOT NULL DEFAULT 'wpw', -- wpw, wraptv, inkandedge
  file_type TEXT NOT NULL DEFAULT 'image', -- image, video, reel, raw, audio
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER, -- for video/audio
  tags TEXT[] DEFAULT '{}',
  ai_labels JSONB DEFAULT '{}', -- vision classification results
  transcript TEXT, -- whisper transcript for videos
  dominant_colors TEXT[] DEFAULT '{}', -- for design matching
  vehicle_info JSONB DEFAULT '{}', -- detected vehicle year/make/model
  metadata JSONB DEFAULT '{}', -- any additional metadata from source
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. content_projects - Each AI-generated content pack
CREATE TABLE public.content_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  brand TEXT NOT NULL DEFAULT 'wpw',
  project_type TEXT NOT NULL DEFAULT 'reel', -- reel, static, carousel, thumbnail, story
  content_file_ids UUID[] DEFAULT '{}',
  goal TEXT DEFAULT 'sell', -- sell, educate, entertain, hype, convert
  platform TEXT DEFAULT 'instagram', -- instagram, tiktok, youtube, facebook
  ai_brief TEXT, -- prompt summary
  ai_output JSONB DEFAULT '{}', -- scripts, captions, hooks, hashtags, beat sheet
  canva_export_json JSONB,
  status TEXT DEFAULT 'draft', -- draft, ready, scheduled, published
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  published_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. content_affiliate_uploads - Affiliate raw footage uploads
CREATE TABLE public.content_affiliate_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  content_file_id UUID REFERENCES public.content_files(id),
  brand TEXT DEFAULT 'wpw',
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, processed
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. content_calendar - Auto-scheduled content calendar
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  content_project_id UUID REFERENCES public.content_projects(id),
  brand TEXT NOT NULL,
  platform TEXT NOT NULL, -- instagram, tiktok, youtube, facebook
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL DEFAULT '12:00:00',
  content_type TEXT NOT NULL, -- reel, static, carousel, story
  title TEXT,
  caption TEXT,
  hashtags TEXT[],
  status TEXT DEFAULT 'scheduled', -- scheduled, posted, failed, skipped
  posted_at TIMESTAMP WITH TIME ZONE,
  post_url TEXT,
  engagement_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. content_sync_sources - Connected external accounts
CREATE TABLE public.content_sync_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  source_type TEXT NOT NULL, -- instagram, google_drive, dropbox
  account_name TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  folder_path TEXT, -- for GDrive/Dropbox
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'active', -- active, paused, error
  sync_cursor TEXT, -- pagination cursor for incremental sync
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. content_generation_queue - Queue for auto-generation processing
CREATE TABLE public.content_generation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_file_id UUID REFERENCES public.content_files(id),
  organization_id UUID REFERENCES public.organizations(id),
  brand TEXT NOT NULL,
  generation_type TEXT DEFAULT 'full', -- full, reel_only, caption_only
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_affiliate_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sync_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_files
CREATE POLICY "Users can view content files in their organization"
  ON public.content_files FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert content files"
  ON public.content_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update content files in their organization"
  ON public.content_files FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete content files in their organization"
  ON public.content_files FOR DELETE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for content_projects
CREATE POLICY "Users can view content projects in their organization"
  ON public.content_projects FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert content projects"
  ON public.content_projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update content projects in their organization"
  ON public.content_projects FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete content projects in their organization"
  ON public.content_projects FOR DELETE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for content_affiliate_uploads
CREATE POLICY "Users can view affiliate uploads"
  ON public.content_affiliate_uploads FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Anyone can insert affiliate uploads"
  ON public.content_affiliate_uploads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update affiliate uploads in their organization"
  ON public.content_affiliate_uploads FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for content_calendar
CREATE POLICY "Users can view content calendar in their organization"
  ON public.content_calendar FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can insert content calendar entries"
  ON public.content_calendar FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update content calendar in their organization"
  ON public.content_calendar FOR UPDATE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can delete content calendar in their organization"
  ON public.content_calendar FOR DELETE
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for content_sync_sources
CREATE POLICY "Users can view sync sources in their organization"
  ON public.content_sync_sources FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "Users can manage sync sources in their organization"
  ON public.content_sync_sources FOR ALL
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

-- RLS Policies for content_generation_queue
CREATE POLICY "Users can view generation queue in their organization"
  ON public.content_generation_queue FOR SELECT
  USING (organization_id = get_user_organization_id() OR organization_id IS NULL);

CREATE POLICY "System can manage generation queue"
  ON public.content_generation_queue FOR ALL
  USING (true);

-- Indexes for performance
CREATE INDEX idx_content_files_organization ON public.content_files(organization_id);
CREATE INDEX idx_content_files_brand ON public.content_files(brand);
CREATE INDEX idx_content_files_source ON public.content_files(source);
CREATE INDEX idx_content_files_processing_status ON public.content_files(processing_status);
CREATE INDEX idx_content_files_tags ON public.content_files USING GIN(tags);

CREATE INDEX idx_content_projects_organization ON public.content_projects(organization_id);
CREATE INDEX idx_content_projects_brand ON public.content_projects(brand);
CREATE INDEX idx_content_projects_status ON public.content_projects(status);
CREATE INDEX idx_content_projects_scheduled ON public.content_projects(scheduled_for);

CREATE INDEX idx_content_calendar_organization ON public.content_calendar(organization_id);
CREATE INDEX idx_content_calendar_scheduled ON public.content_calendar(scheduled_date, scheduled_time);
CREATE INDEX idx_content_calendar_status ON public.content_calendar(status);

CREATE INDEX idx_content_generation_queue_status ON public.content_generation_queue(status, priority);

-- Trigger for updated_at
CREATE TRIGGER update_content_files_updated_at
  BEFORE UPDATE ON public.content_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_projects_updated_at
  BEFORE UPDATE ON public.content_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_sync_sources_updated_at
  BEFORE UPDATE ON public.content_sync_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for content updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_calendar;