-- WPW Agent System - Database Migration
-- Add Ops Desk support columns to tasks table and create new ops tables

-- 1. Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS revenue_impact text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS customer text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS assigned_agent text,
ADD COLUMN IF NOT EXISTS created_by text;

-- 2. Create ops_corrections table for logging agent corrections
CREATE TABLE IF NOT EXISTS public.ops_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  description text NOT NULL,
  corrected_by text NOT NULL,
  target text NOT NULL,
  customer text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create ops_escalations table for tracking escalations to leadership
CREATE TABLE IF NOT EXISTS public.ops_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  description text NOT NULL,
  escalated_by text NOT NULL,
  escalation_targets text[] NOT NULL,
  customer text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE public.ops_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_escalations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for ops_corrections
CREATE POLICY "Admins can manage ops_corrections"
ON public.ops_corrections
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view ops_corrections"
ON public.ops_corrections
FOR SELECT
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

-- 6. Create RLS policies for ops_escalations  
CREATE POLICY "Admins can manage ops_escalations"
ON public.ops_escalations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org members can view ops_escalations"
ON public.ops_escalations
FOR SELECT
USING (
  organization_id IS NULL 
  OR public.is_member_of_organization(auth.uid(), organization_id)
);

-- 7. Add index for faster task lookups by agent
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON public.tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_tasks_revenue_impact ON public.tasks(revenue_impact);