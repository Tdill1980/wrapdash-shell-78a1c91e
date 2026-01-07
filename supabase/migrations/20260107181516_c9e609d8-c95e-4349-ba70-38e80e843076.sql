-- ============================================
-- ApproveFlow OS: Proof Artifact System
-- ============================================
-- Creates versioned proof artifacts with full audit trail.
-- Supports revision history, immutable sent proofs, and event logging.
-- ============================================

-- Add render_spec_version column to approveflow_proof_versions
ALTER TABLE public.approveflow_proof_versions 
ADD COLUMN IF NOT EXISTS render_spec_version TEXT DEFAULT 'WPW_STUDIO_V1';

ALTER TABLE public.approveflow_proof_versions 
ADD COLUMN IF NOT EXISTS pdf_template_version TEXT DEFAULT 'PROOF_PDF_V1';

ALTER TABLE public.approveflow_proof_versions 
ADD COLUMN IF NOT EXISTS branding_template_version TEXT DEFAULT 'BRANDING_V1';

ALTER TABLE public.approveflow_proof_versions 
ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1;

ALTER TABLE public.approveflow_proof_versions 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Create approveflow_proof_events table for audit trail
CREATE TABLE IF NOT EXISTS public.approveflow_proof_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id UUID NOT NULL REFERENCES public.approveflow_proof_versions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on proof events
ALTER TABLE public.approveflow_proof_events ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for proof events
CREATE POLICY "Allow authenticated read on proof_events" 
ON public.approveflow_proof_events 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert on proof_events" 
ON public.approveflow_proof_events 
FOR INSERT 
WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_proof_events_proof_id 
ON public.approveflow_proof_events(proof_id);

CREATE INDEX IF NOT EXISTS idx_proof_events_event_type 
ON public.approveflow_proof_events(event_type);

-- Add unique constraint for project_id + revision to prevent duplicate revisions
-- First check if it exists to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'approveflow_proof_versions_project_revision_unique'
  ) THEN
    ALTER TABLE public.approveflow_proof_versions 
    ADD CONSTRAINT approveflow_proof_versions_project_revision_unique 
    UNIQUE (project_id, revision);
  END IF;
END $$;

-- Add constraint to approveflow_3d for project_id + version_id uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'approveflow_3d_project_version_unique'
  ) THEN
    ALTER TABLE public.approveflow_3d 
    ADD CONSTRAINT approveflow_3d_project_version_unique 
    UNIQUE (project_id, version_id);
  END IF;
END $$;

-- Create function to auto-increment revision number
CREATE OR REPLACE FUNCTION public.set_proof_revision()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the max revision for this project and increment
  SELECT COALESCE(MAX(revision), 0) + 1 INTO NEW.revision
  FROM public.approveflow_proof_versions
  WHERE project_id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-incrementing revision (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_set_proof_revision'
  ) THEN
    CREATE TRIGGER trigger_set_proof_revision
    BEFORE INSERT ON public.approveflow_proof_versions
    FOR EACH ROW
    WHEN (NEW.revision IS NULL OR NEW.revision = 1)
    EXECUTE FUNCTION public.set_proof_revision();
  END IF;
END $$;

-- Create function to log proof events automatically
CREATE OR REPLACE FUNCTION public.log_proof_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.approveflow_proof_events (proof_id, event_type, actor, metadata)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'sent' THEN 'sent'
        WHEN 'approved' THEN 'approved'
        WHEN 'changes_requested' THEN 'feedback'
        WHEN 'superseded' THEN 'deleted'
        ELSE 'revised'
      END,
      'system',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW()
      )
    );
  END IF;
  
  -- Set sent_at when status changes to 'sent'
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    NEW.sent_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status change logging (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_log_proof_status_change'
  ) THEN
    CREATE TRIGGER trigger_log_proof_status_change
    BEFORE UPDATE ON public.approveflow_proof_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_proof_status_change();
  END IF;
END $$;