import { Package, Calendar, User } from "lucide-react";

interface OrderSummary {
  orderNumber: string;
  customerName: string;
  vehicle: string;
  productType: string;
  customer_stage: string;
  created_at?: string;
}

interface OrderSummaryCardProps {
  order: OrderSummary;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[26px] font-semibold font-poppins text-white">
          Order #{order.orderNumber}
        </h2>
        <div className="px-3 py-1 bg-gradient-to-r from-[#5AC8FF] via-[#2F8CFF] to-[#1A5BFF] rounded-lg text-white text-xs font-semibold">
          TRACKING
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Package className="w-5 h-5 text-[#5AC8FF]" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-inter mb-1">Product</p>
            <p className="text-white text-sm font-medium">{order.productType}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <User className="w-5 h-5 text-[#5AC8FF]" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-inter mb-1">Vehicle</p>
            <p className="text-white text-sm font-medium">{order.vehicle}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Calendar className="w-5 h-5 text-[#5AC8FF]" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-inter mb-1">Customer</p>
            <p className="text-white text-sm font-medium">{order.customerName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
