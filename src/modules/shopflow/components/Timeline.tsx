import { format } from "date-fns";
import { formatWooStatus, getWooStatusIcon } from "@/lib/woo-status-display";
import { Clock } from "lucide-react";

interface TimelineProps {
  logs: any[];
}

export const Timeline = ({ logs }: TimelineProps) => {
  // Filter for status change events only
  const statusChanges = logs
    .filter(log => log.event_type === 'status_change')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (statusChanges.length === 0) {
    return (
      <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Status History
        </h3>
        <p className="text-gray-400 text-sm">No status changes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-6">
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Status History
      </h3>

      <div className="space-y-4">
        {statusChanges.map((log, idx) => {
          const newStatus = log.payload?.new_status || log.payload?.status;
          const oldStatus = log.payload?.old_status;
          const changedBy = log.payload?.changed_by || 'System';
          const isLatest = idx === 0;
          const StatusIcon = getWooStatusIcon(newStatus);

          return (
            <div key={log.id} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {idx < statusChanges.length - 1 && (
                <div className="absolute left-[13px] top-8 w-0.5 h-full bg-gradient-to-b from-blue-500/30 to-transparent" />
              )}
              
              {/* Status icon */}
              <div className={`
                rounded-full p-2 flex-shrink-0 z-10
                ${isLatest 
                  ? 'bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] animate-pulse' 
                  : 'bg-gray-700'}
              `}>
                <StatusIcon className={`w-4 h-4 ${isLatest ? 'text-white' : 'text-gray-300'}`} />
              </div>

              {/* Status details */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-medium ${isLatest ? 'text-white' : 'text-gray-300'}`}>
                    {formatWooStatus(newStatus)}
                  </p>
                  {isLatest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      Current
                    </span>
                  )}
                </div>
                
                {oldStatus && (
                  <p className="text-xs text-gray-500 mb-1">
                    From: {formatWooStatus(oldStatus)}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}</span>
                  <span>•</span>
                  <span>{changedBy}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
