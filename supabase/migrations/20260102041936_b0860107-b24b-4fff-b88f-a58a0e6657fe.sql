-- Create recovered Instagram leads table
CREATE TABLE IF NOT EXISTS public.recovered_instagram_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id),
  ig_sender_name text,
  message_content text,
  extracted_email text,
  extracted_phone text,
  intent_keywords text[],
  status text DEFAULT 'uncontacted',
  notes text,
  followed_up_by uuid,
  followed_up_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recovered_instagram_leads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view recovered leads"
ON public.recovered_instagram_leads FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert recovered leads"
ON public.recovered_instagram_leads FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recovered leads"
ON public.recovered_instagram_leads FOR UPDATE
USING (auth.role() = 'authenticated');

-- Create view for easy extraction with emails parsed from message content
CREATE OR REPLACE VIEW public.instagram_leads_with_emails AS
SELECT 
  c.id as conversation_id,
  m.sender_name as ig_sender_name,
  m.content as message_content,
  m.created_at as message_date,
  -- Extract email from message content using regex
  CASE 
    WHEN m.content ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
    THEN (regexp_match(m.content, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 'i'))[1]
    ELSE NULL
  END as extracted_email,
  m.direction
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'instagram'
AND m.direction = 'inbound'
ORDER BY m.created_at DESC;