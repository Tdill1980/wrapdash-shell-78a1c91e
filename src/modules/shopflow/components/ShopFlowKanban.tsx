import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { ShopFlowCard } from "./ShopFlowCard";
import { wooToInternalStatus, InternalStatus } from "@/lib/status-mapping";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShopFlowKanbanProps {
  orders: ShopFlowOrder[];
}

const lanes: { key: InternalStatus; title: string }[] = [
  { key: "order_received", title: "Order Received" },
  { key: "in_design", title: "In Design" },
  { key: "action_required", title: "Action Needed" },
  { key: "awaiting_approval", title: "Awaiting Approval" },
  { key: "preparing_for_print", title: "Preparing for Print" },
  { key: "in_production", title: "In Production" },
  { key: "ready_or_shipped", title: "Ready / Shipped" },
  { key: "completed", title: "Completed" },
];

export function ShopFlowKanban({ orders }: ShopFlowKanbanProps) {
  const ordersByStatus = orders.reduce((acc, order) => {
    const internalStatus = wooToInternalStatus[order.status] || "order_received";
    if (!acc[internalStatus]) {
      acc[internalStatus] = [];
    }
    acc[internalStatus].push(order);
    return acc;
  }, {} as Record<InternalStatus, ShopFlowOrder[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {lanes.map((lane) => {
        const laneOrders = ordersByStatus[lane.key] || [];
        return (
          <div
            key={lane.key}
            className="flex-shrink-0 w-80 bg-card/30 rounded-lg border border-border/50 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">
                {lane.title}
              </h3>
              <span className="text-xs font-semibold text-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/30">
                {laneOrders.length}
              </span>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-2">
                {laneOrders.map((order) => (
                  <ShopFlowCard
                    key={order.id}
                    order={order}
                    internalStatus={lane.key}
                  />
                ))}
                {laneOrders.length === 0 && (
                  <div className="text-center py-12 px-4 text-muted-foreground text-sm border border-dashed border-border/30 rounded-lg bg-background/20">
                    No orders
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
