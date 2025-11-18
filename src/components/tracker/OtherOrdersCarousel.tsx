import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface OrderSummary {
  orderNumber: string;
  vehicle: string;
  productType: string;
  customer_stage: string;
}

interface OtherOrdersCarouselProps {
  orders: OrderSummary[];
}

const STAGE_LABELS: Record<string, string> = {
  order_received: "Received",
  files_received: "Files In",
  preflight: "Preflight",
  file_error: "Error",
  missing_file: "Missing File",
  preparing_print_files: "Preparing",
  awaiting_approval: "Approval",
  printing: "Printing",
  laminating: "Laminating",
  cutting: "Cutting",
  qc: "QC",
  ready: "Ready",
};

export function OtherOrdersCarousel({ orders }: OtherOrdersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!orders || orders.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? orders.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === orders.length - 1 ? 0 : prev + 1));
  };

  const visibleOrders = orders.slice(currentIndex, currentIndex + 3).concat(
    orders.slice(0, Math.max(0, currentIndex + 3 - orders.length))
  );

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px] font-semibold font-poppins text-white">
          Your Other Orders
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            disabled={orders.length <= 3}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            disabled={orders.length <= 3}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleOrders.map((order, index) => (
          <div
            key={`${order.orderNumber}-${index}`}
            className="bg-[#111111] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold text-sm mb-1">
                  #{order.orderNumber}
                </p>
                <p className="text-white/60 text-xs">
                  {order.vehicle}
                </p>
              </div>
              <div className="px-2 py-1 bg-gradient-to-r from-[#5AC8FF] to-[#1A5BFF] rounded text-white text-[10px] font-semibold">
                {STAGE_LABELS[order.customer_stage] || "Processing"}
              </div>
            </div>

            <p className="text-white/70 text-xs mb-3">
              {order.productType}
            </p>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => window.open(`/track-order/${order.orderNumber}`, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Track
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
