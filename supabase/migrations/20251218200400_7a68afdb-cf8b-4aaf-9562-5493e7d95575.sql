-- Add channel column to tasks table for MightyTask channel filtering
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS channel TEXT;