/**
 * MASTER STATUS MAPPING for WrapCommandAI
 * ---------------------------------------
 * DO NOT change WooCommerce statuses directly.
 * All status translations happen here.
 */

export type InternalStatus =
  | "order_received"
  | "in_design"
  | "action_required"
  | "awaiting_approval"
  | "preparing_for_print"
  | "in_production"
  | "ready_or_shipped"
  | "completed";

/**
 * WooCommerce → Internal ShopFlow Status
 * (For staff-facing dashboard & backend logic)
 */
export const wooToInternalStatus: Record<string, InternalStatus> = {
  // ORDER RECEIVED
  "pending": "order_received",
  "processing": "order_received",
  "on-hold": "order_received",
  "waiting-to-place-order": "order_received",
  "waiting-on-email-response": "order_received",
  "add-on": "order_received",
  "dropbox-link-sent": "order_received",

  // IN DESIGN
  "in-design": "in_design",

  // ACTION REQUIRED (customer must fix file)
  "file-error": "action_required",
  "missing-file": "action_required",

  // AWAITING APPROVAL (ApproveFlow)
  "design-complete": "awaiting_approval",
  "work-order-printed": "awaiting_approval",

  // PREPARING FOR PRINT
  "ready-for-print": "preparing_for_print",
  "pre-press": "preparing_for_print",

  // IN PRODUCTION
  "print-production": "in_production",
  "lamination": "in_production",
  "finishing": "in_production",

  // READY OR SHIPPED
  "ready-for-pickup": "ready_or_shipped",
  "shipping-cost": "ready_or_shipped",
  "shipped": "ready_or_shipped",

  // COMPLETED
  "completed": "completed"
};

/**
 * Internal → Customer-Facing Timeline Status
 * (Simplified — what customers see on the tracking page)
 */
export const internalToCustomerStatus: Record<InternalStatus, string> = {
  order_received: "Order Received",
  in_design: "In Design",
  action_required: "Action Needed (File Issue)",
  awaiting_approval: "Awaiting Your Approval",
  preparing_for_print: "Preparing for Print",
  in_production: "In Production",
  ready_or_shipped: "Ready / Shipped",
  completed: "Completed"
};

/**
 * Convert Woo → Customer timeline in one call.
 */
export const wooToCustomerStatus = (wooStatus: string): string => {
  const internal = wooToInternalStatus[wooStatus] || "order_received";
  return internalToCustomerStatus[internal];
};
