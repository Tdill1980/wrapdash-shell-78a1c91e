import { useParams } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";

import { VehicleInfoCard } from "@/modules/shopflow/components/VehicleInfoCard";
import { CustomerInfoCard } from "@/modules/shopflow/components/CustomerInfoCard";
import { JobDetailsCard } from "@/modules/shopflow/components/JobDetailsCard";
import { NotesCard } from "@/modules/shopflow/components/NotesCard";
import { ProofViewer } from "@/modules/shopflow/components/ProofViewer";
import { Timeline } from "@/modules/shopflow/components/Timeline";
import { ActionSidebar } from "@/modules/shopflow/components/ActionSidebar";
import { FilesCard } from "@/modules/shopflow/components/FilesCard";
import { NextStepCard } from "@/modules/shopflow/components/NextStepCard";
import { ActiveStageHeader } from "@/modules/shopflow/components/ActiveStageHeader";

import {
  getStageFromWoo,
  getCustomerStageLabel,
  getCustomerStageDescription,
  detectMissing,
  buildCustomerTimeline
} from "@/modules/shopflow/utils/stageEngine";

// Extract WooCommerce customer-uploaded files
function extractWooFiles(order: any) {
  const files: any[] = [];

  if (!order.line_items) return files;

  order.line_items.forEach((item: any) => {
    if (!item.meta_data) return;

    item.meta_data.forEach((meta: any) => {
      if (
        typeof meta.key === "string" &&
        meta.key.toLowerCase().includes("upload files")
      ) {
        if (typeof meta.value === "string") {
          files.push({
            name: meta.value.split("/").pop(),
            url: meta.value
          });
        }
      }
    });
  });

  return files;
}

export default function ShopFlowJob() {
  const { id } = useParams<{ id: string }>();
  const { order, loading } = useShopFlow(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading job...
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

  // Extract files
  const wooFiles = extractWooFiles(order);

  // Stage Engine - Customer Facing
  const internalStage = getStageFromWoo(order.status);
  const customerStage = getCustomerStageLabel(internalStage);
  const stageDescription = getCustomerStageDescription(internalStage);
  const nextStepDescription = getCustomerStageDescription(internalStage, true);
  const missing = detectMissing({ ...order, files: wooFiles });
  const timeline = buildCustomerTimeline(order);

  return (
    <div className="container mx-auto px-6 py-8">

      {/* Sticky gradient bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md py-3 border-b border-white/10">
        <div className="w-full h-[6px] rounded-md bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]"></div>
      </div>

      {/* ACTIVE STAGE HERO - Customer Facing */}
      <ActiveStageHeader
        stage={internalStage}
        customerLabel={customerStage}
        description={stageDescription}
        updatedAt={order.updated_at}
      />

      {/* NEXT STEP CARD */}
      {nextStepDescription && (
        <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-10 text-white">
          <h2 className="text-lg font-semibold mb-2">What Happens Next</h2>
          <p className="text-gray-300 text-sm">{nextStepDescription}</p>
        </div>
      )}

      {/* MISSING ITEMS */}
      {missing.length > 0 && (
        <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-10 text-white">
          <h2 className="text-lg font-semibold mb-3">Missing Items</h2>
          <ul className="list-disc pl-6 text-gray-300 text-sm">
            {missing.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <VehicleInfoCard order={order} />
          <CustomerInfoCard order={order} />
          <JobDetailsCard order={order} />
          <NotesCard orderId={order.id} />
        </div>

        {/* CENTER COLUMN — FLOW SPINE */}
        <div className="lg:col-span-2 flex flex-col gap-10 relative">

          {/* Flow spine */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#8FD3FF] to-[#0047FF] opacity-30 rounded-full"></div>

          {/* Proof Viewer */}
          <div className="relative ml-6">
            <ProofViewer order={order} />
          </div>

          {/* Files Card (with thumbnails) */}
          <div className="relative ml-6">
            <FilesCard files={wooFiles} orderId={order.id} />
          </div>

          {/* Timeline LAST */}
          <div className="relative ml-6">
            <Timeline timeline={timeline} />
          </div>
        </div>

        {/* RIGHT ACTION SIDEBAR */}
        <div className="lg:col-span-1 sticky top-[140px] h-fit">
          <ActionSidebar order={order} />
        </div>

      </div>
    </div>
  );
}

