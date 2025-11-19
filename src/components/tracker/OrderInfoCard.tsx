import { Package, Car, User } from "lucide-react";

interface OrderInfoCardProps {
  order: {
    woo_order_number?: number | null;
    order_number: string;
    product_type: string;
    product_image_url?: string | null;
    vehicle_info?: any;
    customer_name: string;
  };
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  const vehicleInfo = order.vehicle_info as any;
  const vehicleDisplay = vehicleInfo 
    ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
    : 'Vehicle Info Pending';

  return (
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5 flex gap-6 items-start">
      {/* Product Thumbnail */}
      {order.product_image_url && (
        <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
          <img
            src={order.product_image_url}
            alt={order.product_type}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 text-white flex-1">
        <div>
          <h2 className="card-header">
            Order #{order.woo_order_number ?? order.order_number}
          </h2>
          <p className="text-white/70 mt-1">{order.customer_name}</p>
        </div>

        <div className="flex flex-wrap gap-8 text-white/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-[#2F81F7]" />
              <p className="text-xs uppercase opacity-50">Product</p>
            </div>
            <p className="font-medium text-white">{order.product_type}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-4 h-4 text-[#2F81F7]" />
              <p className="text-xs uppercase opacity-50">Vehicle</p>
            </div>
            <p className="font-medium text-white">{vehicleDisplay}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
