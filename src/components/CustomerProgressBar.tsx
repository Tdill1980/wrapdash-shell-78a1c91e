import { Package, Upload, CheckCircle, Eye, Printer, Scissors, Truck, Mail } from "lucide-react";

const CUSTOMER_STEPS = [
  { label: "Order Received", icon: Package },
  { label: "Dropbox Link Sent", icon: Mail },
  { label: "Files Received", icon: Upload },
  { label: "Awaiting Approval", icon: Eye },
  { label: "Print Production", icon: Printer },
  { label: "Being Quality Checked", icon: CheckCircle },
  { label: "Ready/Shipped", icon: Truck },
];

interface CustomerProgressBarProps {
  currentStatus: string;
  hasApproveFlowProject?: boolean;
}

export const CustomerProgressBar = ({ currentStatus, hasApproveFlowProject = false }: CustomerProgressBarProps) => {
  // Map both WooCommerce and internal status formats to simplified customer stages
  const statusMap: Record<string, string> = {
    // === Internal Status Formats (from database) ===
    "order_received": "Order Received",
    "dropbox_link_sent": "Dropbox Link Sent", 
    "files_received": "Files Received",
    "action_required": "Files Received",
    "design_requested": "Files Received",
    "awaiting_approval": hasApproveFlowProject ? "Awaiting Approval" : "Print Production",
    "design_complete": hasApproveFlowProject ? "Awaiting Approval" : "Print Production",
    "preparing_for_print": "Print Production",
    "in_production": "Print Production",
    "ready_or_shipped": "Ready/Shipped",
    "shipped": "Being Quality Checked",
    "completed": "Ready/Shipped",
    
    // === WooCommerce Status Formats (hyphenated) ===
    "pending": "Order Received",
    "processing": "Order Received",
    "on-hold": "Order Received",
    "waiting-to-place-order": "Order Received",
    "waiting-on-email-response": "Order Received",
    "add-on": "Order Received",
    "dropbox-link-sent": "Dropbox Link Sent",
    "in-design": "Files Received",
    "file-error": "Files Received",
    "missing-file": "Files Received",
    "design-complete": hasApproveFlowProject ? "Awaiting Approval" : "Print Production",
    "work-order-printed": hasApproveFlowProject ? "Awaiting Approval" : "Print Production",
    "ready-for-print": "Print Production",
    "pre-press": "Print Production",
    "print-production": "Print Production",
    "in-production": "Print Production",
    "lamination": "Print Production",
    "finishing": "Print Production",
    "ready-for-pickup": "Ready/Shipped",
    "shipping-cost": "Ready/Shipped",
  };

  const displayStatus = statusMap[currentStatus] || "Order Received";
  
  // Update steps dynamically based on whether ApproveFlow is active
  const steps = CUSTOMER_STEPS.map(step => {
    if (step.label === "Awaiting Approval" && !hasApproveFlowProject) {
      return { label: "Files Sent to Print", icon: step.icon };
    }
    return step;
  });

  const currentIndex = steps.findIndex(step => 
    step.label === displayStatus
  );

  return (
    <div className="w-full py-4 sm:py-6 bg-[#0A0A0F] -mx-2 sm:mx-0">
      {/* Progress icons with labels and connecting line */}
      <div className="relative flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 overflow-x-auto pb-2 custom-scrollbar">
        {/* Base gray line connecting all steps - hidden on mobile */}
        <div className="hidden sm:block absolute top-5 left-12 right-12 h-0.5 bg-gray-700/50 z-0" />
        
        {/* Animated blue progress line - hidden on mobile */}
        <div 
          className="hidden sm:block absolute top-5 left-12 h-0.5 bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] z-0 transition-all duration-700 ease-out"
          style={{ 
            width: currentIndex >= 0 
              ? `calc(${(currentIndex / (steps.length - 1)) * 100}% - 48px)` 
              : '0%'
          }}
        />
        
        {steps.map((step, i) => {
          const completed = i < currentIndex;
          const active = i === currentIndex;
          const pending = i > currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.label} className="flex flex-col items-center min-w-[60px] sm:min-w-[80px] relative z-10">
              <div 
                className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-all duration-500 ${
                  completed
                    ? "bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] shadow-lg ring-2 sm:ring-4 ring-blue-400/20" 
                    : active
                    ? "bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] shadow-lg ring-2 sm:ring-4 ring-blue-400/40 animate-pulse"
                    : "bg-gray-700"
                }`}
              >
                {completed ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : active ? (
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                ) : (
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white/40" />
                )}
              </div>
              <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center transition-colors duration-300 leading-tight ${
                completed || active ? 'text-[#15D1FF] font-semibold' : 'text-white/40'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
