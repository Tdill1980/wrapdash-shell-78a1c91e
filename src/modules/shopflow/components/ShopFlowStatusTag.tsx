import { Badge } from "@/components/ui/badge";
import { InternalStatus } from "@/lib/status-mapping";

interface ShopFlowStatusTagProps {
  status: InternalStatus;
}

const statusConfig: Record<InternalStatus, { label: string; gradient: string }> = {
  order_received: {
    label: "Order Received",
    gradient: "bg-gradient-primary",
  },
  in_design: {
    label: "In Design",
    gradient: "bg-gradient-primary",
  },
  action_required: {
    label: "Action Required",
    gradient: "bg-gradient-to-r from-red-500 to-orange-500",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    gradient: "bg-gradient-to-r from-yellow-500 to-amber-500",
  },
  preparing_for_print: {
    label: "Preparing for Print",
    gradient: "bg-gradient-primary",
  },
  in_production: {
    label: "In Production",
    gradient: "bg-gradient-primary",
  },
  ready_or_shipped: {
    label: "Ready / Shipped",
    gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
  },
  completed: {
    label: "Completed",
    gradient: "bg-gradient-to-r from-gray-500 to-slate-500",
  },
};

export function ShopFlowStatusTag({ status }: ShopFlowStatusTagProps) {
  const config = statusConfig[status];

  return (
    <Badge className={`${config.gradient} text-white border-0`}>
      {config.label}
    </Badge>
  );
}
