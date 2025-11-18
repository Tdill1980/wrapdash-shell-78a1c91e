import { CheckCircle, Clock } from "lucide-react";

interface OrderTimeline {
  orderReceived?: string;
  filesReceived?: string;
  preflight?: string;
  preparingPrintFiles?: string;
  awaitingApproval?: string;
  printing?: string;
  laminating?: string;
  cutting?: string;
  qc?: string;
  ready?: string;
}

interface TimelineStepperProps {
  order: {
    customer_stage: string;
    timeline: OrderTimeline;
  };
}

const TIMELINE_STEPS = [
  { key: "orderReceived", label: "Order Received", stage: "order_received" },
  { key: "filesReceived", label: "Files Received", stage: "files_received" },
  { key: "preflight", label: "Preflight", stage: "preflight" },
  { key: "preparingPrintFiles", label: "Print Files", stage: "preparing_print_files" },
  { key: "awaitingApproval", label: "Approval", stage: "awaiting_approval" },
  { key: "printing", label: "Printing", stage: "printing" },
  { key: "laminating", label: "Laminating", stage: "laminating" },
  { key: "cutting", label: "Cutting", stage: "cutting" },
  { key: "qc", label: "QC", stage: "qc" },
  { key: "ready", label: "Ready", stage: "ready" },
];

export function TimelineStepper({ order }: TimelineStepperProps) {
  const currentStageIndex = TIMELINE_STEPS.findIndex(s => s.stage === order.customer_stage);

  const getStepStatus = (index: number) => {
    if (index < currentStageIndex) return "completed";
    if (index === currentStageIndex) return "current";
    return "pending";
  };

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <h2 className="text-[22px] font-semibold font-poppins text-white mb-6">
        Production Timeline
      </h2>

      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-white/20"></div>
        <div 
          className="absolute top-5 left-0 h-[2px] bg-gradient-to-r from-[#5AC8FF] via-[#2F8CFF] to-[#1A5BFF] transition-all duration-500"
          style={{ width: `${(currentStageIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
        ></div>

        <div className="relative flex justify-between">
          {TIMELINE_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const timestamp = order.timeline[step.key as keyof OrderTimeline];

            return (
              <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / TIMELINE_STEPS.length}%` }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === "completed" 
                    ? "bg-gradient-to-r from-[#5AC8FF] to-[#1A5BFF] ring-4 ring-[#5AC8FF]/20"
                    : status === "current"
                    ? "bg-gradient-to-r from-[#5AC8FF] to-[#1A5BFF] ring-4 ring-[#5AC8FF]/40 animate-pulse"
                    : "bg-white/20"
                }`}>
                  {status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : status === "current" ? (
                    <Clock className="w-5 h-5 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                  )}
                </div>
                <p className={`text-xs font-inter mt-2 text-center ${
                  status === "pending" ? "text-white/40" : "text-white"
                }`}>
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-[10px] text-white/30 mt-1">
                    {new Date(timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
