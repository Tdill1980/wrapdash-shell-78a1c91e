-- ============================================
-- PHASE 1: Enable Realtime for approveflow_3d
-- ============================================
-- This is the MISSING table - root cause of "render generated but nothing shows"
-- Other approveflow tables are already in the publication

ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_3d;

-- ============================================
-- PHASE 2: Create Approval OS Tables
-- ============================================
-- These tables are ADDITIVE - they do not modify existing tables
-- Production specs live with proof versions, NOT projects

-- approveflow_proof_versions: Immutable proof artifacts
CREATE TABLE IF NOT EXISTS public.approveflow_proof_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to existing entities (non-breaking)
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.approveflow_versions(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  
  -- Locked branding (OS-owned, never AI/user editable)
  system_name TEXT NOT NULL DEFAULT 'WrapCommand AI™',
  tool_name TEXT NOT NULL DEFAULT 'ApproveFlow™',
  
  -- Proof lifecycle (draft → ready → sent → approved → void)
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','sent','approved','void')),
  
  -- Vehicle identity (snapshot at proof time)
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  
  -- REQUIRED BY OS (approval blocked if missing)
  total_sq_ft NUMERIC,
  wrap_scope TEXT CHECK (wrap_scope IS NULL OR wrap_scope IN ('Full Wrap','Partial Wrap','Graphics Only')),
  
  -- Terms/Disclaimer toggle
  include_full_terms BOOLEAN NOT NULL DEFAULT true,
  
  -- Generated artifact
  proof_pdf_url TEXT,
  
  -- Internal notes (never client-facing)
  internal_notes TEXT,
  
  -- Audit trail
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

-- approveflow_production_specs: Optional fields with N/A toggles
CREATE TABLE IF NOT EXISTS public.approveflow_production_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_version_id UUID NOT NULL REFERENCES public.approveflow_proof_versions(id) ON DELETE CASCADE,
  
  -- OPTIONAL fields (may be marked N/A - if N/A, hidden from proof)
  wheelbase TEXT,
  wheelbase_is_na BOOLEAN NOT NULL DEFAULT false,
  
  roof_height TEXT,
  roof_height_is_na BOOLEAN NOT NULL DEFAULT false,
  
  body_length TEXT,
  body_length_is_na BOOLEAN NOT NULL DEFAULT false,
  
  scale_reference TEXT,
  scale_reference_is_na BOOLEAN NOT NULL DEFAULT false,
  
  panel_count INTEGER,
  panel_count_is_na BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- approveflow_proof_views: Exactly 6 required views
CREATE TABLE IF NOT EXISTS public.approveflow_proof_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_version_id UUID NOT NULL REFERENCES public.approveflow_proof_versions(id) ON DELETE CASCADE,
  
  -- OS-required view keys (exactly these 6)
  view_key TEXT NOT NULL CHECK (view_key IN ('driver','passenger','front','rear','top','detail')),
  label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proof_version_id, view_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approveflow_proof_versions_project ON public.approveflow_proof_versions(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approveflow_proof_versions_order ON public.approveflow_proof_versions(order_number);
CREATE INDEX IF NOT EXISTS idx_approveflow_specs_proof ON public.approveflow_production_specs(proof_version_id);
CREATE INDEX IF NOT EXISTS idx_approveflow_views_proof ON public.approveflow_proof_views(proof_version_id);

-- Enable RLS on all new tables
ALTER TABLE public.approveflow_proof_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_production_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_proof_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approveflow_proof_versions
CREATE POLICY "Authenticated users can view proof versions"
ON public.approveflow_proof_versions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create proof versions"
ON public.approveflow_proof_versions
FOR INSERT TO authenticated
WITH CHECK (true);

-- IMMUTABILITY: Only draft/ready proofs can be updated
CREATE POLICY "Proof versions can only be updated when draft or ready"
ON public.approveflow_proof_versions
FOR UPDATE TO authenticated
USING (status IN ('draft', 'ready'))
WITH CHECK (status IN ('draft', 'ready', 'sent', 'approved', 'void'));

-- RLS Policies for approveflow_production_specs
CREATE POLICY "Authenticated users can view production specs"
ON public.approveflow_production_specs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create production specs"
ON public.approveflow_production_specs
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Production specs can be updated via proof version status"
ON public.approveflow_production_specs
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.approveflow_proof_versions pv
    WHERE pv.id = proof_version_id AND pv.status IN ('draft', 'ready')
  )
)
WITH CHECK (true);

-- RLS Policies for approveflow_proof_views
CREATE POLICY "Authenticated users can view proof views"
ON public.approveflow_proof_views
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create proof views"
ON public.approveflow_proof_views
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Proof views can be updated via proof version status"
ON public.approveflow_proof_views
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.approveflow_proof_versions pv
    WHERE pv.id = proof_version_id AND pv.status IN ('draft', 'ready')
  )
)
WITH CHECK (true);

-- Enable realtime for new OS tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_proof_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_production_specs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_proof_views;