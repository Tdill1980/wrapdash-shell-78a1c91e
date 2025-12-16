import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useShopFlow } from "@/hooks/useShopFlow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Zap, Search, Package, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ShopFlowBulkAdmin() {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["shopflow-orders-bulk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopflow_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = orders?.filter((order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleAll = () => {
    if (selectedOrders.size === filteredOrders?.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders?.map((o) => o.id) || []));
    }
  };

  const handleBulkSync = async () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to sync",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const orderNumbers = orders
        ?.filter((o) => selectedOrders.has(o.id))
        .map((o) => o.order_number) || [];

      const { data, error } = await supabase.functions.invoke("bulk-sync-orders", {
        body: { orderNumbers },
      });

      if (error) throw error;

      toast({
        title: "Bulk sync complete",
        description: `Successfully synced ${data.synced} orders. ${data.failed} failed.`,
      });

      await refetch();
      setSelectedOrders(new Set());
    } catch (error: any) {
      console.error("Bulk sync error:", error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync orders",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to update",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderIds = Array.from(selectedOrders);
      
      const { error } = await supabase
        .from("shopflow_orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in("id", orderIds);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Updated ${orderIds.length} orders to ${newStatus}`,
      });

      await refetch();
      setSelectedOrders(new Set());
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update statuses",
        variant: "destructive",
      });
    }
  };

  const handleBackfillOrderTotals = async () => {
    setIsBackfilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-order-totals");

      if (error) throw error;

      toast({
        title: "Backfill complete",
        description: `Updated ${data.success} orders. ${data.failed} failed. ${data.skipped} skipped.`,
      });

      await refetch();
    } catch (error: any) {
      console.error("Backfill error:", error);
      toast({
        title: "Backfill failed",
        description: error.message || "Failed to backfill order totals",
        variant: "destructive",
      });
    } finally {
      setIsBackfilling(false);
    }
  };

  return (
    <MainLayout userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-white">Bulk </span>
              <span className="bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] bg-clip-text text-transparent">
                ShopFlow
              </span>
              <span className="text-white"> Admin</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage multiple orders at once
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-sm">
                {selectedOrders.size} selected
              </Badge>
              <Button
                onClick={handleBulkSync}
                disabled={selectedOrders.size === 0 || isSyncing}
                size="sm"
                className="gap-2"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync from WooCommerce
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("in_production")}
                disabled={selectedOrders.size === 0}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Mark In Production
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate("shipped")}
                disabled={selectedOrders.size === 0}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Package className="w-4 h-4" />
                Mark Shipped
              </Button>
              <Button
                onClick={handleBackfillOrderTotals}
                disabled={isBackfilling}
                size="sm"
                variant="secondary"
                className="gap-2"
              >
                {isBackfilling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                {isBackfilling ? "Backfilling..." : "Backfill Order Totals"}
              </Button>
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </Card>

        {/* Orders List */}
        <Card>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedOrders.size === filteredOrders?.length && filteredOrders?.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-semibold">
                Select All ({filteredOrders?.length || 0})
              </span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading orders...
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => toggleOrder(order.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          Order #{order.order_number}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.product_type}
                      </p>
                      {order.order_total > 0 && (
                        <p className="text-sm font-semibold text-green-400 mt-1">
                          ${order.order_total.toFixed(2)}
                        </p>
                      )}
                      {(!order.order_total || order.order_total === 0) && (
                        <p className="text-xs text-yellow-500 mt-1">
                          ⚠️ Missing order total
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Created: {new Date(order.created_at).toLocaleDateString()}</p>
                      {order.updated_at && (
                        <p>Updated: {new Date(order.updated_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No orders found
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
