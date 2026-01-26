-- Create phone_calls table for Twilio AI phone agent
CREATE TABLE public.phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  twilio_call_sid TEXT UNIQUE NOT NULL,
  caller_phone TEXT NOT NULL,
  call_duration_seconds INTEGER,
  transcript TEXT,
  ai_classification JSONB DEFAULT '{}',
  is_hot_lead BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress',
  customer_name TEXT,
  vehicle_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for phone_calls
CREATE POLICY "Allow read access for authenticated users"
ON public.phone_calls
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for service role"
ON public.phone_calls
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON public.phone_calls
FOR UPDATE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_phone_calls_updated_at
BEFORE UPDATE ON public.phone_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_phone_calls_caller_phone ON public.phone_calls(caller_phone);
CREATE INDEX idx_phone_calls_created_at ON public.phone_calls(created_at DESC);
CREATE INDEX idx_phone_calls_status ON public.phone_calls(status);
CREATE INDEX idx_phone_calls_is_hot_lead ON public.phone_calls(is_hot_lead) WHERE is_hot_lead = true;