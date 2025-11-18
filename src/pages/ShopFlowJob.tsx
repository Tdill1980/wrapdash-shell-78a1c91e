import { useParams } from 'react-router-dom';
import { useShopFlow } from '@/hooks/useShopFlow';
import { VehicleInfoCard } from '@/modules/shopflow/components/VehicleInfoCard';
import { CustomerInfoCard } from '@/modules/shopflow/components/CustomerInfoCard';
import { JobDetailsCard } from '@/modules/shopflow/components/JobDetailsCard';
import { UploadedFilesCard } from '@/modules/shopflow/components/UploadedFilesCard';
import { NotesCard } from '@/modules/shopflow/components/NotesCard';
import { ProofViewer } from '@/modules/shopflow/components/ProofViewer';
import { Timeline } from '@/modules/shopflow/components/Timeline';
import { ActionSidebar } from '@/modules/shopflow/components/ActionSidebar';
import {
  getStageFromWoo,
  getNextStage,
  detectMissing,
  buildTimeline
} from "@/modules/shopflow/utils/stageMap";

export default function ShopFlowJob() {
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
        <p className="text-gray-400">Job not found.</p>
      </div>
    );
  }

  // INTERNAL SHOPFLOW ENGINE
  const internalStage = getStageFromWoo(order.status);
  const nextStage = getNextStage(internalStage);
  const missingItems = detectMissing(order);
  const timelineData = buildTimeline(order);

  return (
    <div className="container mx-auto px-6 py-8">

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md py-3 border-b border-white/10 mb-6">
        <div className="w-full h-[6px] rounded-md bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]"></div>
      </div>

      {/* Sticky Header */}
      <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-6 sticky top-[54px] z-40 backdrop-blur-xl flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {order.product_type}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Customer: {order.customer_name} • Order #{order.order_number}
          </p>
        </div>

        <span className="px-3 py-1 rounded-md text-xs text-white font-medium bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]">
          {order.status}
        </span>
      </div>

      {/* Quick Summary */}
      <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-400 text-xs uppercase">Vehicle</p>
          <p className="text-white text-sm">
            {(order.vehicle_info as any)?.year} {(order.vehicle_info as any)?.make} {(order.vehicle_info as any)?.model}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase">Customer</p>
          <p className="text-white text-sm">{order.customer_name}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase">Order #</p>
          <p className="text-white text-sm">{order.order_number}</p>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase">Last Update</p>
          <p className="text-white text-sm">{order.updated_at?.slice(0, 10)}</p>
        </div>
      </div>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <VehicleInfoCard order={order} />
          <CustomerInfoCard order={order} />
          <JobDetailsCard order={order} />
          <UploadedFilesCard order={order} />
          <NotesCard orderId={order.id} />
        </div>

        {/* CENTER */}
        <div className="lg:col-span-2 flex flex-col gap-10 relative">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#8FD3FF] to-[#0047FF] opacity-20 rounded-full"></div>

          {/* Missing Items */}
          {missingItems.length > 0 && (
            <div className="bg-[#101016] border border-white/5 rounded-lg p-5 text-white">
              <h2 className="text-lg font-semibold mb-3">Missing Items</h2>
              <ul className="list-disc pl-5 text-gray-300 text-sm">
                {missingItems.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <ProofViewer order={order} />

          <Timeline timeline={timelineData} />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1 sticky top-[140px]">
          <ActionSidebar order={order} />
        </div>

      </div>
    </div>
  );
}
