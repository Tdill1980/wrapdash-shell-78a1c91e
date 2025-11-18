interface TimelineProps {
  timeline: any[];
}

export const Timeline = ({ timeline }: TimelineProps) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-[#101016] border border-white/5 rounded-lg p-6">
        <h2 className="text-white text-lg font-semibold mb-3">Timeline</h2>
        <p className="text-gray-500 text-sm">No timeline events yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-6">
      <h2 className="text-white text-lg font-semibold mb-4">Timeline</h2>

      <div className="space-y-6">
        {timeline.map((event, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="w-4 h-4 rounded-full mt-1 bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]"></div>
            <div>
              <p className="text-white text-sm">{event.label}</p>
              <p className="text-gray-500 text-xs">{event.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
