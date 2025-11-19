const CUSTOMER_STEPS = [
  "Order Received",
  "Awaiting Payment",
  "Files Needed",
  "Files Received",
  "Preflight",
  "Awaiting Your Approval",
  "Preparing Print Files",
  "Printing Your Wrap",
  "Finishing Your Wrap",
  "Quality Check",
  "Ready for Pickup",
  "Shipped",
  "Completed"
];

interface CustomerProgressBarProps {
  currentStatus: string;
}

export const CustomerProgressBar = ({ currentStatus }: CustomerProgressBarProps) => {
  // Map internal status to customer-friendly display
  const statusMap: Record<string, string> = {
    "order_received": "Order Received",
    "awaiting_payment": "Awaiting Payment",
    "in_design": "Files Needed",
    "action_required": "Files Needed",
    "awaiting_approval": "Awaiting Your Approval",
    "preparing_for_print": "Preparing Print Files",
    "in_production": "Printing Your Wrap",
    "ready_or_shipped": "Ready for Pickup",
    "completed": "Completed"
  };

  const displayStatus = statusMap[currentStatus] || currentStatus;
  const currentIndex = CUSTOMER_STEPS.findIndex(step => 
    step.toLowerCase().includes(displayStatus.toLowerCase())
  );

  return (
    <div className="w-full py-6">
      {/* Progress dots */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {CUSTOMER_STEPS.map((step, i) => {
          const active = i <= currentIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className={`h-3 w-3 rounded-full transition-all ${
                  active 
                    ? "bg-gradient-to-r from-[#2F81F7] to-[#15D1FF]" 
                    : "bg-gray-600"
                }`} 
              />
            </div>
          );
        })}
      </div>

      {/* Current status label */}
      <p className="text-center text-sm font-medium text-white">
        {displayStatus}
      </p>
    </div>
  );
};
