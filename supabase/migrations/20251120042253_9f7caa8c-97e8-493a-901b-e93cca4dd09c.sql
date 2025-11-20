-- Add vehicle_info and color_info columns to approveflow_projects
ALTER TABLE approveflow_projects 
ADD COLUMN IF NOT EXISTS vehicle_info jsonb,
ADD COLUMN IF NOT EXISTS color_info jsonb;