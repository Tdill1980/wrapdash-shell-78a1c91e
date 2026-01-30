import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopFlowStatusTag } from "./ShopFlowStatusTag";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { InternalStatus } from "@/lib/status-mapping";
import { Package, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShopFlowCardProps {
  order: ShopFlowOrder;
  internalStatus: InternalStatus;
}

export function ShopFlowCard({ order, internalStatus }: ShopFlowCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="p-4 bg-card/50 border border-border/50 hover:border-border hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
      onClick={() => {
        console.log('ShopFlowCard CARD clicked, order ID:', order.id);
        navigate(`/shopflow/${order.id}`);
      }}
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-background rounded border border-border flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">
            {order.product_type}
          </h4>
          <p className="text-sm text-muted-foreground">
            Order #{order.woo_order_number ?? order.order_number}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {order.customer_name}
          </p>
          {order.order_total && order.order_total > 0 && (
            <p className="text-xs mt-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-medium">
                ${Number(order.order_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          )}
          <div className="mt-2">
            <ShopFlowStatusTag status={internalStatus} />
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3 hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          console.log('ShopFlowCard: Navigating to order ID:', order.id);
          navigate(`/shopflow/${order.id}`);
        }}
      >
        View Details
      </Button>
    </Card>
  );
}
