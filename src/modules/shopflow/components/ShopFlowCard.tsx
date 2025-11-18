import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopFlowStatusBadge } from "./ShopFlowStatusBadge";
import { ShopFlowJob } from "../hooks/useShopFlowList";
import { Package, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ShopFlowCardProps {
  job: ShopFlowJob;
}

export function ShopFlowCard({ job }: ShopFlowCardProps) {
  const navigate = useNavigate();
  
  const vehicleInfo = job.vehicle_info || {};
  const vehicleDisplay = vehicleInfo.year && vehicleInfo.make && vehicleInfo.model
    ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
    : "No vehicle info";

  return (
    <Card className="bg-[#16161E] border border-white/[0.06] p-4 hover:border-white/10 transition-all cursor-pointer">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">
              {job.customer_name}
            </h4>
            <p className="text-sm text-[#B8B8C7] truncate">
              Order #{job.order_number}
            </p>
          </div>
          <ShopFlowStatusBadge status={job.status} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#B8B8C7]">
            <Package className="w-4 h-4" />
            <span className="truncate">{job.product_type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#B8B8C7]">
            <Calendar className="w-4 h-4" />
            <span className="truncate">{vehicleDisplay}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-xs text-[#B8B8C7]">
            {format(new Date(job.updated_at), "MMM d, h:mm a")}
          </span>
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white hover:opacity-90"
            onClick={() => navigate(`/shopflow/${job.id}`)}
          >
            View Job
          </Button>
        </div>
      </div>
    </Card>
  );
}
