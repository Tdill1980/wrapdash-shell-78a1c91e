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
  in_design: "In Design",
  awaiting_approval: "Awaiting Your Approval",
  design_complete: "Design Approved",
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
  missing_file: "We need additional files before we can begin your design.",
  in_design: "Our design team is working on your artwork.",
  awaiting_approval: "Your proof is ready. Please review and approve.",
  design_complete: "Your design is approved and will now move to production.",
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
    files_received: "Next: Your designer will begin your layout.",
    file_error: "Next: Please upload corrected artwork.",
    missing_file: "Next: Please upload the missing files.",
    in_design: "Next: You will receive a proof to approve.",
    awaiting_approval: "Next: Please approve or request changes.",
    design_complete: "Next: Your wrap will move to production.",
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
      label: "Design In Progress",
      stage: "in_design",
      active: ["in_design", "awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.updated_at,
    });
  }

  if (["awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal)) {
    timeline.push({
      label: "Proof Sent",
      stage: "awaiting_approval",
      active: ["awaiting_approval", "design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal),
      timestamp: order.updated_at,
    });
  }

  if (["design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal)) {
    timeline.push({
      label: "Design Approved",
      stage: "design_complete",
      active: ["design_complete", "print_production", "ready_for_pickup", "shipped"].includes(internal),
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
