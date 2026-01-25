import { ArrowRight } from "lucide-react";

interface NextStepCardProps {
  order: {
    customer_stage: string;
  };
}

const NEXT_STEPS: Record<string, string> = {
  order_received: "Files will be received and logged.",
  files_received: "Preflight check will begin.",
  preflight: "Print files will be prepared.",
  file_error: "File corrections needed before production.",
  missing_file: "Upload missing file to proceed.",
  preparing_print_files: "Proof will be generated for approval.",
  awaiting_approval: "Production will begin after approval.",
  printing: "Lamination will be applied.",
  laminating: "Cutting and finishing will begin.",
  cutting: "Quality inspection will be performed.",
  qc: "Order will be finalized and packaged.",
  ready: "Your order is complete! Check your email for tracking info.",
  shipped: "Your order is on its way! Track delivery using your tracking number.",
  completed: "Order delivered! Thank you for choosing WePrintWraps.",
};

export function NextStepCard({ order }: NextStepCardProps) {
  const nextStep = NEXT_STEPS[order.customer_stage] || "Processing your order.";

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-4 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 flex-shrink-0">
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#5AC8FF]" />
        </div>
        <div className="flex-1">
          <h3 className="card-header text-base sm:text-lg mb-1">
            What's Next
          </h3>
          <p className="text-white/70 text-xs sm:text-sm font-inter">
            {nextStep}
          </p>
        </div>
      </div>
    </div>
  );
}
