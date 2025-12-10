-- Add chat_state column for multi-stage conversation tracking
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS chat_state JSONB DEFAULT '{}';

-- Add comment explaining the structure
COMMENT ON COLUMN conversations.chat_state IS 'Tracks multi-stage chat flows: { stage, vehicle, customer_email, escalations_sent }';

-- Seed WPW knowledge items for Luigi grounding
INSERT INTO knowledge_items (question, answer, category, is_active) VALUES
('What is the turnaround time?', 'Turnaround is 1-2 business days for print, ships in 3 days or less.', 'shipping', true),
('Do you offer free shipping?', 'Free shipping on orders over $500.', 'shipping', true),
('How much does wrap film cost?', 'Avery and 3M wrap film starting at $5.27/sq ft. Print exactly what you need - no minimums, no maximums.', 'pricing', true),
('What file formats do you accept?', 'File formats: PDF, AI, EPS only (no Corel or Publisher). Minimum resolution: 72 DPI.', 'files', true),
('Do you have a quality guarantee?', 'Quality guarantee: 100% - we reprint at no cost if there is an issue.', 'quality', true),
('How are wraps packaged?', 'All wraps come paneled and ready to install.', 'product', true),
('What is your phone number?', 'Support: hello@weprintwraps.com or call 602-595-3200', 'contact', true),
('Who do I contact for design help?', 'Contact our design team at design@weprintwraps.com', 'contact', true)
ON CONFLICT DO NOTHING;