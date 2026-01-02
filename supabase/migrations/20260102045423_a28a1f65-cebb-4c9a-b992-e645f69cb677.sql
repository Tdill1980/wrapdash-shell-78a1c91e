-- Add directive and google_doc_url columns for Jackson's workflow
ALTER TABLE public.content_calendar 
ADD COLUMN IF NOT EXISTS directive text,
ADD COLUMN IF NOT EXISTS google_doc_url text,
ADD COLUMN IF NOT EXISTS notes text;