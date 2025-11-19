// ⚙️ SHARED STAGE ENGINE — INTERNAL + EXTERNAL

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

export const WOO_TO_STAGE: any = {
  "pending_payment": "order_received",
  "processing": "files_received",

  "file-error": "file_error",
  "missing-file": "missing_file",

  "in-design": "in_design",

  "waiting-on-email-response": "awaiting_approval",

  "design-complete": "design_complete",

  "print-production": "print_production",
  "work-order-printed": "print_production",

  "ready-for-pickup": "ready_for_pickup",
  "shipped": "shipped",

  "refunded": "refunded",
  "failed": "failed"
};

export function getStageFromWoo(status: string) {
  return WOO_TO_STAGE[status] || "order_received";
}

export function getNextStage(stage: string) {
  const idx = INTERNAL_STAGES.indexOf(stage);
  if (idx === -1 || idx === INTERNAL_STAGES.length - 1) return null;
  return INTERNAL_STAGES[idx + 1];
}

export function getStageDescription(stage: string) {
  const DESC: any = {
    order_received: "Your order was received and is awaiting review.",
    files_received: "All submitted files have been received.",
    file_error: "There is an issue with one or more uploaded files.",
    missing_file: "Files are missing for this job.",
    in_design: "Designer is preparing your artwork.",
    awaiting_approval: "Waiting for customer approval.",
    design_complete: "Design has been approved and finalized.",
    print_production: "Job is moving through print production.",
    ready_for_pickup: "Job is ready to pick up.",
    shipped: "Job has been shipped.",
    refunded: "Order was refunded.",
    failed: "Order failed processing."
  };

  return DESC[stage] || "Job is in progress.";
}

export function detectMissing(order: any) {
  const missing = [];

  if (!order.files || order.files.length === 0) {
    missing.push("No files uploaded");
  }

  if (order.status === "in-design" && !order.proof_url) {
    missing.push("Designer has not uploaded a proof");
  }

  if (order.status === "waiting-on-email-response") {
    missing.push("Customer must approve the design");
  }

  return missing;
}

export function buildTimeline(order: any) {
  const t = [];

  t.push({
    label: "Order Received",
    timestamp: order.created_at
  });

  if (order.files?.length > 0) {
    t.push({
      label: "Files Uploaded",
      timestamp: order.updated_at
    });
  }

  if (order.status === "in-design") {
    t.push({
      label: "In Design",
      timestamp: order.updated_at
    });
  }

  if (order.status === "design-complete") {
    t.push({
      label: "Design Complete",
      timestamp: order.updated_at
    });
  }

  if (order.status === "print-production") {
    t.push({
      label: "Print Production Started",
      timestamp: order.updated_at
    });
  }

  if (order.status === "ready-for-pickup") {
    t.push({
      label: "Ready For Pickup",
      timestamp: order.updated_at
    });
  }

  if (order.status === "shipped") {
    t.push({
      label: "Shipped",
      timestamp: order.updated_at
    });
  }

  return t;
}

// ✨ CUSTOMER-SAFE STAGE ENGINE
// This keeps customers SAFE from internal statuses + exposes a clean, friendly journey.

//
// CUSTOMER-SAFE LABELS
// (NO internal language, no confusion)
//

export const CUSTOMER_LABELS: Record<string, string> = {
  order_received: "Order Received",
  files_received: "Files Received",
  file_error: "Action Required",
  missing_file: "Files Needed",
  in_design: "Preparing for Print",
  awaiting_approval: "Preparing for Print",
  design_complete: "Preparing for Print",
  print_production: "In Production",
  ready_for_pickup: "Ready for Pickup",
  shipped: "Shipped",
  refunded: "Refunded",
  failed: "Order Issue",
};

export function getCustomerStageLabel(stage: string) {
  return CUSTOMER_LABELS[stage] || "In Progress";
}

//
// CUSTOMER-SAFE DESCRIPTIONS
// (Clear, friendly, not technical)
//

export const CUSTOMER_DESCRIPTIONS: Record<string, string> = {
  order_received: "We've received your order and will begin reviewing it shortly.",
  files_received: "Your files have been received. Our team is reviewing them.",
  file_error: "One or more files may need an update. We will contact you if required.",
  missing_file: "We need additional files before we can begin production.",
  in_design: "Your files are being prepared and prepped for print production.",
  awaiting_approval: "Your files are being prepared and prepped for print production.",
  design_complete: "Your files are being prepared and prepped for print production.",
  print_production: "Your wrap is being printed and prepared.",
  ready_for_pickup: "Your order is ready for pickup.",
  shipped: "Your order has shipped and is on the way.",
  refunded: "This order has been refunded.",
  failed: "There was an issue processing your order.",
};

export function getCustomerStageDescription(stage: string, next = false) {
  if (!next) return CUSTOMER_DESCRIPTIONS[stage] || "";

  const NEXT: Record<string, string> = {
    order_received: "Next: Our team will begin reviewing your order.",
    files_received: "Next: Your files will be prepped for production.",
    file_error: "Next: Please upload corrected artwork.",
    missing_file: "Next: Please upload the missing files.",
    in_design: "Next: Your files will move to print production.",
    awaiting_approval: "Next: Your files will move to print production.",
    design_complete: "Next: Your files will move to print production.",
    print_production: "Next: We will package and prepare your wrap.",
    ready_for_pickup: "Next: Pick up your wrap or await shipment.",
    shipped: "Next: Delivery is on the way.",
    refunded: "",
    failed: "",
  };

  return NEXT[stage] || "Next update coming soon.";
}

//
// CUSTOMER TIMELINE
// Clean & SAFE — no internal production milestones.
//

export function buildCustomerTimeline(order: any) {
  const internal = getStageFromWoo(order.status);

  const timeline: any[] = [
    {
      label: "Order Received",
      stage: "order_received",
      active: ["order_received", "files_received", "in_design", "awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.created_at,
    },
  ];

  if (["files_received", "in_design", "awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal)) {
    timeline.push({
      label: "Files Received",
      stage: "files_received",
      active: ["files_received", "in_design", "awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.updated_at,
    });
  }

  if (["in_design", "awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal)) {
    timeline.push({
      label: "Preparing for Print",
      stage: "in_design",
      active: ["in_design", "awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.updated_at,
    });
  }

  if (["print_production", "ready_for_pickup", "shipped"].includes(internal)) {
    timeline.push({
      label: "In Production",
      stage: "print_production",
      active: ["print_production", "ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.updated_at,
    });
  }

  if (["ready_for_pickup", "shipped"].includes(internal)) {
    timeline.push({
      label: "Ready for Pickup",
      stage: "ready_for_pickup",
      active: ["ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.updated_at,
    });
  }

  if (["shipped"].includes(internal)) {
    timeline.push({
      label: "Shipped",
      stage: "shipped",
      active: true,
      timestamp: order.updated_at,
    });
  }

  return timeline;
}

// ============================================
// INTERNAL PRODUCTION STAGE ENGINE (Option 3)
// ============================================

export const PRODUCTION_STAGES = [
  "prepress_done",
  "printing",
  "laminating",
  "cutting",
  "qc",
  "ready",
  "shipped"
];

export const WOO_TO_PRODUCTION: Record<string, string> = {
  "design-complete": "prepress_done",
  "work-order-printed": "prepress_done",
  "ready-for-print": "prepress_done",
  "pre-press": "prepress_done",
  "print-production": "printing",
  "lamination": "laminating",
  "finishing": "cutting",
  "ready-for-pickup": "ready",
  "shipped": "shipped",
  "file-error": "file_error",
  "missing-file": "missing_file",
  "refunded": "refunded",
  "failed": "failed"
};

export function getProductionStage(wooStatus: string): string {
  return WOO_TO_PRODUCTION[wooStatus] || "prepress";
}

export function isProductionReady(wooStatus: string): boolean {
  return WOO_TO_PRODUCTION.hasOwnProperty(wooStatus);
}

export function getProductionStageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    prepress_done: "Design has been approved and is ready for production queue.",
    printing: "Job is currently being printed on the press.",
    laminating: "Print is being laminated for protection and durability.",
    cutting: "Laminated print is being cut and finished.",
    qc: "Final quality check before packaging.",
    ready: "Job is complete and ready for customer pickup.",
    shipped: "Job has been shipped to customer.",
    file_error: "⚠️ File has errors that must be corrected before production.",
    missing_file: "⚠️ Required files are missing from this order.",
    prepress: "Job is still in pre-production (design/approval phase).",
    refunded: "Order has been refunded.",
    failed: "Order failed and requires attention."
  };
  return descriptions[stage] || "Status unknown";
}

export function buildProductionTimeline(order: any) {
  const timeline: any[] = [];
  const status = order.status;
  
  // Only show production stages
  if (status === "design-complete" || status === "work-order-printed" || status === "ready-for-print" || status === "pre-press") {
    timeline.push({
      stage: "prepress_done",
      label: "Ready for Print",
      timestamp: order.updated_at?.slice(0, 10)
    });
  }

  if (status === "print-production") {
    timeline.push({
      stage: "printing",
      label: "Print Production",
      timestamp: order.updated_at?.slice(0, 10)
    });
  }

  if (status === "lamination") {
    timeline.push({
      stage: "laminating",
      label: "Lamination",
      timestamp: order.updated_at?.slice(0, 10)
    });
  }

  if (status === "finishing") {
    timeline.push({
      stage: "cutting",
      label: "Cutting / Finishing",
      timestamp: order.updated_at?.slice(0, 10)
    });
  }

  if (status === "ready-for-pickup") {
    timeline.push({
      stage: "ready",
      label: "Ready for Pickup",
      timestamp: order.updated_at?.slice(0, 10)
    });
  }

  if (status === "shipped") {
    timeline.push({
      stage: "shipped",
      label: "Shipped",
      timestamp: order.shipped_at || order.updated_at?.slice(0, 10)
    });
  }

  return timeline;
}
