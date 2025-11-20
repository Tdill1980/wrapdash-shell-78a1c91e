-- Create table to track ApproveFlow email notifications
CREATE TABLE IF NOT EXISTS public.approveflow_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.approveflow_projects(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'proof_delivered', 'revision_requested', 'design_approved', '3d_render_ready', 'chat_message'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'
  provider TEXT DEFAULT 'klaviyo', -- 'klaviyo', 'resend', 'manual'
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_approveflow_email_logs_project_id ON public.approveflow_email_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_approveflow_email_logs_created_at ON public.approveflow_email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.approveflow_email_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view email logs
CREATE POLICY "Anyone can view email logs"
  ON public.approveflow_email_logs
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert email logs
CREATE POLICY "Authenticated users can insert email logs"
  ON public.approveflow_email_logs
  FOR INSERT
  WITH CHECK (true);

-- Allow system to update email logs (for status changes)
CREATE POLICY "System can update email logs"
  ON public.approveflow_email_logs
  FOR UPDATE
  USING (true);

COMMENT ON TABLE public.approveflow_email_logs IS 'Tracks all email notifications sent for ApproveFlow projects';
COMMENT ON COLUMN public.approveflow_email_logs.email_type IS 'Type of email sent';
COMMENT ON COLUMN public.approveflow_email_logs.status IS 'Delivery status of the email';
COMMENT ON COLUMN public.approveflow_email_logs.provider IS 'Email service provider used';