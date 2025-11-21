-- Extend vehicle_models table with admin management fields
ALTER TABLE vehicle_models ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE vehicle_models ADD COLUMN IF NOT EXISTS is_featured boolean default false;
ALTER TABLE vehicle_models ADD COLUMN IF NOT EXISTS is_hidden boolean default false;
ALTER TABLE vehicle_models ADD COLUMN IF NOT EXISTS default_finish text default 'gloss';
ALTER TABLE vehicle_models ADD COLUMN IF NOT EXISTS default_environment text default 'studio';
ALTER TABLE vehicle_models ADD COLUMN IF NOT EXISTS sort_order integer default 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_models_active ON vehicle_models(is_active, is_hidden);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_category ON vehicle_models(category);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_featured ON vehicle_models(is_featured);

-- Update RLS policies for vehicle_models
CREATE POLICY "Admins can manage all vehicles"
ON vehicle_models
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create custom vehicles"
ON vehicle_models
FOR INSERT
TO authenticated
WITH CHECK (
  is_oem = false 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own custom vehicles"
ON vehicle_models
FOR UPDATE
TO authenticated
USING (
  is_oem = false 
  AND created_by = auth.uid()
)
WITH CHECK (
  is_oem = false 
  AND created_by = auth.uid()
);