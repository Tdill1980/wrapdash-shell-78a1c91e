import { Package } from "lucide-react";

interface OrderSummaryCardProps {
  order: {
    // New format
    product_type?: string;
    product_image_url?: string | null;
    vehicle_info?: any;
    customer_email?: string | null;
    // Old format for backward compatibility
    productType?: string;
    vehicle?: string;
    orderNumber?: string;
    customerName?: string;
    customer_stage?: string;
    created_at?: string;
  };
}

export const OrderSummaryCard = ({ order }: OrderSummaryCardProps) => {
  // Support both old and new prop formats
  const productType = order.product_type || order.productType || 'Product';
  const productImage = order.product_image_url;
  
  const vehicleInfo = order.vehicle_info as any;
  const vehicleDisplay = order.vehicle 
    || (vehicleInfo ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim() : null)
    || 'Vehicle Info Pending';

  return (
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>

      <div className="flex gap-4 items-start">
        {productImage && (
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
            <img
              src={productImage}
              alt={productType}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-[#2F81F7]" />
            <p className="font-semibold text-white">{productType}</p>
          </div>
          <p className="text-sm text-white/70">{vehicleDisplay}</p>
        </div>
      </div>
    </div>
  );
};
