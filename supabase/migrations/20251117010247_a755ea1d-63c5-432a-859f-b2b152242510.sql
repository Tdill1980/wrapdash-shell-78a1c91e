-- Create storage bucket for ApproveFlow files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('approveflow-files', 'approveflow-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view approveflow files"
ON storage.objects FOR SELECT
USING (bucket_id = 'approveflow-files');

CREATE POLICY "Authenticated users can upload approveflow files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'approveflow-files');

-- Insert demo project with proper UUID
INSERT INTO public.approveflow_projects (
  order_number,
  customer_name,
  customer_email,
  order_total,
  status,
  product_type,
  design_instructions
) VALUES (
  'WPW-2024-001',
  'John Smith',
  'john@example.com',
  1299.99,
  'awaiting_feedback',
  'Full Vehicle Wrap',
  'Customer wants a matte black base with purple and pink gradient accents. Modern, aggressive look. Racing stripes optional.'
) ON CONFLICT (order_number) DO NOTHING;