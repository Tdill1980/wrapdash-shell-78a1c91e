import { Badge } from "@/components/ui/badge";

interface ShopFlowStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  processing: { label: "New", className: "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white border-0" },
  "missing-file": { label: "Awaiting Files", className: "bg-gradient-to-r from-[#FFB366] to-[#FF6B6B] text-white border-0" },
  "file-error": { label: "File Error", className: "bg-gradient-to-r from-[#FFB366] to-[#FF6B6B] text-white border-0" },
  "in-design": { label: "In Design", className: "bg-gradient-to-r from-[#6AB9FF] to-[#4A9FFF] text-white border-0" },
  "design-complete": { label: "Awaiting Approval", className: "bg-gradient-to-r from-[#8FD3FF] to-[#6AB9FF] text-white border-0" },
  "print-production": { label: "Ready to Print", className: "bg-gradient-to-r from-[#4EEAFF] to-[#0047FF] text-white border-0" },
  lamination: { label: "In Production", className: "bg-gradient-to-r from-[#4EEAFF] to-[#0047FF] text-white border-0" },
  finishing: { label: "Finishing", className: "bg-gradient-to-r from-[#4EEAFF] to-[#0047FF] text-white border-0" },
  "ready-for-pickup": { label: "Ready", className: "bg-gradient-to-r from-[#6AB9FF] to-[#8FD3FF] text-white border-0" },
  shipped: { label: "Shipped", className: "bg-gradient-to-r from-[#6AB9FF] to-[#8FD3FF] text-white border-0" },
  completed: { label: "Completed", className: "bg-gradient-to-r from-[#8FD3FF] to-[#4EEAFF] text-white border-0" },
};

export function ShopFlowStatusBadge({ status }: ShopFlowStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.processing;

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
