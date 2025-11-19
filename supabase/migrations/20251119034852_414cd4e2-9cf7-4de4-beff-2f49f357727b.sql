-- Phase 1: Add affiliate tracking to shopflow_orders
ALTER TABLE shopflow_orders 
ADD COLUMN affiliate_ref_code TEXT;

-- Phase 2: Enhance affiliate_commissions for payment tracking
ALTER TABLE affiliate_commissions
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN notes TEXT,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID;

-- Create index for faster queries on commission status
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_founder_status ON affiliate_commissions(founder_id, status);
CREATE INDEX idx_shopflow_orders_affiliate_ref ON shopflow_orders(affiliate_ref_code) WHERE affiliate_ref_code IS NOT NULL;