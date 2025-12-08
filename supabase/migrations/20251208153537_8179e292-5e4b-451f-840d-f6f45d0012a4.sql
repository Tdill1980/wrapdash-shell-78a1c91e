-- Add view_type and sort_order columns to approveflow_assets for multi-view proof system
ALTER TABLE approveflow_assets ADD COLUMN IF NOT EXISTS view_type text;
ALTER TABLE approveflow_assets ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- Add current_version to approveflow_projects for designer versioning
ALTER TABLE approveflow_projects ADD COLUMN IF NOT EXISTS current_version int DEFAULT 1;