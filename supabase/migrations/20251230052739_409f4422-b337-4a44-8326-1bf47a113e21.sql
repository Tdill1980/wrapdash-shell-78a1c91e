-- Add RLS policies for creative_tag_map table
ALTER TABLE public.creative_tag_map ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert tags
CREATE POLICY "Users can insert creative tags"
ON public.creative_tag_map
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view tags
CREATE POLICY "Users can view creative tags"
ON public.creative_tag_map
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to delete their tags
CREATE POLICY "Users can delete creative tags"
ON public.creative_tag_map
FOR DELETE
TO authenticated
USING (true);