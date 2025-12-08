import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CheckCircle2, AlertCircle, RefreshCw, Loader2, Wrench } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/layouts/MainLayout";

const statusConfig = {
  order_received: { label: "Order Received", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  files_received: { label: "Files Received", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  file_error: { label: "File Error", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  missing_file: { label: "Missing File", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  in_design: { label: "Preparing for Print", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  awaiting_approval: { label: "Preparing for Print", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  design_complete: { label: "Preparing for Print", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  print_production: { label: "In Production", color: "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white" },
  ready_for_pickup: { label: "Ready for Pickup", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  shipped: { label: "Shipped", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export default function ShopFlowInternalList() {
  const { orders, loading, syncFromWooCommerce } = useShopFlow();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Auto-load last 48 hours on mount
  useEffect(() => {
    syncFromWooCommerce(2);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'order_received':
        return <ClipboardList className="h-4 w-4" />;
      case 'files_received':
        return <Clock className="h-4 w-4" />;
      case 'print_production':
        return <Wrench className="h-4 w-4" />;
      case 'ready_for_pickup':
      case 'shipped':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout userName="Trish">
        <div className="w-full space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-poppins">
              <span className="text-foreground">ShopFlow </span>
              <span className="text-gradient">Internal</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Internal production tracking and workflow management
            </p>
          </div>
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading last 48 hours of orders...</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userName="Trish">
      <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-poppins">
            <span className="text-foreground">ShopFlow </span>
            <span className="text-gradient">Internal</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Internal production tracking • Last 48 hours
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => syncFromWooCommerce(2)} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Orders
            </>
          )}
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-lg mx-auto space-y-5">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ClipboardList className="w-8 h-8 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-xl font-semibold">No Orders Found</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No orders found in the last 48 hours. Click refresh to sync from WooCommerce.
            </p>
          </div>
        </Card>
      ) : isMobile ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = order.status || 'order_received';
            const config = statusConfig[status] || statusConfig.order_received;
            
            return (
              <Card 
                key={order.id} 
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/track/${order.woo_order_number ?? order.order_number}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">#{order.woo_order_number ?? order.order_number}</p>
                      <p className="font-semibold text-foreground">{order.customer_name}</p>
                      {order.customer_email && (
                        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      )}
                    </div>
                    <Badge className={config.color}>
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(status)}
                        {config.label}
                      </span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{order.product_type}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>

                  {order.priority && (
                    <Badge variant={order.priority === 'high' ? 'destructive' : 'secondary'}>
                      {order.priority}
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-white/5">
                <TableHead className="text-muted-foreground font-medium">Order #</TableHead>
                <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                <TableHead className="text-muted-foreground font-medium">Product</TableHead>
                <TableHead className="text-muted-foreground font-medium">Internal Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Priority</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.order_received;
                return (
                  <TableRow 
                    key={order.id}
                    className="hover:bg-white/[0.02] cursor-pointer border-b border-white/5"
                    onClick={() => navigate(`/track/${order.woo_order_number ?? order.order_number}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      #{order.woo_order_number ?? order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        {order.customer_email && (
                          <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.product_type}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${config.color} gap-1.5`}>
                        {getStatusIcon(order.status)}
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.priority ? (
                        <Badge variant={order.priority === 'high' ? 'destructive' : 'secondary'}>
                          {order.priority}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Normal</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/track/${order.woo_order_number ?? order.order_number}`);
                        }}
                      >
                        View Job
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Showing {orders.length} order{orders.length !== 1 ? 's' : ''} from the last 48 hours
      </div>
    </div>
    </MainLayout>
  );
}
