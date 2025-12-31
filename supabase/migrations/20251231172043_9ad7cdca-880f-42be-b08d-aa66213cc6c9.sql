-- Add force_on column to allow manual override to turn Jordan ON outside schedule
ALTER TABLE public.agent_schedules 
ADD COLUMN force_on BOOLEAN NOT NULL DEFAULT false;