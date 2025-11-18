import { ShopFlowJob } from "../hooks/useShopFlowList";
import { ShopFlowStatusBadge } from "./ShopFlowStatusBadge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";

interface ShopFlowTableProps {
  jobs: ShopFlowJob[];
}

export function ShopFlowTable({ jobs }: ShopFlowTableProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="bg-[#16161E] border border-white/[0.06] p-4 cursor-pointer hover:border-white/10 transition-all"
            onClick={() => navigate(`/shopflow/${job.id}`)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white">{job.customer_name}</h4>
                  <p className="text-sm text-[#B8B8C7]">Order #{job.order_number}</p>
                </div>
                <ShopFlowStatusBadge status={job.status} />
              </div>
              <p className="text-sm text-[#B8B8C7]">{job.product_type}</p>
              <p className="text-xs text-[#B8B8C7]">
                {format(new Date(job.updated_at), "MMM d, yyyy")}
              </p>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#16161E] border border-white/[0.06] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#101016] border-b border-white/[0.06]">
          <tr>
            <th className="text-left text-xs font-semibold text-[#B8B8C7] uppercase tracking-wider p-4">
              Customer
            </th>
            <th className="text-left text-xs font-semibold text-[#B8B8C7] uppercase tracking-wider p-4">
              Order #
            </th>
            <th className="text-left text-xs font-semibold text-[#B8B8C7] uppercase tracking-wider p-4">
              Product
            </th>
            <th className="text-left text-xs font-semibold text-[#B8B8C7] uppercase tracking-wider p-4">
              Status
            </th>
            <th className="text-left text-xs font-semibold text-[#B8B8C7] uppercase tracking-wider p-4">
              Updated
            </th>
            <th className="text-right text-xs font-semibold text-[#B8B8C7] uppercase tracking-wider p-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="hover:bg-white/[0.02] cursor-pointer transition-colors"
              onClick={() => navigate(`/shopflow/${job.id}`)}
            >
              <td className="p-4 text-white">{job.customer_name}</td>
              <td className="p-4 text-[#B8B8C7]">{job.order_number}</td>
              <td className="p-4 text-[#B8B8C7]">{job.product_type}</td>
              <td className="p-4">
                <ShopFlowStatusBadge status={job.status} />
              </td>
              <td className="p-4 text-[#B8B8C7]">
                {format(new Date(job.updated_at), "MMM d, h:mm a")}
              </td>
              <td className="p-4 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#8FD3FF]/40 text-[#8FD3FF] hover:bg-[#8FD3FF]/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/shopflow/${job.id}`);
                  }}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
