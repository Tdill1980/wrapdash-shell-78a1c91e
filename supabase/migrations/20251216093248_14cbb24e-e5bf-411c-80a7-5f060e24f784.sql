-- Create video_edit_queue table for AI video editing pipeline
CREATE TABLE public.video_edit_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  content_file_id UUID REFERENCES public.content_files(id),
  source_url TEXT NOT NULL,
  title TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  ai_edit_suggestions JSONB DEFAULT '{}'::jsonb,
  selected_music_id UUID,
  selected_music_url TEXT,
  text_overlays JSONB DEFAULT '[]'::jsonb,
  speed_ramps JSONB DEFAULT '[]'::jsonb,
  chapters JSONB DEFAULT '[]'::jsonb,
  shorts_extracted JSONB DEFAULT '[]'::jsonb,
  final_render_url TEXT,
  render_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create music_library table for background music matching
CREATE TABLE public.music_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  bpm INTEGER,
  energy TEXT DEFAULT 'medium',
  mood TEXT DEFAULT 'neutral',
  genre TEXT,
  tags TEXT[] DEFAULT '{}',
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_edit_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_edit_queue
CREATE POLICY "Users can view their org video edits"
  ON public.video_edit_queue FOR SELECT
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert video edits"
  ON public.video_edit_queue FOR INSERT
  WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update their org video edits"
  ON public.video_edit_queue FOR UPDATE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete their org video edits"
  ON public.video_edit_queue FOR DELETE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- RLS policies for music_library
CREATE POLICY "Users can view music"
  ON public.music_library FOR SELECT
  USING ((organization_id = get_user_organization_id()) OR is_global = true OR (organization_id IS NULL));

CREATE POLICY "Users can insert music"
  ON public.music_library FOR INSERT
  WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can update their music"
  ON public.music_library FOR UPDATE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete their music"
  ON public.music_library FOR DELETE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Create index for faster queries
CREATE INDEX idx_video_edit_queue_org ON public.video_edit_queue(organization_id);
CREATE INDEX idx_video_edit_queue_status ON public.video_edit_queue(status);
CREATE INDEX idx_music_library_mood ON public.music_library(mood, energy);