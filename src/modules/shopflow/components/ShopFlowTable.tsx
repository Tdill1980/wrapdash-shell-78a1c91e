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

interface ShopFlowTableProps {
  orders: ShopFlowOrder[];
}

export function ShopFlowTable({ orders }: ShopFlowTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="font-bold text-foreground">Product</TableHead>
            <TableHead className="font-bold text-foreground">Order #</TableHead>
            <TableHead className="font-bold text-foreground">Customer</TableHead>
            <TableHead className="font-bold text-foreground">Status</TableHead>
            <TableHead className="font-bold text-foreground">Created</TableHead>
            <TableHead className="font-bold text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const internalStatus = wooToInternalStatus[order.status] || "order_received";
            return (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/30 border-border"
                onClick={() => navigate(`/shopflow/${order.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">
                      {order.product_type}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {order.order_number}
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
