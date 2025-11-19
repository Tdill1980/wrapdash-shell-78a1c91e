// 🔵 ACTIVE STAGE HEADER (Style A — bold premium block)

import React from "react";

const STAGE_COLORS: any = {
  order_received: "from-[#8FD3FF] to-[#4EA8FF]",
  files_received: "from-[#4EA8FF] to-[#2979FF]",
  file_error: "from-red-500 to-red-700",
  missing_file: "from-red-500 to-red-700",
  in_design: "from-purple-400 to-purple-600",
  awaiting_approval: "from-yellow-400 to-yellow-600",
  design_complete: "from-green-400 to-green-600",
  print_production: "from-blue-400 to-blue-700",
  ready_for_pickup: "from-emerald-400 to-emerald-600",
  shipped: "from-indigo-400 to-indigo-700",
  refunded: "from-slate-400 to-slate-600",
  failed: "from-red-600 to-red-800",
};

export const ActiveStageHeader = ({ stage, customerLabel, description, updatedAt }: any) => {
  const gradient = STAGE_COLORS[stage] || "from-[#8FD3FF] to-[#0047FF]";

  return (
    <div className="mb-10 p-7 rounded-xl border border-white/10 bg-[#0D0D12] shadow-xl">
      <div className={`text-white text-2xl font-bold mb-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {customerLabel || "In Progress"}
      </div>

      <p className="text-gray-400 text-sm max-w-2xl">{description}</p>

      <p className="text-gray-600 text-xs mt-3">
        Last updated: {updatedAt?.slice(0, 10)}
      </p>
    </div>
  );
};
