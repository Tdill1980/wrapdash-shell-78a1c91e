export const INTERNAL_STAGES = [
  "order_received",
  "files_received",
  "file_error",
  "missing_file",
  "in_design",
  "awaiting_approval",
  "design_complete",
  "print_production",
  "ready_for_pickup",
  "shipped",
  "refunded",
  "failed"
];

// MAP RAW WOO → INTERNAL
export const WOO_TO_INTERNAL: Record<string, string> = {
  "pending_payment": "order_received",
  "processing": "files_received",
  "on-hold": "order_received",

  "dropbox-link-sent": "files_received",
  "file-error": "file_error",
  "missing-file": "missing_file",

  "in-design": "in_design",

  "waiting-on-email-response": "awaiting_approval",
  "waiting-to-place-order": "awaiting_approval",

  "design-complete": "design_complete",

  "work-order-printed": "print_production",
  "print-production": "print_production",

  "ready-for-pickup": "ready_for_pickup",
  "shipping-cost": "ready_for_pickup",

  "shipped": "shipped",
  "refunded": "refunded",
  "failed": "failed"
};

// GET INTERNAL STAGE
export function getStageFromWoo(wooStatus: string): string {
  return WOO_TO_INTERNAL[wooStatus] || "order_received";
}

// NEXT INTERNAL STAGE
export function getNextStage(stage: string): string | null {
  const idx = INTERNAL_STAGES.indexOf(stage);
  if (idx === -1 || idx === INTERNAL_STAGES.length - 1) return null;
  return INTERNAL_STAGES[idx + 1];
}

// DETECT MISSING ITEMS
export function detectMissing(order: any): string[] {
  const missing: string[] = [];

  if (!order.files || (Array.isArray(order.files) && order.files.length === 0)) {
    missing.push("No files uploaded");
  }

  if (order.status === "in-design" && !order.proof_url) {
    missing.push("Designer has not provided a proof yet");
  }

  if (order.status === "waiting-on-email-response") {
    missing.push("Customer has not approved design");
  }

  return missing;
}

// BUILD INTERNAL TIMELINE
export function buildTimeline(order: any) {
  const timeline: any[] = [];

  timeline.push({
    stage: "order_received",
    label: "Order Received",
    timestamp: order.created_at
  });

  if (order.files && Array.isArray(order.files) && order.files.length > 0) {
    timeline.push({
      stage: "files_received",
      label: "Files Received",
      timestamp: order.files[0]?.created_at || order.updated_at
    });
  }

  if (order.status === "file-error") {
    timeline.push({
      stage: "file_error",
      label: "File Error",
      timestamp: order.updated_at
    });
  }

  if (order.status === "missing-file") {
    timeline.push({
      stage: "missing_file",
      label: "Missing File",
      timestamp: order.updated_at
    });
  }

  if (order.status === "in-design") {
    timeline.push({
      stage: "in_design",
      label: "In Design",
      timestamp: order.updated_at
    });
  }

  if (order.status === "design-complete") {
    timeline.push({
      stage: "design_complete",
      label: "Design Complete",
      timestamp: order.updated_at
    });
  }

  if (order.status === "print-production" || order.status === "work-order-printed") {
    timeline.push({
      stage: "print_production",
      label: "Print Production",
      timestamp: order.updated_at
    });
  }

  if (order.status === "ready-for-pickup") {
    timeline.push({
      stage: "ready_for_pickup",
      label: "Ready for Pickup",
      timestamp: order.updated_at
    });
  }

  if (order.status === "shipped") {
    timeline.push({
      stage: "shipped",
      label: "Shipped",
      timestamp: order.updated_at
    });
  }

  return timeline;
}
