-- Ensure approveflow_3d upsert works by adding a unique constraint
ALTER TABLE public.approveflow_3d
ADD CONSTRAINT approveflow_3d_project_version_unique UNIQUE (project_id, version_id);