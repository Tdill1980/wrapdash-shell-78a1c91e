import { ShopFlowOrder } from '@/hooks/useShopFlow';
import { formatTimeAZ } from '@/lib/timezone';
import { MapPin, Clock, DollarSign } from 'lucide-react';

interface JobDetailsCardProps {
  order: ShopFlowOrder;
}

export const JobDetailsCard = ({ order }: JobDetailsCardProps) => (
  <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
    <h3 className="text-white font-semibold mb-3">Job Details</h3>
    <div className="space-y-2">
      <p className="text-gray-300 text-sm">Type: {order.product_type}</p>
      {order.order_total && order.order_total > 0 && (
        <p className="text-gray-300 text-sm flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-green-400" />
          <span className="text-green-400 font-medium">
            ${Number(order.order_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      )}
      {(order.shipping_city || order.shipping_state) && (
        <p className="text-gray-300 text-sm flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {[order.shipping_city, order.shipping_state].filter(Boolean).join(', ')}
        </p>
      )}
      {order.priority && (
        <p className="text-gray-300 text-sm">Priority: {order.priority}</p>
      )}
      {order.assigned_to && (
        <p className="text-gray-300 text-sm">Assigned: {order.assigned_to}</p>
      )}
      <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Received: {formatTimeAZ(order.created_at)}
      </p>
    </div>
  </div>
);
