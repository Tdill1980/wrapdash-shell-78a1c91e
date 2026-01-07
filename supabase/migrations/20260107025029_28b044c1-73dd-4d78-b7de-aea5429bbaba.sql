-- ============================================
-- ApproveFlow OS Architecture Migration
-- Expand file_type to include proper asset roles
-- ============================================

-- Step 1: Drop old constraint
ALTER TABLE approveflow_assets 
DROP CONSTRAINT IF EXISTS approveflow_assets_file_type_check;

-- Step 2: Add new constraint with proper asset roles
ALTER TABLE approveflow_assets 
ADD CONSTRAINT approveflow_assets_file_type_check 
CHECK (file_type IN (
  'customer_upload',
  'customer_logo',
  'customer_brand_guide',
  'customer_design_file',
  'customer_inspiration',
  'designer_working_file',
  'designer_2d_proof',
  'designer_3d_render',
  'final_approval_proof',
  -- Keep legacy values for backward compatibility
  'reference', 'logo', 'example'
));

-- Step 3: Migrate existing WooCommerce uploads from 'reference' to 'customer_upload'
UPDATE approveflow_assets 
SET file_type = 'customer_upload' 
WHERE source = 'woocommerce' AND file_type = 'reference';