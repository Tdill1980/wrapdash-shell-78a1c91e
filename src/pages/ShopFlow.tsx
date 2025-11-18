import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useShopFlow } from "@/hooks/useShopFlow";
import { ShopFlowKanban, ShopFlowTable } from "@/modules/shopflow";
import { LayoutGrid, Table, RefreshCw, Loader2 } from "lucide-react";

type ViewMode = "kanban" | "table";

export default function ShopFlow() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const { orders, loading, syncFromWooCommerce } = useShopFlow();

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-poppins">
            <span className="text-foreground">Shop</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-poppins">
            <span className="text-foreground">Shop</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
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

      <div className="flex gap-2">
        <Button
          variant={viewMode === "kanban" ? "default" : "outline"}
          onClick={() => setViewMode("kanban")}
          className={
            viewMode === "kanban"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : ""
          }
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Kanban View
        </Button>
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          onClick={() => setViewMode("table")}
          className={
            viewMode === "table"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : ""
          }
        >
          <Table className="w-4 h-4 mr-2" />
          Table View
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-lg mx-auto space-y-5">
            <h2 className="text-xl font-semibold">No Orders Yet</h2>
            <p className="text-muted-foreground">
              Orders will appear here once they're synced from WooCommerce.
            </p>
          </div>
        </Card>
      ) : viewMode === "kanban" ? (
        <ShopFlowKanban orders={orders} />
      ) : (
        <ShopFlowTable orders={orders} />
      )}
    </div>
  );
}
