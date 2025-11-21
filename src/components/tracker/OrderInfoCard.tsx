import { Package } from "lucide-react";
import { format } from "date-fns";

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
    created_at: string;
    files?: any[];
  };
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  return (
    <div className="bg-[#111317] border border-white/10 rounded-xl p-3 sm:p-4 w-full">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Product Thumbnail & Basic Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-[#1a1a24] flex items-center justify-center">
            {order.product_image_url ? (
              <img
                src={order.product_image_url}
                alt={order.product_type}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="text-[#2F81F7]"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>';
                }}
              />
            ) : (
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-[#2F81F7]" />
            )}
          </div>

          {/* Order Number & Customer */}
          <div className="flex flex-col justify-center flex-1 sm:min-w-[140px]">
            <h3 className="text-white font-semibold text-sm sm:text-base">Order #{order.woo_order_number ?? order.order_number}</h3>
            <p className="text-white/60 text-xs truncate">{order.customer_name}</p>
          </div>
        </div>

        {/* Product Type - Hidden on mobile, shown on tablet+ */}
        <div className="hidden sm:flex flex-col justify-center sm:min-w-[120px] border-l border-white/10 pl-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Package className="w-3.5 h-3.5 text-[#2F81F7]" />
            <p className="text-[10px] uppercase text-white/40">Product</p>
          </div>
          <p className="text-white text-xs font-medium">{order.product_type}</p>
        </div>

        {/* Dates - Stack on mobile */}
        <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 text-xs">
          {/* Order Received Date */}
          <div className="flex flex-col justify-center sm:min-w-[100px] sm:border-l sm:border-white/10 sm:pl-4">
            <p className="text-[10px] uppercase text-white/40 mb-0.5">Ordered</p>
            <p className="text-white font-medium text-xs">
              {format(new Date(order.created_at), 'MMM d, yyyy')}
            </p>
            <p className="text-[10px] text-white/40 hidden sm:block">
              {format(new Date(order.created_at), 'h:mm a')}
            </p>
          </div>

          {/* Art Received Date */}
          {order.files && order.files.length > 0 && order.files[0].uploaded_at && (
            <div className="flex flex-col justify-center sm:min-w-[100px] sm:border-l sm:border-white/10 sm:pl-4">
              <p className="text-[10px] uppercase text-white/40 mb-0.5">Art Received</p>
              <p className="text-white font-medium text-xs">
                {format(new Date(order.files[0].uploaded_at), 'MMM d, yyyy')}
              </p>
              <p className="text-[10px] text-white/40 hidden sm:block">
                {format(new Date(order.files[0].uploaded_at), 'h:mm a')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Show product type at bottom */}
      <div className="sm:hidden mt-2 pt-2 border-t border-white/10">
        <p className="text-[10px] uppercase text-white/40">Product</p>
        <p className="text-white text-xs font-medium mt-0.5">{order.product_type}</p>
      </div>
    </div>
  );
};
