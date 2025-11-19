import { useParams } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";
import { useIsMobile } from "@/hooks/use-mobile";

import { VehicleInfoCard } from "@/modules/shopflow/components/VehicleInfoCard";
import { CustomerInfoCard } from "@/modules/shopflow/components/CustomerInfoCard";
import { JobDetailsCard } from "@/modules/shopflow/components/JobDetailsCard";
import { NotesCard } from "@/modules/shopflow/components/NotesCard";
import { ProofViewer } from "@/modules/shopflow/components/ProofViewer";
import { Timeline } from "@/modules/shopflow/components/Timeline";
import { ActionSidebar } from "@/modules/shopflow/components/ActionSidebar";
import { FilesCard } from "@/modules/shopflow/components/FilesCard";
import { ShopFlowHeader } from "@/components/ShopFlowHeader";
import { InternalProductionTracker } from "@/components/InternalProductionTracker";

import {
  getProductionStage,
  getProductionStageDescription,
  buildProductionTimeline,
  detectMissing
} from "@/modules/shopflow/utils/stageEngine";

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
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading internal job…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Job not found.
      </div>
    );
  }

  // Internal production logic
  const internalStage = getProductionStage(order.status);
  const stageDescription = getProductionStageDescription(internalStage);
  const artworkFiles = extractFiles(order);
  const missing = detectMissing({ ...order, files: artworkFiles });
  const timeline = buildProductionTimeline(order);

  return (
    <div className={`container mx-auto text-white ${isMobile ? 'px-4 py-6' : 'px-6 py-10'}`}>

      {/* ShopFlow™ Header */}
      <ShopFlowHeader
        orderNumber={order.woo_order_number ?? order.order_number}
        productName={order.product_type}
        customerName={order.customer_name}
        vehicle={order.vehicle_info}
      />

      {/* Internal Production Tracker */}
      <InternalProductionTracker internalStatus={internalStage} />

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
  );
}
