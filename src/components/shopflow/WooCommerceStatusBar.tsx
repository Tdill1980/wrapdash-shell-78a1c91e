import { WOO_STATUS_FLOW, getWooStatusIndex, formatWooStatus } from "@/lib/woo-status-display";
import { CheckCircle2, Circle } from "lucide-react";

interface WooCommerceStatusBarProps {
  currentStatus: string;
}

export function WooCommerceStatusBar({ currentStatus }: WooCommerceStatusBarProps) {
  const currentIndex = getWooStatusIndex(currentStatus);

  return (
    <div className="w-full py-6 bg-[#0A0A0F] rounded-lg border border-white/5 mb-6">
      <div className="px-6 mb-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          WooCommerce Status Workflow
        </h3>
      </div>
      
      {/* Progress Flow */}
      <div className="relative px-6">
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {WOO_STATUS_FLOW.map((step, i) => {
            const isComplete = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isPending = i > currentIndex;
            
            return (
              <div key={step.status} className="flex flex-col items-center min-w-[120px]">
                {/* Status Dot */}
                <div 
                  className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-all ${
                    isCurrent 
                      ? "bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20" 
                      : isComplete
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : "bg-gray-700 border-2 border-gray-600"
                  }`}
                >
                  {isComplete || isCurrent ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-white/40" />
                  )}
                </div>
                
                {/* Label */}
                <p className={`text-xs mt-3 text-center font-medium ${
                  isCurrent 
                    ? 'text-[#15D1FF]' 
                    : isComplete
                    ? 'text-emerald-400'
                    : 'text-white/40'
                }`}>
                  {step.label}
                </p>
                
                {/* Category Badge */}
                <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full ${
                  step.category === 'order' ? 'bg-blue-500/20 text-blue-400' :
                  step.category === 'design' ? 'bg-purple-500/20 text-purple-400' :
                  step.category === 'approval' ? 'bg-amber-500/20 text-amber-400' :
                  step.category === 'production' ? 'bg-indigo-500/20 text-indigo-400' :
                  step.category === 'shipping' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {step.category}
                </span>
                
                {/* Connecting Line */}
                {i < WOO_STATUS_FLOW.length - 1 && (
                  <div className="absolute top-5 left-[calc(50%+60px)] w-[80px] h-[2px]">
                    <div className={`h-full ${
                      i < currentIndex 
                        ? "bg-gradient-to-r from-emerald-500 to-green-500" 
                        : "bg-gray-700"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Status Display */}
      <div className="px-6 mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">Current Status:</span>
          <span className="text-sm font-semibold text-white bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
            {formatWooStatus(currentStatus)}
          </span>
        </div>
      </div>
    </div>
  );
}
