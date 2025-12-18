-- Add content_calendar_id to tasks table to link tasks to calendar items
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS content_calendar_id UUID REFERENCES public.content_calendar(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_content_calendar_id ON public.tasks(content_calendar_id);