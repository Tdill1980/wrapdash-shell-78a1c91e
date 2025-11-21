interface TimelineCardProps {
  timeline?: Array<{
    label: string;
    timestamp: string;
    completed: boolean;
  }>;
}

export const TimelineCard = ({ timeline }: TimelineCardProps) => {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5 w-full">
      <h3 className="card-header mb-6">Timeline</h3>

      {/* Horizontal Stepper */}
      <div className="flex items-start justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] transition-all duration-500"
            style={{ 
              width: `${(timeline.filter(e => e.completed).length / timeline.length) * 100}%` 
            }}
          />
        </div>

        {/* Timeline Steps */}
        {timeline.map((event, i) => (
          <div key={i} className="flex flex-col items-center relative z-10 flex-1">
            {/* Dot */}
            <div 
              className={`w-7 h-7 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                event.completed 
                  ? 'bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] shadow-lg shadow-[#2F81F7]/50' 
                  : 'bg-gray-700 border-2 border-gray-600'
              }`}
            >
              {event.completed && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            
            {/* Label & Timestamp */}
            <div className="text-center max-w-[100px]">
              <p className={`text-xs font-medium mb-1 ${event.completed ? 'text-white' : 'text-white/40'}`}>
                {event.label}
              </p>
              {event.timestamp && (
                <p className="text-[10px] text-white/30">
                  {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
