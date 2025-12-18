-- Step 1: Drop existing status constraint if it exists
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Step 2: Add new constraint with 'lead' and 'follow_up' statuses
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status = ANY (ARRAY['pending', 'completed', 'expired', 'lead', 'follow_up']));

-- Step 3: Backfill existing leads from ai_actions that have valid email
INSERT INTO quotes (
  quote_number,
  customer_name, 
  customer_email, 
  customer_phone, 
  vehicle_year, 
  vehicle_make, 
  vehicle_model,
  product_name,
  total_price,
  status,
  ai_generated,
  ai_message,
  created_at
)
SELECT 
  'LEAD-' || SUBSTRING(aa.id::text, 1, 8),
  COALESCE(aa.action_payload->>'customer_name', 'Unknown'),
  aa.action_payload->>'customer_email',
  aa.action_payload->>'customer_phone',
  aa.action_payload->'vehicle'->>'year',
  aa.action_payload->'vehicle'->>'make',
  aa.action_payload->'vehicle'->>'model',
  aa.action_payload->>'product_name',
  COALESCE((aa.action_payload->>'total_price')::numeric, 0),
  'lead',
  true,
  'Backfilled from ai_actions - original quote insert failed',
  aa.created_at
FROM ai_actions aa
WHERE aa.action_type = 'create_quote' 
  AND aa.resolved = false
  AND aa.action_payload->>'customer_email' IS NOT NULL
  AND aa.action_payload->>'customer_email' != ''
  AND NOT EXISTS (
    SELECT 1 FROM quotes q 
    WHERE q.customer_email = aa.action_payload->>'customer_email'
      AND q.created_at::date = aa.created_at::date
  );