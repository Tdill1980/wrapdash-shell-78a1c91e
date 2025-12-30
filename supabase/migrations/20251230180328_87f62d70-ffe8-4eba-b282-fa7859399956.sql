-- Create system_issues table for Jackson to log issues
CREATE TABLE public.system_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Org / user context
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core issue info
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (
    category IN (
      'content_calendar',
      'instagram',
      'dm_chat',
      'email',
      'ads',
      'quotes',
      'ui_ux',
      'automation',
      'other'
    )
  ),
  
  -- Impact = can Jackson continue or not
  impact text NOT NULL CHECK (
    impact IN (
      'blocking',
      'slows_me_down',
      'cosmetic'
    )
  ),
  
  -- Lifecycle
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN (
      'open',
      'acknowledged',
      'in_progress',
      'resolved'
    )
  ),
  
  -- Critical unblocker
  workaround text,
  
  -- Context
  page_url text,
  related_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  
  -- Resolution
  resolution_notes text,
  resolved_at timestamptz,
  
  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_issues ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER set_system_issues_updated_at
  BEFORE UPDATE ON public.system_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX system_issues_org_idx ON public.system_issues (organization_id);
CREATE INDEX system_issues_status_idx ON public.system_issues (status);
CREATE INDEX system_issues_impact_idx ON public.system_issues (impact);
CREATE INDEX system_issues_category_idx ON public.system_issues (category);
CREATE INDEX system_issues_created_at_idx ON public.system_issues (created_at DESC);
CREATE INDEX system_issues_reported_by_idx ON public.system_issues (reported_by);

-- RLS Policies

-- Users can view their own issues
CREATE POLICY "Users can view their own issues"
  ON public.system_issues
  FOR SELECT
  USING (auth.uid() = reported_by);

-- Users can create issues
CREATE POLICY "Users can create issues"
  ON public.system_issues
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Admins/owners can view all issues in their org
CREATE POLICY "Admins can view all org issues"
  ON public.system_issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = system_issues.organization_id
        AND om.role IN ('admin', 'owner')
    )
  );

-- Admins/owners can update issues in their org
CREATE POLICY "Admins can update org issues"
  ON public.system_issues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = system_issues.organization_id
        AND om.role IN ('admin', 'owner')
    )
  );

-- Admins/owners can delete issues in their org
CREATE POLICY "Admins can delete org issues"
  ON public.system_issues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = system_issues.organization_id
        AND om.role IN ('admin', 'owner')
    )
  );