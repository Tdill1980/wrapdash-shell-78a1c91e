const INTERNAL_STEPS = [
  { key: "awaiting_payment", label: "Awaiting Payment" },
  { key: "order_received", label: "Order Received" },
  { key: "link_sent", label: "Dropbox Link Sent" },
  { key: "awaiting_files", label: "Awaiting Files" },
  { key: "missing_file", label: "Missing File" },
  { key: "file_error", label: "File Error" },
  { key: "files_received", label: "Files Received" },
  { key: "preflight", label: "Preflight Check" },
  { key: "awaiting_approval", label: "Awaiting Approval" },
  { key: "prepress_complete", label: "Prepress Complete" },
  { key: "printing", label: "Printing" },
  { key: "laminating", label: "Laminating" },
  { key: "cutting", label: "Cutting/Finishing" },
  { key: "quality_check", label: "Quality Check" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Completed" }
];

interface InternalProductionTrackerProps {
  internalStatus: string;
}

export const InternalProductionTracker = ({ internalStatus }: InternalProductionTrackerProps) => {
  const currentIndex = INTERNAL_STEPS.findIndex(step => step.key === internalStatus);

  return (
    <div className="w-full py-6 bg-[#111118] border border-white/10 rounded-lg px-6 mb-6">
      <h2 className="text-xl font-bold text-white mb-4">Internal Production Status</h2>
      <div className="flex flex-col gap-3">
        {INTERNAL_STEPS.map((step, i) => {
          const active = i <= currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={i} className="flex items-center gap-3">
              <div 
                className={`h-3 w-3 rounded-full transition-all ${
                  isCurrent
                    ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] shadow-lg shadow-cyan-500/50"
                    : active 
                    ? "bg-cyan-400" 
                    : "bg-gray-600"
                }`} 
              />
              <p className={`text-sm ${isCurrent ? "text-white font-semibold" : active ? "text-gray-300" : "text-gray-500"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
