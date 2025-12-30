-- Brand overlay templates for consistent voice per brand
CREATE TABLE IF NOT EXISTS brand_overlay_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'center',
  animation TEXT NOT NULL DEFAULT 'pop',
  tone TEXT NULL,
  prompt TEXT NOT NULL,
  example TEXT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE brand_overlay_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "brand_overlay_templates_authenticated"
ON brand_overlay_templates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Seed WPW brand templates
INSERT INTO brand_overlay_templates (brand, name, tone, prompt, example) VALUES
('wpw', 'High-Energy Sales Hook', 'aggressive', 'Write a short, punchy, high-urgency sales hook for wrap installers. Uppercase. Max 6 words.', 'CRUSH DEADLINES. MAXIMIZE PROFIT.'),
('wpw', 'Pain Point Agitator', 'empathetic', 'Write a question that highlights wrap installer frustrations with slow print providers. Short, direct.', 'STRUGGLING TO MEET DEADLINES?'),
('wpw', 'Results Statement', 'confident', 'Write a bold statement about the results of partnering with WePrintWraps. Focus on speed and quality.', 'FAST. RELIABLE. RESULTS.'),
('wpw', 'CTA Power Close', 'urgent', 'Write a compelling call-to-action for wrap installers. Make it action-oriented.', 'PARTNER WITH WEPRINTWRAPS!');