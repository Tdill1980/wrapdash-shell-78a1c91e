-- Fix color_visualizations RLS to allow anyone to insert designs
-- This is safe because it's a design showcase/catalog, not sensitive user data

DROP POLICY IF EXISTS "Authenticated users can insert visualizations" ON color_visualizations;
DROP POLICY IF EXISTS "Anyone can insert visualizations" ON color_visualizations;

-- Allow anyone to insert visualizations (for DesignVault uploads)
CREATE POLICY "Anyone can insert visualizations"
ON color_visualizations FOR INSERT
WITH CHECK (true);