import { ShopFlowOrder } from '@/hooks/useShopFlow';

interface ActionSidebarProps {
  order: ShopFlowOrder;
}

export const ActionSidebar = ({ order }: ActionSidebarProps) => (
  <div className="bg-[#101016] border border-white/5 rounded-lg p-4 flex flex-col gap-4">
    <select className="bg-black/20 text-gray-200 border border-white/10 rounded-lg p-2 text-sm">
      <option>Update Status</option>
      <option>Awaiting Files</option>
      <option>In Design</option>
      <option>Awaiting Approval</option>
      <option>Ready to Print</option>
      <option>Shipped</option>
    </select>

    <button className="w-full py-2 rounded-lg bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white text-sm">
      Send Update to Customer
    </button>

    <button className="w-full py-2 rounded-lg bg-[#16161E] text-white text-sm border border-white/10">
      Upload File
    </button>

    <button className="w-full py-2 rounded-lg bg-[#16161E] text-white text-sm border border-white/10">
      Add Note
    </button>

    {order.approveflow_project_id && (
      <a
        href={`/approveflow/${order.approveflow_project_id}`}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white text-sm text-center"
      >
        Open ApproveFlow
      </a>
    )}
  </div>
);
