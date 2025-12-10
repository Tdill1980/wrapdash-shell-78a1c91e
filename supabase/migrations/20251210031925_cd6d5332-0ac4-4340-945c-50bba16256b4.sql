-- Create ai_corrections table for preventing hallucinations
CREATE TABLE public.ai_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_phrase TEXT NOT NULL,
  flagged_response TEXT,
  approved_response TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge_items table for RAG grounding
CREATE TABLE public.knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  organization_id UUID REFERENCES public.organizations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_corrections
CREATE POLICY "Admins can manage corrections" ON public.ai_corrections
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active corrections" ON public.ai_corrections
  FOR SELECT USING (is_active = true);

-- RLS Policies for knowledge_items
CREATE POLICY "Admins can manage knowledge items" ON public.ai_corrections
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active knowledge items" ON public.knowledge_items
  FOR SELECT USING (is_active = true);

-- Add indexes for fast lookups
CREATE INDEX idx_ai_corrections_trigger ON public.ai_corrections USING gin(to_tsvector('english', trigger_phrase));
CREATE INDEX idx_knowledge_items_keywords ON public.knowledge_items USING gin(keywords);
CREATE INDEX idx_knowledge_items_category ON public.knowledge_items(category);

-- Insert some initial knowledge items for WPW
INSERT INTO public.knowledge_items (category, question, answer, keywords) VALUES
('pricing', 'How much does a full wrap cost?', 'Full vehicle wraps typically range from $2,500 to $5,000 depending on vehicle size and material choice. I can provide an exact quote if you tell me your vehicle year, make, and model.', ARRAY['price', 'cost', 'wrap', 'full']),
('installation', 'How long does a wrap take to install?', 'Most full vehicle wraps take 3-5 business days for installation. Partial wraps and color changes may take 2-3 days.', ARRAY['install', 'time', 'days', 'how long']),
('durability', 'How long does a wrap last?', 'High-quality vinyl wraps typically last 5-7 years with proper care. We use premium 3M and Avery materials.', ARRAY['last', 'durability', 'years', 'lifespan']),
('care', 'How do I care for my wrap?', 'Hand wash only, avoid pressure washers, and keep away from harsh chemicals. We provide detailed care instructions with every installation.', ARRAY['care', 'wash', 'maintain', 'clean']);