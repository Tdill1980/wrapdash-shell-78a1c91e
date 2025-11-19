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
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5">
      <h3 className="card-header mb-4">Timeline</h3>

      <div className="space-y-4">
        {timeline.map((event, i) => (
          <div key={i} className="flex items-start gap-3">
            <div 
              className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 ${
                event.completed 
                  ? 'bg-gradient-to-r from-[#2F81F7] to-[#15D1FF]' 
                  : 'bg-gray-700'
              }`}
            />
            <div className="flex-1">
              <p className={`font-medium ${event.completed ? 'text-white' : 'text-white/50'}`}>
                {event.label}
              </p>
              {event.timestamp && (
                <p className="text-xs text-white/40 mt-1">{event.timestamp}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
