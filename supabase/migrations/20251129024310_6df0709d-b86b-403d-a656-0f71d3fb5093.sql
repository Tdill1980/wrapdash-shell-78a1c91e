-- Add multi-tenant tracking columns to shopflow_orders
ALTER TABLE shopflow_orders 
ADD COLUMN source_organization_id UUID REFERENCES organizations(id),
ADD COLUMN wpw_production_order_id UUID REFERENCES shopflow_orders(id),
ADD COLUMN order_source TEXT DEFAULT 'direct';

-- Create index for efficient queries
CREATE INDEX idx_shopflow_orders_source_org ON shopflow_orders(source_organization_id);
CREATE INDEX idx_shopflow_orders_wpw_production ON shopflow_orders(wpw_production_order_id);

-- Comment columns
COMMENT ON COLUMN shopflow_orders.source_organization_id IS 'For WPW orders, tracks which subdomain customer placed the order';
COMMENT ON COLUMN shopflow_orders.wpw_production_order_id IS 'For subdomain orders, links to the WPW production order';
COMMENT ON COLUMN shopflow_orders.order_source IS 'Order origin: direct, wpw_reseller, woo_webhook';