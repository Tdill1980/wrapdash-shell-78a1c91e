-- =========================
-- 1) content_jobs table
-- =========================
CREATE TABLE IF NOT EXISTS public.content_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  conversation_id uuid NULL,
  requested_by text NOT NULL DEFAULT 'unknown',
  agent text NOT NULL DEFAULT 'noah_bennett',

  status text NOT NULL DEFAULT 'pending', -- pending|approved|executing|completed|failed
  mode text NOT NULL DEFAULT 'preview',   -- preview|execute

  create_content_block text NOT NULL,
  parsed jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- links into existing systems
  delegated_task_id uuid NULL,
  content_queue_id uuid NULL,
  content_draft_id uuid NULL,
  video_edit_queue_id uuid NULL,

  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_jobs_conversation_idx
  ON public.content_jobs(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS content_jobs_status_idx
  ON public.content_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS content_jobs_org_idx
  ON public.content_jobs(organization_id, created_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_content_jobs_updated_at ON public.content_jobs;
CREATE TRIGGER trg_content_jobs_updated_at
BEFORE UPDATE ON public.content_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 2) creative_vault table
-- =========================
CREATE TABLE IF NOT EXISTS public.creative_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  conversation_id uuid NULL,
  job_id uuid NULL REFERENCES public.content_jobs(id) ON DELETE SET NULL,

  type text NOT NULL,         -- video|image|carousel|copy
  platform text NULL,         -- instagram|facebook|youtube|tiktok
  content_type text NULL,     -- reel|story|short|ad
  title text NULL,

  asset_url text NOT NULL,    -- final render url
  thumbnail_url text NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creative_vault_job_idx
  ON public.creative_vault(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS creative_vault_conversation_idx
  ON public.creative_vault(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS creative_vault_org_idx
  ON public.creative_vault(organization_id, created_at DESC);

-- =========================
-- 3) RLS Policies
-- =========================
ALTER TABLE public.content_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_vault ENABLE ROW LEVEL SECURITY;

-- content_jobs policies
CREATE POLICY "content_jobs_select"
ON public.content_jobs
FOR SELECT
TO authenticated
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "content_jobs_insert"
ON public.content_jobs
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "content_jobs_update"
ON public.content_jobs
FOR UPDATE
TO authenticated
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "content_jobs_delete"
ON public.content_jobs
FOR DELETE
TO authenticated
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

-- creative_vault policies
CREATE POLICY "creative_vault_select"
ON public.creative_vault
FOR SELECT
TO authenticated
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "creative_vault_insert"
ON public.creative_vault
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "creative_vault_update"
ON public.creative_vault
FOR UPDATE
TO authenticated
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

CREATE POLICY "creative_vault_delete"
ON public.creative_vault
FOR DELETE
TO authenticated
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);