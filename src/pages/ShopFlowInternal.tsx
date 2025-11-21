import { useParams, Link } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWooCommerceData } from "@/hooks/useWooCommerceData";
import { Package, Car, User, Activity, ArrowRight, CheckCircle, Palette, AlertCircle, FileText, Printer, Truck, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShopFlowBrandHeader } from "@/components/ShopFlowBrandHeader";
import { UploadedFilesCard } from "@/modules/shopflow/components/UploadedFilesCard";
import { OrderInfoCard } from "@/components/tracker/OrderInfoCard";
import { CurrentStageCard } from "@/modules/shopflow/components/CurrentStageCard";
import { NextStepCard } from "@/modules/shopflow/components/NextStepCard";
import { OrderSummaryCard } from "@/components/tracker/OrderSummaryCard";
import { TimelineCard } from "@/components/tracker/TimelineCard";
import { VehicleInfoCard } from "@/modules/shopflow/components/VehicleInfoCard";
import { CustomerInfoCard } from "@/modules/shopflow/components/CustomerInfoCard";
import { JobDetailsCard } from "@/modules/shopflow/components/JobDetailsCard";
import { NotesCard } from "@/modules/shopflow/components/NotesCard";
import { ProofViewer } from "@/modules/shopflow/components/ProofViewer";
import { Timeline } from "@/modules/shopflow/components/Timeline";
import { ActionSidebar } from "@/modules/shopflow/components/ActionSidebar";
import { FilesCard } from "@/modules/shopflow/components/FilesCard";
import { WooCommerceStatusBar } from "@/components/shopflow/WooCommerceStatusBar";
import { ManualSyncButton } from "@/modules/shopflow/components/ManualSyncButton";
import { MainLayout } from "@/layouts/MainLayout";

import {
  getProductionStage,
  getProductionStageDescription,
  buildProductionTimeline,
  detectMissing
} from "@/modules/shopflow/utils/stageEngine";
import { wooToInternalStatus } from "@/lib/status-mapping";

// Extract WooCommerce files
function extractFiles(order: any) {
  const files: any[] = [];
  if (!order.line_items) return files;

  order.line_items.forEach((item: any) => {
    item.meta_data?.forEach((meta: any) => {
      if (
        typeof meta.key === "string" &&
        meta.key.toLowerCase().includes("upload files") &&
        typeof meta.value === "string"
      ) {
        files.push({
          name: meta.value.split("/").pop(),
          url: meta.value
        });
      }
    });
  });

  return files;
}

export default function ShopFlowInternal() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, refetch, logs } = useShopFlow(id);
  
  // Fetch WooCommerce data for comparison
  const { wooData } = useWooCommerceData(order?.order_number || "");
  
  // Helper to check if field differs from WooCommerce
  const isDifferent = (field: string, localValue: any) => {
    if (!wooData) return false;
    
    switch (field) {
      case 'customer_name':
        const wooName = `${wooData.billing.first_name} ${wooData.billing.last_name}`.trim();
        return localValue !== wooName;
      case 'customer_email':
        return localValue !== wooData.billing.email;
      case 'product_type':
        return wooData.line_items[0] && localValue !== wooData.line_items[0].name;
      case 'status':
        return localValue !== wooData.status;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <MainLayout userName="Trish">
        <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
          Loading internal job…
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout userName="Trish">
        <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
          Job not found.
        </div>
      </MainLayout>
    );
  }

  // Internal production logic
  const internalStage = getProductionStage(order.status);
  const internalStatus = wooToInternalStatus[order.status] || "order_received";
  const stageDescription = getProductionStageDescription(internalStage);
  const artworkFiles = extractFiles(order);
  const missing = detectMissing({ ...order, files: artworkFiles });
  const files = (order.files as any[]) || [];
  const missingFiles = ((order as any).missing_file_list as any) || [];
  const fileErrors = ((order as any).file_error_details as any) || [];
  const sharedTimeline = [
    { label: "Order Received", timestamp: order.created_at, completed: true },
    { label: "Files Received", timestamp: "", completed: internalStatus !== "order_received" },
    { label: "Awaiting Approval", timestamp: "", completed: ["preparing_for_print", "in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Print Production", timestamp: "", completed: ["in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Ready/Shipped", timestamp: order.shipped_at || "", completed: ["ready_or_shipped", "completed"].includes(internalStatus) },
  ];

  // Map internal status to customer stage for display
  const customerStage = internalStatus;

  return (
    <MainLayout userName="Trish">
      {/* ShopFlow Header */}
      <ShopFlowBrandHeader />
      
      {/* Internal View Badge & Sync Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs sm:text-sm">
            Internal Staff View
          </Badge>
          {order.approveflow_project_id && (
            <Link 
              to={`/approveflow/${order.approveflow_project_id}`}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#2F81F7] to-[#15D1FF] text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View in </span>ApproveFlow
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
        <ManualSyncButton
          orderNumber={order.order_number} 
          onSyncComplete={refetch}
        />
      </div>
      
      {/* WooCommerce Status Progress Bar - Internal View */}
      <WooCommerceStatusBar currentStatus={order.status} />

      {/* Main content area - Internal Staff View */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column - Order & Status Details */}
        <div className="space-y-6">
          <div className={isDifferent('customer_name', order.customer_name) || isDifferent('customer_email', order.customer_email) ? 'ring-2 ring-yellow-500/50 rounded-lg' : ''}>
            <OrderInfoCard order={{ ...order, created_at: order.created_at, files: order.files } as any} />
            {(isDifferent('customer_name', order.customer_name) || isDifferent('customer_email', order.customer_email)) && (
              <div className="px-4 pb-4">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                  Modified from WooCommerce
                </Badge>
              </div>
            )}
          </div>
          
          {/* Raw WooCommerce Status - Internal Only */}
          <div className={isDifferent('status', order.status) ? 'ring-2 ring-yellow-500/50 rounded-lg' : ''}>
            <CurrentStageCard status={order.status} />
            {isDifferent('status', order.status) && (
              <div className="px-4 pb-4">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                  Status differs from WooCommerce
                </Badge>
              </div>
            )}
          </div>
          
          {/* Internal Next Steps - Based on Raw Status */}
          <NextStepCard currentStatus={order.status} />
          
          <VehicleInfoCard order={order} />
          <CustomerInfoCard order={order} />
        </div>

        {/* Middle Column - Files, Timeline & Actions */}
        <div className="space-y-6">
          <Card className="p-4 bg-orange-500/5 border-orange-500/20">
            <h3 className="text-sm font-semibold text-orange-500 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Internal Staff Actions
            </h3>
            <ActionSidebar order={order} />
          </Card>
          
          <FilesCard
            files={files}
            missingFiles={missingFiles}
            fileErrors={fileErrors}
          />
          
          <Timeline logs={logs} />
        </div>

        {/* Right Column - Job Details & Proofs */}
        <div className="space-y-6">
          <JobDetailsCard order={order} />
          
          <OrderSummaryCard order={order} />
          
          {order.approveflow_project_id && (
            <ProofViewer order={order} />
          )}
          
          <NotesCard orderId={order.id} />
        </div>
      </div>
    </MainLayout>
  );
}

