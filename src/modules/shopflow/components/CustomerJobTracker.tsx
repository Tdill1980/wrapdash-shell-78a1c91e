import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopFlowOrder } from "@/hooks/useShopFlow";
import { wooToInternalStatus, internalToCustomerStatus, InternalStatus } from "@/lib/status-mapping";
import { Package, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerJobTrackerProps {
  order: ShopFlowOrder;
}

const progressSteps: InternalStatus[] = [
  "order_received",
  "in_design",
  "action_required",
  "awaiting_approval",
  "preparing_for_print",
  "in_production",
  "ready_or_shipped",
  "completed",
];

export function CustomerJobTracker({ order }: CustomerJobTrackerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const internalStatus = wooToInternalStatus[order.status] || "order_received";
  const currentStepIndex = progressSteps.indexOf(internalStatus);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Simulate file upload
    setTimeout(() => {
      toast({
        title: "File Uploaded",
        description: "Your corrected file has been submitted successfully.",
      });
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
              {order.product_type}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Order #{order.woo_order_number ?? order.order_number}
            </p>
            <div className="mt-2 md:mt-3">
              <span
                className={`inline-flex px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold ${
                  internalStatus === "action_required"
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                } text-white`}
              >
                {internalToCustomerStatus[internalStatus]}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Required Alert */}
      {internalStatus === "action_required" && (
        <Card className="p-4 md:p-6 border-red-500/50 bg-red-500/5">
          <div className="flex items-start gap-3 md:gap-4">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-500 text-base md:text-lg">
                Action Required: File Issue
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                We need a corrected file to continue with your order. Please
                upload the updated file below.
              </p>
              <div className="mt-4">
                <label htmlFor="file-upload">
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button
                    className="w-full md:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    disabled={uploading}
                    onClick={() => document.getElementById("file-upload")?.click()}
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

      {/* Progress Timeline */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6">
          Order Progress
        </h2>
        {isMobile ? (
          /* Mobile: Vertical timeline */
          <div className="space-y-4">
            {progressSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                      isCompleted
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent"
                        : isCurrent
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent animate-pulse"
                        : "bg-background border-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span
                        className={`text-xs font-bold ${
                          isCurrent ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p
                      className={`text-sm ${
                        isCurrent
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {internalToCustomerStatus[step]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: Horizontal timeline */
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-5 left-0 w-full h-1 bg-muted">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${(currentStepIndex / (progressSteps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {progressSteps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent"
                          : isCurrent
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent animate-pulse"
                          : "bg-background border-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-bold ${
                            isCurrent ? "text-white" : "text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center max-w-[100px] ${
                        isCurrent
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {internalToCustomerStatus[step]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Tracking Info */}
      {order.tracking_number && (
        <Card className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">
            Shipping Information
          </h2>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-sm text-muted-foreground">Tracking Number:</span>
              <span className="font-mono text-sm text-foreground break-all">
                {order.tracking_number}
              </span>
            </div>
            {order.tracking_url && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.open(order.tracking_url, "_blank")}
              >
                Track Shipment
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
