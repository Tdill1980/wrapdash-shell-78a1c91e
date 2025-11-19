-- Add WooCommerce order tracking columns to shopflow_orders
-- These columns store the original WooCommerce order IDs for proper tracking

ALTER TABLE shopflow_orders 
  ADD COLUMN woo_order_id BIGINT,
  ADD COLUMN woo_order_number BIGINT;

COMMENT ON COLUMN shopflow_orders.woo_order_id IS 'Internal WooCommerce order ID';
COMMENT ON COLUMN shopflow_orders.woo_order_number IS 'Customer-facing WooCommerce order number (e.g., #33214)';