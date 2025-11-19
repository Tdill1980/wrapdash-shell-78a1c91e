import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { ShopFlowStatusTag } from "./ShopFlowStatusTag";
import { wooToInternalStatus } from "@/lib/status-mapping";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShopFlowTableProps {
  orders: ShopFlowOrder[];
}

export function ShopFlowTable({ orders }: ShopFlowTableProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => {
          const internalStatus = wooToInternalStatus[order.status] || "order_received";
          return (
            <Card
              key={order.id}
              className="p-4 cursor-pointer hover:border-border hover:shadow-md hover:shadow-primary/5 transition-all border-border/50 bg-card/50"
              onClick={() => navigate(`/shopflow/${order.id}`)}
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-background rounded border border-border/50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-muted-foreground" />
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
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <ShopFlowStatusTag status={internalStatus} />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), "MMM d")}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <Card className="border-border/50 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Product</TableHead>
            <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Order #</TableHead>
            <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Customer</TableHead>
            <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Status</TableHead>
            <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Created</TableHead>
            <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const internalStatus = wooToInternalStatus[order.status] || "order_received";
            return (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/20 border-border/50 transition-colors"
                onClick={() => {
                  console.log('ShopFlowTable: Navigating to order ID:', order.id);
                  navigate(`/shopflow/${order.id}`);
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-background rounded border border-border/50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">
                      {order.product_type}
                    </span>
                  </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {order.woo_order_number ?? order.order_number}
                  </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.customer_name}
                </TableCell>
                <TableCell>
                  <ShopFlowStatusTag status={internalStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/shopflow/${order.id}`);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
