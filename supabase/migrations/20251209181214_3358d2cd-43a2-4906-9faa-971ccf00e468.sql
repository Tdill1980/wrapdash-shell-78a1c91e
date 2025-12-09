-- Create table to store Instagram tokens with expiry tracking
CREATE TABLE public.instagram_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'long_lived',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  instagram_user_id TEXT,
  instagram_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage tokens
CREATE POLICY "Admins can manage instagram tokens"
ON public.instagram_tokens
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_instagram_tokens_updated_at
BEFORE UPDATE ON public.instagram_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for quick lookup
CREATE INDEX idx_instagram_tokens_org ON public.instagram_tokens(organization_id);
CREATE INDEX idx_instagram_tokens_expires ON public.instagram_tokens(expires_at);