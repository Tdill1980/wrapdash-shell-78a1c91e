-- Phase 1: Add intent linking columns to content_calendar
ALTER TABLE content_calendar 
ADD COLUMN IF NOT EXISTS intent_preset_id UUID REFERENCES content_intents(id),
ADD COLUMN IF NOT EXISTS locked_metadata JSONB DEFAULT '{}'::jsonb;

-- Add overlay_style to content_intents for style separation
ALTER TABLE content_intents
ADD COLUMN IF NOT EXISTS overlay_style TEXT DEFAULT 'poppins_premium';

-- Add index for faster intent lookups
CREATE INDEX IF NOT EXISTS idx_content_calendar_intent_preset 
ON content_calendar(intent_preset_id) 
WHERE intent_preset_id IS NOT NULL;