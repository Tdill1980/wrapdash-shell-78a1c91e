import { useParams } from "react-router-dom";
import { useShopFlow } from "@/hooks/useShopFlow";

import { VehicleInfoCard } from "@/modules/shopflow/components/VehicleInfoCard";
import { CustomerInfoCard } from "@/modules/shopflow/components/CustomerInfoCard";
import { JobDetailsCard } from "@/modules/shopflow/components/JobDetailsCard";
import { NotesCard } from "@/modules/shopflow/components/NotesCard";
import { ProofViewer } from "@/modules/shopflow/components/ProofViewer";
import { Timeline } from "@/modules/shopflow/components/Timeline";
import { ActionSidebar } from "@/modules/shopflow/components/ActionSidebar";

import {
  getStageFromWoo,
  getNextStage,
  detectMissing,
  buildTimeline
} from "@/modules/shopflow/utils/stageMap";

// Extract WooCommerce file uploads from line_items → meta_data
function extractFilesFromWoo(order: any) {
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

export default function ShopFlowInternal() {
  const { id } = useParams<{ id: string }>();
  const { order, loading } = useShopFlow(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading job...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Job not found</p>
      </div>
    );
  }

  // Extract WooCommerce artwork files
  const artworkFiles = extractFilesFromWoo(order);

  // Internal Flow Logic
  const internalStage = getStageFromWoo(order.status);
  const nextStage = getNextStage(internalStage);
  const missingItems = detectMissing({ ...order, files: artworkFiles });
  const timelineData = buildTimeline(order);

  return (
    <div className="container mx-auto px-6 py-8">

      {/* Sticky Bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md py-3 border-b border-white/10">
        <div className="w-full h-[6px] rounded-md bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]"></div>
      </div>

      {/* Sticky Job Header */}
      <div className="sticky top-[54px] z-40 bg-[#101016]/90 backdrop-blur-xl border border-white/5 rounded-lg p-5 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl text-white font-semibold">{order.product_type}</h1>
          <p className="text-sm text-gray-400">
            {order.customer_name} — Order #{order.order_number}
          </p>
        </div>

        <span className="px-3 py-1 rounded-md text-xs text-white bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]">
          {order.status}
        </span>
      </div>

      {/* Quick Summary */}
      <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-400 text-xs uppercase">Customer Email</p>
          <p className="text-white text-sm">{order.customer_email || 'N/A'}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase">Order #</p>
          <p className="text-white text-sm">{order.order_number}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase">Priority</p>
          <p className="text-white text-sm">{order.priority || 'Standard'}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase">Last Update</p>
          <p className="text-white text-sm">{order.updated_at?.slice(0, 10)}</p>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <VehicleInfoCard order={order} />
          <CustomerInfoCard order={order} />
          <JobDetailsCard order={order} />

          {/* Artwork Files Card */}
          <div className="bg-[#101016] border border-white/5 rounded-lg p-5">
            <h2 className="text-lg text-white font-semibold mb-3">Uploaded Files</h2>

            {artworkFiles.length === 0 ? (
              <p className="text-gray-500 text-sm">No files uploaded</p>
            ) : (
              <ul className="space-y-2">
                {artworkFiles.map((file, idx) => (
                  <li key={idx}>
                    <a
                      href={file.url}
                      target="_blank"
                      className="text-blue-300 underline text-sm"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <NotesCard orderId={order.id} />
        </div>

        {/* CENTER COLUMN (Flow Spine + Story) */}
        <div className="lg:col-span-2 flex flex-col gap-10 relative">

          {/* Flow Spine */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#8FD3FF] to-[#0047FF] opacity-20 rounded-full"></div>

          {/* Missing Items */}
          {missingItems.length > 0 && (
            <div className="bg-[#101016] border border-white/5 rounded-lg p-5 text-white relative ml-6">
              <h2 className="text-lg font-semibold mb-3">Missing Items</h2>
              <ul className="list-disc pl-6 text-gray-300 text-sm">
                {missingItems.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Proof Viewer */}
          <div className="relative ml-6">
            <ProofViewer order={order} />
          </div>

          {/* Timeline */}
          <div className="relative ml-6">
            <Timeline timeline={timelineData} />
          </div>

        </div>

        {/* RIGHT ACTION BAR */}
        <div className="lg:col-span-1 sticky top-[140px]">
          <ActionSidebar order={order} />
        </div>

      </div>
    </div>
  );
}
