import { Package, Upload, CheckCircle, Eye, Printer, Scissors, Truck } from "lucide-react";

const CUSTOMER_STEPS = [
  { label: "Order Received", icon: Package },
  { label: "Files Received", icon: Upload },
  { label: "Preflight", icon: CheckCircle },
  { label: "Awaiting Approval", icon: Eye },
  { label: "Print Production", icon: Printer },
  { label: "In Production", icon: Scissors },
  { label: "Ready/Shipped", icon: Truck },
];

interface CustomerProgressBarProps {
  currentStatus: string;
}

export const CustomerProgressBar = ({ currentStatus }: CustomerProgressBarProps) => {
  // Map internal status to simplified customer stages
  const statusMap: Record<string, string> = {
    "order_received": "Order Received",
    "awaiting_payment": "Order Received",
    "in_design": "Files Received",
    "action_required": "Files Received",
    "awaiting_approval": "Awaiting Approval",
    "preparing_for_print": "Print Production",
    "in_production": "In Production",
    "ready_or_shipped": "Ready/Shipped",
    "completed": "Ready/Shipped"
  };

  const displayStatus = statusMap[currentStatus] || "Order Received";
  const currentIndex = CUSTOMER_STEPS.findIndex(step => 
    step.label === displayStatus
  );

  return (
    <div className="w-full py-6 bg-[#0A0A0F]">
      {/* Progress icons with labels */}
      <div className="flex items-center justify-between gap-2 px-4 overflow-x-auto">
        {CUSTOMER_STEPS.map((step, i) => {
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
