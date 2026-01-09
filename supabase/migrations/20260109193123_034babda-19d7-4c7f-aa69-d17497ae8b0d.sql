-- Add quote lifecycle columns for WPW Internal mode
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS quote_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_conversation_id uuid REFERENCES conversations(id);

-- Add constraint to ensure WPW material-only quotes have no labor/margin
-- Using a trigger instead of CHECK constraint for flexibility
CREATE OR REPLACE FUNCTION validate_wpw_quote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_type = 'wpw_material_only' THEN
    IF COALESCE(NEW.labor_cost, 0) != 0 OR COALESCE(NEW.margin, 0) != 0 THEN
      RAISE EXCEPTION 'WPW material-only quotes cannot have labor cost or margin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_wpw_quote_trigger ON quotes;
CREATE TRIGGER validate_wpw_quote_trigger
  BEFORE INSERT OR UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION validate_wpw_quote();

-- Add index for faster lookups by quote_type
CREATE INDEX IF NOT EXISTS idx_quotes_quote_type ON quotes(quote_type);
CREATE INDEX IF NOT EXISTS idx_quotes_source_conversation_id ON quotes(source_conversation_id);