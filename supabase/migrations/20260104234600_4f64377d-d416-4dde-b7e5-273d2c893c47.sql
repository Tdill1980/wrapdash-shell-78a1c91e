-- Backfill existing website chat conversations with NULL organization_id
UPDATE conversations 
SET organization_id = '51aa96db-c06d-41ae-b3cb-25b045c75caf'
WHERE channel = 'website' 
AND organization_id IS NULL;

-- Also backfill contacts created by website chat with NULL organization_id
UPDATE contacts 
SET organization_id = '51aa96db-c06d-41ae-b3cb-25b045c75caf'
WHERE source = 'website_chat' 
AND organization_id IS NULL;