import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopFlowStatusTag } from "./ShopFlowStatusTag";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { InternalStatus } from "@/lib/status-mapping";
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShopFlowCardProps {
  order: ShopFlowOrder;
  internalStatus: InternalStatus;
}

export function ShopFlowCard({ order, internalStatus }: ShopFlowCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">
            {order.product_type}
          </h4>
          <p className="text-sm text-muted-foreground">
            Order #{order.order_number}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {order.customer_name}
          </p>
          <div className="mt-2">
            <ShopFlowStatusTag status={internalStatus} />
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3"
        onClick={() => navigate(`/shopflow/${order.id}`)}
      >
        View Details
      </Button>
    </Card>
  );
}
