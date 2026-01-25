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
    title: "Print Production",
    description: "Print production in progress on our large-format printers."
  },
  laminating: {
    title: "Print Production",
    description: "Applying protective lamination for durability and UV protection."
  },
  cutting: {
    title: "Print Production",
    description: "Cutting and finishing in progress. Precision panel trimming."
  },
  qc: {
    title: "QC",
    description: "Final quality inspection in progress. Checking color, finish, and fit."
  },
  ready: {
    title: "Completed / Shipped",
    description: "Your order is complete and ready for pickup or has been shipped."
  },
  shipped: {
    title: "Completed / Shipped",
    description: "Your order has been completed and shipped! Check your email for tracking info."
  },
  completed: {
    title: "Completed / Shipped",
    description: "Your order has been completed and shipped. Thank you for choosing WePrintWraps!"
  },
};

export function CurrentStageCard({ order }: CurrentStageCardProps) {
  const stage = STAGE_MESSAGES[order.customer_stage] || STAGE_MESSAGES.order_received;

  return (
    <div className="bg-gradient-to-r from-[#2F81F7]/10 to-[#15D1FF]/10 border-2 border-[#2F81F7]/30 rounded-xl p-6 shadow-lg shadow-[#2F81F7]/20">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">
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
