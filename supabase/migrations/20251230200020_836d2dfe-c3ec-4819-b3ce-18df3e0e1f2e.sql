-- Create agent_alerts table for unified alert tracking
CREATE TABLE public.agent_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  agent_id text NOT NULL DEFAULT 'jordan_lee',
  alert_type text NOT NULL, -- missing_tracking, unhappy_customer, bulk_inquiry, quality_issue, design_file
  order_id uuid REFERENCES public.shopflow_orders(id),
  order_number text,
  customer_name text,
  customer_email text,
  conversation_id uuid REFERENCES public.conversations(id),
  message_excerpt text,
  email_sent_to text[],
  email_sent_at timestamptz,
  task_id uuid REFERENCES public.tasks(id),
  task_status text DEFAULT 'pending', -- pending, acknowledged, resolved
  priority text DEFAULT 'medium', -- high, medium, low
  resolved_by text,
  resolved_at timestamptz,
  resolution_notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view alerts in their organization"
  ON public.agent_alerts FOR SELECT
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert alerts"
  ON public.agent_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update alerts in their organization"
  ON public.agent_alerts FOR UPDATE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete alerts in their organization"
  ON public.agent_alerts FOR DELETE
  USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Add index for common queries
CREATE INDEX idx_agent_alerts_type ON public.agent_alerts(alert_type);
CREATE INDEX idx_agent_alerts_status ON public.agent_alerts(task_status);
CREATE INDEX idx_agent_alerts_created ON public.agent_alerts(created_at DESC);
CREATE INDEX idx_agent_alerts_order ON public.agent_alerts(order_id);

-- Add trigger for updated_at
CREATE TRIGGER update_agent_alerts_updated_at
  BEFORE UPDATE ON public.agent_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();