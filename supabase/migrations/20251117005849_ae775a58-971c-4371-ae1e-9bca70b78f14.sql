-- ApproveFlow V3 Database Schema
-- Full functional implementation for design approval workflow

-- 1. Main projects table
CREATE TABLE public.approveflow_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID,
  designer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  order_total DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'design_requested',
  product_type TEXT NOT NULL,
  design_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Version history (v1, v2, v3...)
CREATE TABLE public.approveflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  notes TEXT,
  submitted_by TEXT NOT NULL CHECK (submitted_by IN ('designer', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, version_number)
);

-- 3. Chat messages
CREATE TABLE public.approveflow_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('designer', 'customer')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Action history
CREATE TABLE public.approveflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('requested_revision', 'approved', 'delivered_proof', 'design_requested')),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Reference assets
CREATE TABLE public.approveflow_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('reference', 'logo', 'example')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. 3D renders
CREATE TABLE public.approveflow_3d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.approveflow_versions(id) ON DELETE CASCADE,
  render_urls JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.approveflow_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approveflow_3d ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to view and manage
CREATE POLICY "Anyone can view projects" ON public.approveflow_projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert projects" ON public.approveflow_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects" ON public.approveflow_projects FOR UPDATE USING (true);

CREATE POLICY "Anyone can view versions" ON public.approveflow_versions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert versions" ON public.approveflow_versions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat" ON public.approveflow_chat FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send chat" ON public.approveflow_chat FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view actions" ON public.approveflow_actions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create actions" ON public.approveflow_actions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view assets" ON public.approveflow_assets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload assets" ON public.approveflow_assets FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view 3D renders" ON public.approveflow_3d FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create 3D renders" ON public.approveflow_3d FOR INSERT WITH CHECK (true);

-- Trigger to update updated_at on projects
CREATE OR REPLACE FUNCTION public.update_approveflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_approveflow_projects_updated_at
  BEFORE UPDATE ON public.approveflow_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_approveflow_updated_at();

-- Create indexes for performance
CREATE INDEX idx_approveflow_projects_status ON public.approveflow_projects(status);
CREATE INDEX idx_approveflow_projects_order_number ON public.approveflow_projects(order_number);
CREATE INDEX idx_approveflow_versions_project_id ON public.approveflow_versions(project_id);
CREATE INDEX idx_approveflow_chat_project_id ON public.approveflow_chat(project_id);
CREATE INDEX idx_approveflow_actions_project_id ON public.approveflow_actions(project_id);