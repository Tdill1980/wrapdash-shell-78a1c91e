import { ShopFlowOrder } from '@/hooks/useShopFlow';

interface CustomerInfoCardProps {
  order: ShopFlowOrder;
}

export const CustomerInfoCard = ({ order }: CustomerInfoCardProps) => (
  <div className="bg-[#101016] border border-white/5 rounded-lg p-4">
    <h3 className="text-white font-semibold mb-2">Customer</h3>
    <p className="text-gray-300 text-sm">{order.customer_name}</p>
    {order.customer_email && (
      <p className="text-gray-400 text-sm">{order.customer_email}</p>
    )}
  </div>
);
