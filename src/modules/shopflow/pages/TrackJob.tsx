import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { Loader2, Package, Upload, Truck, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { wooToInternalStatus, internalToCustomerStatus } from "@/lib/status-mapping";
import { ShopFlowHeader } from "@/components/ShopFlowHeader";
import { CustomerProgressBar } from "@/components/CustomerProgressBar";

export default function TrackJob() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<ShopFlowOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-${orderNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopflow_orders',
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder(payload.new as ShopFlowOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        .maybeSingle();

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] p-4">
        <Card className="p-8 text-center max-w-md bg-[#111118] border-white/5">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Order Not Found
          </h1>
          <p className="text-[#B7B7C5]">
            {error || "We couldn't find an order with that number."}
          </p>
        </Card>
      </div>
    );
  }

  const internalStatus = wooToInternalStatus[order.status] || "order_received";
  const customerStatus = internalToCustomerStatus[internalStatus];
  const isActionRequired = internalStatus === "action_required";
  
  const vehicleInfo = order.vehicle_info as any;
  const vehicleDisplay = vehicleInfo 
    ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
    : 'No vehicle information';

  // Define progress stages for customer view
  const progressStages = [
    { key: "order_received", label: "Order Received" },
    { key: "in_design", label: "In Design" },
    { key: "awaiting_approval", label: "Awaiting Approval" },
    { key: "preparing_for_print", label: "Print Production" },
    { key: "in_production", label: "In Production" },
    { key: "ready_or_shipped", label: "Shipped" },
    { key: "completed", label: "Completed" },
  ];

  const currentStageIndex = progressStages.findIndex(s => s.key === internalStatus);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* ShopFlow™ Gradient Header */}
        <ShopFlowHeader
          orderNumber={order.woo_order_number ?? order.order_number}
          productName={order.product_type}
          customerName={order.customer_name}
          vehicle={vehicleDisplay}
        />

        {/* Customer Progress Bar */}
        <CustomerProgressBar currentStatus={internalStatus} />

        {/* Current Stage Card */}
        <Card className="p-6 mb-6 bg-[#111317] border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2F81F7] to-[#15D1FF] flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                {customerStatus}
              </h2>
              <p className="text-[#B7B7C5] text-sm">
                Order received and logged into our production system.
              </p>
            </div>
          </div>
        </Card>

        {/* What's Next Card */}
        <Card className="p-6 mb-6 bg-[#111317] border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#1a1a1f] flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6 text-[#2F81F7]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                What's Next
              </h3>
              <p className="text-[#B7B7C5] text-sm">
                Files will be received and logged.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Required Warning */}
        {isActionRequired && (
          <Card className="p-6 mb-6 bg-[#111317] border border-orange-500/20">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Action Required
                </h3>
                <p className="text-[#B7B7C5] mb-4">
                  We need a corrected file to continue with your order. Please upload a new file below.
                </p>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Corrected File
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Progress Timeline */}
        <Card className="p-6 md:p-8 mb-6 bg-[#111317] border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Order Progress</h3>
          
          {/* Horizontal Progress Bar */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10">
              <div 
                className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] transition-all duration-500"
                style={{ width: `${(currentStageIndex / (progressStages.length - 1)) * 100}%` }}
              />
            </div>

            {/* Progress Stages */}
            <div className="relative flex justify-between">
              {progressStages.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isUpcoming = index > currentStageIndex;

                return (
                  <div key={stage.key} className="flex flex-col items-center" style={{ width: `${100 / progressStages.length}%` }}>
                    {/* Dot */}
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${
                        isCompleted
                          ? "bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] border-[#8B5CF6]"
                          : isCurrent
                          ? "bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] border-[#8B5CF6] ring-4 ring-[#8B5CF6]/20"
                          : "bg-[#111118] border-white/20"
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-5 h-5 text-white" />}
                      {isCurrent && <div className="w-3 h-3 bg-white rounded-full animate-pulse" />}
                    </div>
                    
                    {/* Label */}
                    <p
                      className={`mt-3 text-xs text-center font-medium ${
                        isCurrent ? "text-white" : isCompleted ? "text-[#B7B7C5]" : "text-[#B7B7C5]/50"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Shipping & Tracking */}
        {order.tracking_number && (
          <Card className="p-6 bg-[#111317] border border-white/10">
            <div className="flex items-start gap-4">
              <Truck className="w-6 h-6 text-[#8B5CF6] flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Shipping Information
                </h3>
                <p className="text-[#B7B7C5] mb-3">
                  Your order has been shipped!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div>
                    <p className="text-sm text-[#B7B7C5]">Tracking Number</p>
                    <p className="font-mono font-bold text-white">{order.tracking_number}</p>
                  </div>
                  {order.tracking_url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(order.tracking_url!, '_blank')}
                      className="bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] hover:opacity-90 border-0"
                    >
                      Track Package
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
