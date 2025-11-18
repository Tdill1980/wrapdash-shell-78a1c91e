import { ShopFlowOrder } from '@/hooks/useShopFlow';
import { format } from 'date-fns';

interface TimelineProps {
  order: ShopFlowOrder;
}

export const Timeline = ({ order }: TimelineProps) => {
  const timeline = order.timeline as any[] || [];

  return (
    <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Timeline</h3>

      {timeline.length > 0 ? (
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  event.status === order.status
                    ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]"
                    : "bg-gray-600"
                }`}
              ></div>
              <div>
                <p className="text-sm text-gray-300">{event.label}</p>
                <p className="text-xs text-gray-500">
                  {event.timestamp && format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No timeline events</p>
      )}
    </div>
  );
};
