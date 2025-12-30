-- Create scene_text_overlays table for approved overlays
CREATE TABLE IF NOT EXISTS public.scene_text_overlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  scene_id text NOT NULL,
  
  text text NOT NULL,
  position text NOT NULL DEFAULT 'center',
  animation text NULL,
  start_time numeric NOT NULL,
  end_time numeric NOT NULL,
  
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid NULL,
  approved_at timestamptz NULL,
  
  organization_id uuid NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS scene_text_overlays_job_idx ON public.scene_text_overlays(job_id, approved);

-- Enable RLS
ALTER TABLE public.scene_text_overlays ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "scene_text_overlays_select"
ON public.scene_text_overlays
FOR SELECT
TO authenticated
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "scene_text_overlays_insert"
ON public.scene_text_overlays
FOR INSERT
TO authenticated
WITH CHECK ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "scene_text_overlays_update"
ON public.scene_text_overlays
FOR UPDATE
TO authenticated
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "scene_text_overlays_delete"
ON public.scene_text_overlays
FOR DELETE
TO authenticated
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));