-- Create quote_line_items table for multi-product quotes
CREATE TABLE public.quote_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  sqft NUMERIC,
  unit_price NUMERIC,
  line_total NUMERIC NOT NULL,
  panel_selections JSONB,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view quote line items"
ON public.quote_line_items
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert quote line items"
ON public.quote_line_items
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quote line items"
ON public.quote_line_items
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete quote line items"
ON public.quote_line_items
FOR DELETE
USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX idx_quote_line_items_quote_id ON public.quote_line_items(quote_id);