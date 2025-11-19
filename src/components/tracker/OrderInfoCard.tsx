import { Package, Car, Mail, Phone } from "lucide-react";

interface OrderInfoCardProps {
  order: {
    woo_order_number?: number | null;
    order_number: string;
    product_type: string;
    product_image_url?: string | null;
    vehicle_info?: any;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
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
      <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-[#1a1a24] flex items-center justify-center">
        {order.product_image_url ? (
          <img
            src={order.product_image_url}
            alt={order.product_type}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="text-[#2F81F7]"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>';
            }}
          />
        ) : (
          <Package className="w-10 h-10 text-[#2F81F7]" />
        )}
      </div>

      <div className="flex flex-col gap-3 text-white flex-1">
        <div>
          <h2 className="card-header">
            Order #{order.woo_order_number ?? order.order_number}
          </h2>
          <p className="text-white/70 mt-1">{order.customer_name}</p>
          {order.customer_email && (
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 text-[#2F81F7]" />
              <p className="text-white/60 text-sm">{order.customer_email}</p>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex items-center gap-2 mt-1">
              <Phone className="w-3.5 h-3.5 text-[#2F81F7]" />
              <p className="text-white/60 text-sm">{order.customer_phone}</p>
            </div>
          )}
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
