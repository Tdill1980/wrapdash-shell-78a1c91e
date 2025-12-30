-- Add unique constraint for upsert on job_id + scene_id
ALTER TABLE public.scene_text_overlays 
ADD CONSTRAINT scene_text_overlays_job_scene_unique 
UNIQUE (job_id, scene_id);