import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { wooToInternalStatus } from "@/lib/status-mapping";
import { ShopFlowBrandHeader } from "@/components/ShopFlowBrandHeader";
import { CustomerProgressBar } from "@/components/CustomerProgressBar";
import { UploadedFilesCard } from "@/modules/shopflow/components/UploadedFilesCard";
import { OrderInfoCard } from "@/components/tracker/OrderInfoCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
import { ActionRequiredCard } from "@/components/tracker/ActionRequiredCard";
import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { TimelineCard } from "@/components/tracker/TimelineCard";

export default function TrackJob() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<ShopFlowOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
    const channel = supabase.channel(`order-${orderNumber}`).on('postgres_changes', { event: '*', schema: 'public', table: 'shopflow_orders', filter: `order_number=eq.${orderNumber}` }, (payload) => { if (payload.new) setOrder(payload.new as ShopFlowOrder); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderNumber]);

  const fetchOrder = async () => {
    if (!orderNumber) { setError("No order number provided"); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from("shopflow_orders").select("*").eq("order_number", orderNumber).maybeSingle();
      if (error) throw error;
      if (!data) { setError("Order not found"); } else { setOrder(data); }
    } catch (err: any) { console.error("Error fetching order:", err); setError(err.message || "Failed to load order"); } finally { setLoading(false); }
  };

  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
  if (error || !order) return (<div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] p-4"><Card className="p-8 text-center max-w-md bg-[#111118] border-white/5"><AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" /><h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1><p className="text-[#B7B7C5]">{error || "We couldn't find an order with that number."}</p></Card></div>);

  const internalStatus = wooToInternalStatus[order.status] || "order_received";
  const files = (order.files as any[]) || [];
  const missingFiles = ((order as any).missing_file_list as any) || [];
  const fileErrors = ((order as any).file_error_details as any) || [];
  const timeline = [
    { label: "Order Received", timestamp: order.created_at, completed: true },
    { label: "Files Received", timestamp: "", completed: internalStatus !== "order_received" },
    { label: "Preflight", timestamp: "", completed: ["awaiting_approval", "preparing_for_print", "in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Awaiting Approval", timestamp: "", completed: ["preparing_for_print", "in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Print Production", timestamp: "", completed: ["in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Ready/Shipped", timestamp: order.shipped_at || "", completed: ["ready_or_shipped", "completed"].includes(internalStatus) },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <ShopFlowBrandHeader />
        <CustomerProgressBar currentStatus={internalStatus} />
        <UploadedFilesCard files={files} missingFiles={missingFiles} fileErrors={fileErrors} orderId={order.id} />
        <OrderInfoCard order={order} />
        <CurrentStageCard order={{ customer_stage: internalStatus }} />
        <NextStepCard order={{ customer_stage: internalStatus }} />
        <ActionRequiredCard order={{ customer_stage: internalStatus, file_error_details: fileErrors, missing_file_list: missingFiles }} />
        <OrderSummaryCard order={order} />
        <TimelineCard timeline={timeline} />
        <div className="text-center py-8 text-white/40 text-sm">Powered by <span className="text-[#15D1FF]">WrapCommand™</span> — Real-time wrap order tracking for peace of mind.</div>
      </div>
    </div>
  );
}
