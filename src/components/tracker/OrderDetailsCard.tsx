import { Package, Car, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderDetailsCardProps {
  orderNumber: string | number;
  productName: string;
  customerName: string;
  vehicle: any;
  customerStage: string;
}

const STAGE_LABELS: Record<string, string> = {
  order_received: "Order Received",
  files_received: "Files Received",
  preflight: "Preflight Check",
  file_error: "File Issue",
  missing_file: "Missing File",
  preparing_print_files: "Preparing Files",
  awaiting_approval: "Awaiting Approval",
  printing: "Printing",
  laminating: "Laminating",
  cutting: "Cutting",
  qc: "Quality Check",
  ready: "Ready",
  shipped: "Shipped",
};

export function OrderDetailsCard({ 
  orderNumber, 
  productName, 
  customerName, 
  vehicle,
  customerStage 
}: OrderDetailsCardProps) {
  const vehicleInfo = vehicle as any;
  const vehicleDisplay = vehicleInfo 
    ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
    : 'No vehicle information';

  const statusLabel = STAGE_LABELS[customerStage] || customerStage;

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.5)] mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          Order #{orderNumber}
        </h2>
        <Badge className="bg-gradient-primary text-white border-0">
          {statusLabel}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Package className="w-5 h-5 text-[#5AC8FF]" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium mb-1">PRODUCT</p>
            <p className="text-white text-sm font-medium">{productName}</p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Car className="w-5 h-5 text-[#5AC8FF]" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium mb-1">VEHICLE</p>
            <p className="text-white text-sm font-medium">{vehicleDisplay}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <User className="w-5 h-5 text-[#5AC8FF]" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium mb-1">CUSTOMER</p>
            <p className="text-white text-sm font-medium">{customerName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
