-- Create story engagement tracking table for Instagram story response tracking
CREATE TABLE IF NOT EXISTS public.story_engagement_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id TEXT,
  story_content TEXT,
  story_posted_at TIMESTAMP WITH TIME ZONE,
  dm_received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sender_id TEXT NOT NULL,
  sender_username TEXT,
  message_text TEXT,
  intent_type TEXT,
  conversation_id UUID REFERENCES public.conversations(id),
  contact_id UUID REFERENCES public.contacts(id),
  converted_to_quote BOOLEAN DEFAULT false,
  quote_id UUID,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_engagement_log ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (edge functions)
CREATE POLICY "Service role can manage story engagement" 
ON public.story_engagement_log 
FOR ALL 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_story_engagement_sender ON public.story_engagement_log(sender_id);
CREATE INDEX idx_story_engagement_created ON public.story_engagement_log(created_at DESC);