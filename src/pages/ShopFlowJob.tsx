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
        <p className="text-gray-400">Job not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Progress Bar */}
      <div className="w-full h-[6px] rounded-md bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF] mb-6"></div>

      {/* Job Header */}
      <div className="bg-[#101016] border border-white/5 rounded-lg p-5 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {order.product_type}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Customer: {order.customer_name} • Order #{order.order_number}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-md text-xs text-white font-medium bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]">
            {order.status}
          </span>

          {order.approveflow_project_id && (
            <a
              href={`/approveflow/${order.approveflow_project_id}`}
              className="px-4 py-2 rounded-md text-sm text-white bg-gradient-to-r from-[#8FD3FF] via-[#6AB9FF] to-[#0047FF]"
            >
              Open ApproveFlow
            </a>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <VehicleInfoCard order={order} />
          <CustomerInfoCard order={order} />
          <JobDetailsCard order={order} />
          <UploadedFilesCard order={order} />
          <NotesCard orderId={order.id} />
        </div>

        {/* CENTER CONTENT */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ProofViewer order={order} />
          <Timeline order={order} />
        </div>

        {/* RIGHT SIDEBAR ACTIONS */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <ActionSidebar order={order} />
        </div>
      </div>
    </div>
  );
}
