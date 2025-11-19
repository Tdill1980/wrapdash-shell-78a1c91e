import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useShopFlow } from "@/hooks/useShopFlow";
import { ShopFlowKanban, ShopFlowTable } from "@/modules/shopflow";
import { LayoutGrid, Table, RefreshCw, Loader2, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/layouts/MainLayout";

type ViewMode = "kanban" | "table";

export default function ShopFlow() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "table" : "kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const { orders, loading, syncFromWooCommerce } = useShopFlow();

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.product_type.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  if (loading) {
    return (
      <MainLayout userName="Trish">
        <div className="space-y-6 max-w-7xl">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-poppins">
              <span className="text-foreground">Shop</span>
              <span className="text-gradient">
                Flow
              </span>
              <span className="text-muted-foreground text-sm align-super">™</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Production workflow and shop management
            </p>
          </div>
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Loading orders...</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userName="Trish">
      <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-poppins">
            <span className="text-foreground">Shop</span>
            <span className="text-gradient">
              Flow
            </span>
            <span className="text-muted-foreground text-sm align-super">™</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Production workflow and shop management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => syncFromWooCommerce()}
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
                Sync
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {!isMobile && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban View
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
            >
              <Table className="w-4 h-4 mr-2" />
              Table View
            </Button>
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-6 md:p-12 text-center">
          <div className="w-full space-y-5">
            <h2 className="text-lg md:text-xl font-semibold">
              {orders.length === 0 ? "No Orders Yet" : "No Orders Found"}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {orders.length === 0 
                ? "Orders will appear here once they're synced from WooCommerce."
                : "No orders match your search criteria. Try a different search term."}
            </p>
          </div>
        </Card>
      ) : isMobile ? (
        <ShopFlowTable orders={filteredOrders} />
      ) : viewMode === "kanban" ? (
        <ShopFlowKanban orders={filteredOrders} />
      ) : (
        <ShopFlowTable orders={filteredOrders} />
      )}
      </div>
    </MainLayout>
  );
}
