import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";

interface ManualSyncButtonProps {
  orderNumber: string;
  onSyncComplete?: () => void;
}

export const ManualSyncButton = ({ orderNumber, onSyncComplete }: ManualSyncButtonProps) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await lovableFunctions.functions.invoke('sync-woo-manual', {
        body: { 
          order_number: orderNumber,
          sync_type: 'shopflow'
        }
      });

      if (error) throw error;

      toast({
        title: "Sync complete",
        description: `Order ${orderNumber} synced successfully from WooCommerce`,
      });

      onSyncComplete?.();
    } catch (err: any) {
      console.error("Sync error:", err);
      toast({
        title: "Sync failed",
        description: err.message || "Failed to sync order from WooCommerce",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {syncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {syncing ? "Syncing..." : "Sync from WooCommerce"}
    </Button>
  );
};
