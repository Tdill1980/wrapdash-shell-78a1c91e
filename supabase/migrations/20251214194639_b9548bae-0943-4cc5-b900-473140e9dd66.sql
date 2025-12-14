-- Add new columns to portfolio_jobs for legacy job enhancements
ALTER TABLE public.portfolio_jobs
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;