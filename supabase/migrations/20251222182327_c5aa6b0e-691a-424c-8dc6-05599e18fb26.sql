-- Add source tracking and original message fields to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_message text,
ADD COLUMN IF NOT EXISTS source_conversation_id uuid;