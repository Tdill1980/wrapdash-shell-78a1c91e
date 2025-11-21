import { Package } from "lucide-react";

interface OrderSummaryCardProps {
  order: {
    product_type?: string;
    product_image_url?: string | null;
    vehicle_info?: any;
    customer_email?: string | null;
    productType?: string;
    vehicle?: string;
    orderNumber?: string;
    customerName?: string;
    customer_stage?: string;
    created_at?: string;
  };
}

export const OrderSummaryCard = ({ order }: OrderSummaryCardProps) => {
  const productType = order.product_type || order.productType || 'Product';
  const productImage = order.product_image_url;
  
  const orderInfo = order.vehicle_info as any;
  
  // Extract order details from WooCommerce metadata
  const quantity = orderInfo?.quantity || 1;
  const sqft = orderInfo?.square_footage || orderInfo?.sqft || 'TBD';
  const shippingSpeed = orderInfo?.shipping_speed || orderInfo?.shipping || 'Standard';

  return (
    <div className="bg-[#111317] border border-white/10 rounded-xl p-5">
      <h3 className="card-header mb-4">Order Summary</h3>

      <div className="flex gap-4 items-start mb-4">
        {productImage ? (
          <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
            <img
              src={productImage}
              alt={productType}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
            <Package className="w-8 h-8 text-white/30" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#2F81F7]" />
            <p className="font-semibold text-white">{productType}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p className="text-xs text-white/50">Quantity</p>
              <p className="text-sm text-white font-semibold">{quantity}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Square Footage</p>
              <p className="text-sm text-white font-semibold">{sqft} sq ft</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-white/50">Shipping Speed</p>
              <p className="text-sm text-white font-semibold">{shippingSpeed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
