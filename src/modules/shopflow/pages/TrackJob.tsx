import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomerJobTracker } from "../components/CustomerJobTracker";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TrackJob() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<ShopFlowOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const fetchOrder = async () => {
    if (!orderNumber) {
      setError("No order number provided");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shopflow_orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (error) throw error;

      if (!data) {
        setError("Order not found");
      } else {
        setOrder(data);
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Order Not Found
          </h1>
          <p className="text-muted-foreground">
            {error || "We couldn't find an order with that number."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-8 px-4 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold font-poppins">
            <span className="text-foreground">Track Your</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {" "}
              Order
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on your order status
          </p>
        </div>
        <CustomerJobTracker order={order} />
      </div>
    </div>
  );
}
