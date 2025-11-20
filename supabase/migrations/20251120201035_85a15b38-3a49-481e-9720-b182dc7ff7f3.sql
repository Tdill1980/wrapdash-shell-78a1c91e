-- Create table for tracking affiliate invoices
CREATE TABLE IF NOT EXISTS public.affiliate_payout_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES public.affiliate_founders(id),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount NUMERIC NOT NULL,
  commission_ids UUID[] NOT NULL,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_to_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_payout_invoices ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invoices
CREATE POLICY "Admins can manage invoices"
ON public.affiliate_payout_invoices
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Founders can view their own invoices
CREATE POLICY "Founders can view their own invoices"
ON public.affiliate_payout_invoices
FOR SELECT
USING (founder_id::text = auth.uid()::text);

-- Create index for faster lookups
CREATE INDEX idx_affiliate_invoices_founder ON public.affiliate_payout_invoices(founder_id);
CREATE INDEX idx_affiliate_invoices_status ON public.affiliate_payout_invoices(status);
CREATE INDEX idx_affiliate_invoices_date ON public.affiliate_payout_invoices(invoice_date DESC);