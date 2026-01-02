-- Create read-only views for clean separation between Website Chat and MightyChats

-- Website Page Chat View (WePrintWraps.com website widget)
CREATE OR REPLACE VIEW website_chat_conversations AS
SELECT *
FROM conversations
WHERE channel = 'website';

-- MightyChats View (Instagram / Facebook DMs)
CREATE OR REPLACE VIEW mightychat_conversations AS
SELECT *
FROM conversations
WHERE channel IN ('instagram', 'facebook');

-- Grant access to authenticated users
GRANT SELECT ON website_chat_conversations TO authenticated;
GRANT SELECT ON mightychat_conversations TO authenticated;