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
  // Map WooCommerce status to simplified customer stages
  const statusMap: Record<string, string> = {
    // Order stages
    "pending": "Order Received",
    "processing": "Order Received",
    "on-hold": "Order Received",
    "waiting-to-place-order": "Order Received",
    "waiting-on-email-response": "Order Received",
    "add-on": "Order Received",
    
    // Dropbox stage
    "dropbox-link-sent": "Dropbox Link Sent",
    
    // Files received stages
    "in-design": "Files Received",
    "file-error": "Files Received",
    "missing-file": "Files Received",
    
    // Approval stages
    "design-complete": hasApproveFlowProject ? "Awaiting Approval" : "Print Production",
    "work-order-printed": hasApproveFlowProject ? "Awaiting Approval" : "Print Production",
    
    // Production stages
    "ready-for-print": "Print Production",
    "pre-press": "Print Production",
    "print-production": "Print Production",
    "in-production": "Print Production",
    "in_production": "Print Production",
    "lamination": "Print Production",
    "finishing": "Print Production",
    
    // Quality check - ONLY when shipped
    "shipped": "Being Quality Checked",
    
    // Final stages
    "ready-for-pickup": "Ready/Shipped",
    "shipping-cost": "Ready/Shipped",
    "completed": "Ready/Shipped"
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
    <div className="w-full py-6 bg-[#0A0A0F]">
      {/* Progress icons with labels */}
      <div className="flex items-center justify-between gap-2 px-4 overflow-x-auto">
        {steps.map((step, i) => {
          const active = i <= currentIndex;
          const Icon = step.icon;
          
          return (
            <div key={step.label} className="flex flex-col items-center min-w-[80px]">
              <div 
                className={`h-10 w-10 flex items-center justify-center rounded-full transition-all ${
                  active 
                    ? "bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] shadow-lg" 
                    : "bg-gray-700"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-white/40'}`} />
              </div>
              <p className={`text-xs mt-2 text-center ${active ? 'text-[#15D1FF]' : 'text-white/40'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
