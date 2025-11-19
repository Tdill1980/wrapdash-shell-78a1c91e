import { useParams } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useIsMobile } from "@/hooks/use-mobile";
import { Package, Car, User, Activity, ArrowRight, CheckCircle, Palette, AlertCircle, FileText, Printer, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ShopFlowBrandHeader } from "@/components/ShopFlowBrandHeader";
import { UploadedFilesCard } from "@/modules/shopflow/components/UploadedFilesCard";
import { OrderInfoCard } from "@/components/tracker/OrderInfoCard";
import { CurrentStageCard } from "@/components/tracker/CurrentStageCard";
import { NextStepCard } from "@/components/tracker/NextStepCard";
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
import { CustomerProgressBar } from "@/components/CustomerProgressBar";
import { InternalProductionTracker } from "@/components/InternalProductionTracker";
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
  const { order, loading } = useShopFlow(id);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <MainLayout userName="Trish">
        <div className="flex items-center justify-center min-h-screen text-gray-400">
          Loading internal job…
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout userName="Trish">
        <div className="flex items-center justify-center min-h-screen text-gray-400">
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
  const timeline = buildProductionTimeline(order);
  const files = (order.files as any[]) || [];
  const missingFiles = ((order as any).missing_file_list as any) || [];
  const fileErrors = ((order as any).file_error_details as any) || [];
  const sharedTimeline = [
    { label: "Order Received", timestamp: order.created_at, completed: true },
    { label: "Files Received", timestamp: "", completed: internalStatus !== "order_received" },
    { label: "Preflight", timestamp: "", completed: ["awaiting_approval", "preparing_for_print", "in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Awaiting Approval", timestamp: "", completed: ["preparing_for_print", "in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Print Production", timestamp: "", completed: ["in_production", "ready_or_shipped", "completed"].includes(internalStatus) },
    { label: "Ready/Shipped", timestamp: order.shipped_at || "", completed: ["ready_or_shipped", "completed"].includes(internalStatus) },
  ];

  return (
    <MainLayout userName="Trish">
      <div className="min-h-screen bg-[#0A0A0F]">
      <div className="w-full px-10 py-8 space-y-10">
        <ShopFlowBrandHeader />
        <CustomerProgressBar currentStatus={internalStatus} />
        <div className="mb-6"><UploadedFilesCard files={files} missingFiles={missingFiles} fileErrors={fileErrors} internalMode={true} orderId={order.id} /></div>
        <div className="mb-6"><OrderInfoCard order={order} /></div>
        <div className="mb-6"><CurrentStageCard order={{ customer_stage: internalStatus }} /></div>
        <div className="mb-6"><NextStepCard order={{ customer_stage: internalStatus }} /></div>
        <div className="mb-6"><OrderSummaryCard order={order} /></div>
        <div className="mb-6"><TimelineCard timeline={sharedTimeline} /></div>

        {/* Current Stage Card */}
        <Card className="p-6 mb-6 bg-[#111317] border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2F81F7] to-[#15D1FF] flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                {internalStage}
              </h2>
              <p className="text-[#B7B7C5] text-sm">
                {stageDescription}
              </p>
            </div>
          </div>
        </Card>

        {/* What's Next Card */}
        <Card className="p-6 mb-6 bg-[#111317] border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#1a1a1f] flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-6 h-6 text-[#2F81F7]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                What's Next
              </h3>
              <p className="text-[#B7B7C5] text-sm">
                {missing.length > 0 
                  ? `Missing files: ${missing.join(", ")}`
                  : "Files will be received and logged."
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Order Progress Timeline */}
        <Card className="p-6 mb-6 bg-[#111317] border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Order Progress</h3>
          
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
            {[
              { label: "Order\nReceived", icon: Package, stage: "order_received" },
              { label: "Files\nReceived", icon: CheckCircle, stage: "files_received" },
              { label: "In Design", icon: Palette, stage: "in_design" },
              { label: "Awaiting\nApproval", icon: AlertCircle, stage: "awaiting_approval" },
              { label: "Preparing\nPrint", icon: FileText, stage: "preparing_for_print" },
              { label: "Printing", icon: Printer, stage: "in_production" },
              { label: "Quality\nCheck", icon: CheckCircle, stage: "ready_or_shipped" },
              { label: "Ready", icon: Package, stage: "ready_for_pickup" },
              { label: "Shipped", icon: Truck, stage: "shipped" }
            ].map((step, i) => {
              const Icon = step.icon;
              const active = i <= timeline.findIndex((t: any) => t.label === internalStage);
              
              return (
                <div key={i} className="flex flex-col items-center min-w-[80px]">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      active 
                        ? "bg-gradient-to-br from-[#2F81F7] to-[#15D1FF]" 
                        : "bg-[#1a1a1f] border border-white/10"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-white" : "text-[#B7B7C5]"}`} />
                  </div>
                  <p className={`text-xs text-center whitespace-pre-line ${
                    active ? "text-white font-medium" : "text-[#B7B7C5]"
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Internal Production Tracker */}
        <Card className="p-6 mb-6 bg-[#111317] border border-white/10">
          <InternalProductionTracker internalStatus={internalStage} />
        </Card>

        {/* Job Status Info */}
        <div className={`flex gap-4 ${isMobile ? 'flex-col mb-6' : 'mb-10'}`}>
        <div className="px-4 py-2 bg-[#111118] border border-white/10 rounded-lg text-sm">
          <span className="text-gray-400">Internal Stage:</span>{" "}
          <span className="text-white">{internalStage}</span>
        </div>
        <div className="px-4 py-2 bg-[#111118] border border-white/10 rounded-lg text-sm">
          <span className="text-gray-400">WooCommerce:</span>{" "}
          <span className="text-white">{order.status}</span>
        </div>
      </div>

      {/* FULL-WIDTH INTERNAL PRODUCTION TRACKER */}
      <div className={`bg-[#111118] border border-white/10 rounded-lg mb-14 ${isMobile ? 'py-4 px-4' : 'py-6 px-6'}`}>
        <h2 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Production Tracker</h2>
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
          {timeline.map((step: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center min-w-[120px]">
              <div
                className={[
                  "w-6 h-6 rounded-full mb-2",
                  step.active
                    ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] ring-2 ring-[#5AAEFF]"
                    : "bg-white/20 border border-white/10"
                ].join(" ")}
              />
              <p className="text-xs text-gray-300 text-center">{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FULL WIDTH CENTER SPINE LAYOUT */}
      <div className="relative">

        {/* Thick glowing SPINE - hide on mobile */}
        {!isMobile && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[5px] bg-gradient-to-b from-[#8FD3FF] to-[#0047FF] opacity-40 rounded-full"></div>
        )}

        <div className={`grid gap-10 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>

          {/* LEFT COLUMN — Info Cards */}
          <div className="flex flex-col gap-6">
            <VehicleInfoCard order={order} />
            <CustomerInfoCard order={order} />
            <JobDetailsCard order={order} />
            <NotesCard orderId={order.id} />
          </div>

          {/* CENTER COLUMN — Spine Items */}
          <div className="flex flex-col gap-12">

            {/* Proof Viewer */}
            <div className="relative px-6">
              <ProofViewer order={order} />
            </div>

            {/* Uploaded Files */}
            <div className="relative px-6">
              <FilesCard files={artworkFiles} orderId={order.id} />
            </div>

            {/* Missing Items */}
            {missing.length > 0 && (
              <div className="relative px-6 bg-[#111118] border border-white/10 rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-3">Missing Items</h2>
                <ul className="text-gray-300 text-sm list-disc pl-6">
                  {missing.map((m: string, idx: number) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline */}
            <div className="relative px-6">
              <Timeline timeline={timeline} />
            </div>
          </div>

          {/* RIGHT COLUMN — Actions */}
          <div className={isMobile ? '' : 'sticky top-[140px] h-fit'}>
            <ActionSidebar order={order} />
          </div>

        </div>
      </div>
      </div>
    </div>
    </MainLayout>
  );
}
