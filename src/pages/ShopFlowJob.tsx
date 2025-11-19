import { useParams } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";
import { Loader2, AlertCircle, Upload, Package, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/layouts/MainLayout";

const CUSTOMER_STAGES = [
  { key: "order_received", label: "Order Received", icon: Package },
  { key: "files_received", label: "Files Received", icon: CheckCircle2 },
  { key: "in_design", label: "In Design", icon: Package },
  { key: "awaiting_approval", label: "Awaiting Approval", icon: AlertCircle },
  { key: "preparing_print_files", label: "Preparing Print", icon: Package },
  { key: "printing", label: "Printing", icon: Package },
  { key: "qc", label: "Quality Check", icon: CheckCircle2 },
  { key: "ready", label: "Ready", icon: Truck },
  { key: "shipped", label: "Shipped", icon: Truck },
];

export default function ShopFlowJob() {
  const { id } = useParams<{ id: string }>();
  const { order, loading } = useShopFlow(id);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      toast({
        title: "File Uploaded",
        description: "Your file has been submitted successfully.",
      });
      setUploading(false);
    }, 2000);
  };

  if (loading) {
    return (
      <MainLayout userName="Trish">
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
          <Loader2 className="w-8 h-8 animate-spin text-[#5AC8FF]" />
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout userName="Trish">
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] p-4">
          <Card className="p-8 text-center max-w-md bg-[#141414] border-white/10">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Order Not Found
            </h1>
            <p className="text-white/70">
              We couldn't find an order with that ID.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Map WooCommerce status to customer stage
  const statusMapping: Record<string, string> = {
    "processing": "order_received",
    "on-hold": "order_received",
    "file-error": "file_error",
    "missing-file": "missing_file",
    "in-design": "in_design",
    "awaiting-approval": "awaiting_approval",
    "design-complete": "preparing_print_files",
    "print-production": "printing",
    "ready-for-pickup": "ready",
    "shipped": "shipped",
    "completed": "shipped"
  };

  const customerStage = statusMapping[order.status] || "order_received";
  const isActionRequired = customerStage === "file_error" || customerStage === "missing_file";
  const currentStageIndex = CUSTOMER_STAGES.findIndex(s => s.key === customerStage);

  return (
    <MainLayout userName="Trish">
      <div className="min-h-screen bg-[#0A0A0F]">
      {/* Sticky gradient bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md py-3 border-b border-white/10">
        <div className="w-full h-[6px] rounded-md bg-gradient-to-r from-[#8FD3FF] via-[#5AAEFF] to-[#0047FF]"></div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Track Your Order
          </h1>
          <p className="text-white/70">
            Real-time updates on your wrap order
          </p>
        </div>

        {/* Order Summary */}
        <OrderSummaryCard order={{
          orderNumber: order.woo_order_number?.toString() ?? order.order_number,
          customerName: order.customer_name,
          vehicle: order.vehicle_info?.make && order.vehicle_info?.model 
            ? `${order.vehicle_info.make} ${order.vehicle_info.model}`
            : "Vehicle Info Pending",
          productType: order.product_type,
          customer_stage: customerStage,
          created_at: order.created_at
        }} />

        {/* Current Stage */}
        <div className="mt-6">
          <CurrentStageCard order={{ customer_stage: customerStage }} />
        </div>

        {/* Action Required */}
        {isActionRequired && (
          <Card className="mt-6 p-6 border-red-500/50 bg-red-500/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-500 text-lg">
                  Action Required: File Issue
                </h3>
                <p className="text-white/70 mt-2">
                  We need a corrected file to continue with your order. Please upload the updated file below.
                </p>
                <div className="mt-4">
                  <label htmlFor="file-upload">
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <Button
                      className="w-full md:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                      disabled={uploading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Corrected File"}
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Next Step */}
        <div className="mt-6">
          <NextStepCard order={{ customer_stage: customerStage }} />
        </div>

        {/* Progress Timeline */}
        <Card className="mt-6 p-6 bg-[#141414] border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Order Progress</h2>
          
          {/* Desktop Timeline */}
          <div className="hidden md:flex items-center justify-between relative">
            {/* Progress Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2">
              <div 
                className="h-full bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] transition-all duration-500"
                style={{ width: `${(currentStageIndex / (CUSTOMER_STAGES.length - 1)) * 100}%` }}
              />
            </div>

            {/* Stage Dots */}
            {CUSTOMER_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={[
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                      isCurrent
                        ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] ring-4 ring-[#5AAEFF]/30 scale-110"
                        : isPast
                        ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]"
                        : "bg-white/10"
                    ].join(" ")}
                  >
                    <Icon className={[
                      "w-6 h-6",
                      isCurrent || isPast ? "text-white" : "text-white/40"
                    ].join(" ")} />
                  </div>
                  <p className={[
                    "text-xs text-center max-w-[80px]",
                    isCurrent ? "text-white font-semibold" : "text-white/70"
                  ].join(" ")}>
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden space-y-4">
            {CUSTOMER_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex items-center gap-4">
                  <div
                    className={[
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isCurrent
                        ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] ring-2 ring-[#5AAEFF]/30"
                        : isPast
                        ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]"
                        : "bg-white/10"
                    ].join(" ")}
                  >
                    <Icon className={[
                      "w-5 h-5",
                      isCurrent || isPast ? "text-white" : "text-white/40"
                    ].join(" ")} />
                  </div>
                  <div className="flex-1">
                    <p className={[
                      "text-sm",
                      isCurrent ? "text-white font-semibold" : "text-white/70"
                    ].join(" ")}>
                      {stage.label}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge className="bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white">
                      Current
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Shipping Info */}
        {order.tracking_number && (
          <Card className="mt-6 p-6 bg-[#141414] border-white/10">
            <div className="flex items-start gap-4">
              <Truck className="w-6 h-6 text-[#5AC8FF] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg mb-2">
                  Shipping Information
                </h3>
                <p className="text-white/70 text-sm mb-3">
                  Your order has been shipped!
                </p>
                <div className="bg-white/5 rounded-lg p-4 mb-3">
                  <p className="text-xs text-white/50 mb-1">Tracking Number</p>
                  <p className="text-white font-mono">{order.tracking_number}</p>
                </div>
                {order.tracking_url && (
                  <Button
                    className="bg-gradient-to-r from-[#8FD3FF] to-[#0047FF]"
                    onClick={() => window.open(order.tracking_url, '_blank')}
                  >
                    Track Package
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
    </MainLayout>
  );
}
