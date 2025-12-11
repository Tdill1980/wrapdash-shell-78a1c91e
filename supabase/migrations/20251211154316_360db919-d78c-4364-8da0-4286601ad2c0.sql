-- Add Stripe Connect and payout columns to affiliate_founders
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS payout_email TEXT;
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'stripe';
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT false;
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS agreed_to_terms_at TIMESTAMPTZ;
ALTER TABLE affiliate_founders ADD COLUMN IF NOT EXISTS content_creator_opted_in BOOLEAN DEFAULT false;

-- Create index for stripe account lookup
CREATE INDEX IF NOT EXISTS idx_affiliate_founders_stripe_account ON affiliate_founders(stripe_account_id) WHERE stripe_account_id IS NOT NULL;