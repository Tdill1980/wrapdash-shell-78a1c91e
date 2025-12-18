-- Add task_type column to tasks table for content task categorization
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type TEXT;

-- Add index for efficient filtering by task type
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);

-- Add index for due_date filtering (for daily flywheel)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);