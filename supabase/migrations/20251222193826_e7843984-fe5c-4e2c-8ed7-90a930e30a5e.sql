-- Phase 1: Create quote_drafts table for execution gate system
CREATE TABLE IF NOT EXISTS public.quote_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent text NOT NULL,
  confidence numeric DEFAULT 0.85,
  customer_name text,
  customer_email text NOT NULL,
  customer_phone text,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  material text,
  sqft numeric,
  price_per_sqft numeric DEFAULT 5.27,
  total_price numeric,
  original_message text,
  source text DEFAULT 'chat',
  conversation_id uuid,
  status text DEFAULT 'draft', -- draft, approved, sent, rejected
  rejected_reason text,
  approved_by uuid,
  approved_at timestamp with time zone,
  sent_at timestamp with time zone,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view drafts in their organization" 
ON public.quote_drafts 
FOR SELECT 
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can insert drafts" 
ON public.quote_drafts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update drafts in their organization" 
ON public.quote_drafts 
FOR UPDATE 
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

CREATE POLICY "Users can delete drafts in their organization" 
ON public.quote_drafts 
FOR DELETE 
USING ((organization_id = get_user_organization_id()) OR (organization_id IS NULL));

-- Trigger for updated_at
CREATE TRIGGER update_quote_drafts_updated_at
BEFORE UPDATE ON public.quote_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_quote_drafts_status ON public.quote_drafts(status);
CREATE INDEX idx_quote_drafts_source_agent ON public.quote_drafts(source_agent);
CREATE INDEX idx_quote_drafts_created_at ON public.quote_drafts(created_at DESC);