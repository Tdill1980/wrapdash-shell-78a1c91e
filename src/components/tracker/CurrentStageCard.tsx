import { Activity } from "lucide-react";

interface CurrentStageCardProps {
  order: {
    customer_stage: string;
  };
}

const STAGE_MESSAGES: Record<string, { title: string; description: string }> = {
  order_received: {
    title: "Order Received",
    description: "Order received and logged into our production system."
  },
  files_received: {
    title: "Files Received",
    description: "Your artwork files have been received and are being reviewed."
  },
  preflight: {
    title: "Preflight In Progress",
    description: "Preflight in progress — checking resolution, scale, bleed, and panel fit."
  },
  file_error: {
    title: "File Error Detected",
    description: "Preflight detected technical issues that must be corrected before production."
  },
  missing_file: {
    title: "Missing File",
    description: "A required artwork file is missing. Please upload to continue."
  },
  preparing_print_files: {
    title: "Preparing Print Files",
    description: "Preparing print-ready panels: paneling, scaling, alignment, and color correction."
  },
  awaiting_approval: {
    title: "Awaiting Approval",
    description: "Proof generated and ready for review. Awaiting customer approval."
  },
  printing: {
    title: "Printing In Progress",
    description: "Print production in progress on our large-format printers."
  },
  laminating: {
    title: "Lamination In Progress",
    description: "Applying protective lamination for durability and UV protection."
  },
  cutting: {
    title: "Cutting & Finishing",
    description: "Cutting and finishing in progress. Precision panel trimming."
  },
  qc: {
    title: "Quality Inspection",
    description: "Final quality inspection in progress. Checking color, finish, and fit."
  },
  ready: {
    title: "Order Complete",
    description: "Your order is complete and ready for pickup or shipment."
  },
};

export function CurrentStageCard({ order }: CurrentStageCardProps) {
  const stage = STAGE_MESSAGES[order.customer_stage] || STAGE_MESSAGES.order_received;

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-[#5AC8FF] via-[#2F8CFF] to-[#1A5BFF]">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="card-header mb-2">
            {stage.title}
          </h2>
          <p className="text-white/80 text-[14px] font-inter leading-relaxed">
            {stage.description}
          </p>
        </div>
      </div>
    </div>
  );
}
