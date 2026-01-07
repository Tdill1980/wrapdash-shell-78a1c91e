-- ============================================
-- ColorPro Soft Decommission (WrapCommandAI)
-- ============================================
-- Purpose:
-- ColorPro was mistakenly implemented in WrapCommandAI.
-- This migration documents decommission intent.
-- NO DATA IS DELETED HERE.
--
-- ColorPro belongs exclusively to RestyleProAI.
-- WrapCommandAI must not contain render or film catalog logic.
-- ============================================

-- Add deprecation comments to the table for clarity
COMMENT ON TABLE public.film_catalog IS 
'DEPRECATED IN WrapCommandAI. ColorPro OS belongs to RestyleProAI only. Do not use. Scheduled for removal after stability confirmation.';

COMMENT ON VIEW public.film_catalog_public IS 
'DEPRECATED IN WrapCommandAI. ColorPro OS belongs to RestyleProAI only. Scheduled for removal after stability confirmation.';