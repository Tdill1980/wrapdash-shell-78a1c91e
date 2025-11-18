import { ShopFlowOrder } from '@/hooks/useShopFlow';
import { format } from 'date-fns';

interface JobDetailsCardProps {
  order: ShopFlowOrder;
}

export const JobDetailsCard = ({ order }: JobDetailsCardProps) => (
  <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
    <h3 className="text-white font-semibold mb-2">Job Details</h3>
    <p className="text-gray-300 text-sm">Type: {order.product_type}</p>
    {order.priority && (
      <p className="text-gray-300 text-sm">Priority: {order.priority}</p>
    )}
    {order.assigned_to && (
      <p className="text-gray-300 text-sm">Assigned: {order.assigned_to}</p>
    )}
    <p className="text-gray-400 text-xs mt-2">
      Created: {format(new Date(order.created_at), 'MMM d, yyyy')}
    </p>
  </div>
);
