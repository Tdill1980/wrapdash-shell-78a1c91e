import { ShopFlowJob } from "../hooks/useShopFlowList";
import { ShopFlowCard } from "./ShopFlowCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShopFlowKanbanProps {
  jobs: ShopFlowJob[];
}

const lanes = [
  { id: "processing", title: "New" },
  { id: "missing-file", title: "Awaiting Files" },
  { id: "in-design", title: "In Design" },
  { id: "design-complete", title: "Awaiting Approval" },
  { id: "print-production", title: "Ready to Print" },
  { id: "shipped", title: "Shipped / Completed" },
];

export function ShopFlowKanban({ jobs }: ShopFlowKanbanProps) {
  const jobsByStatus = jobs.reduce((acc, job) => {
    const status = job.status || "processing";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(job);
    return acc;
  }, {} as Record<string, ShopFlowJob[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {lanes.map((lane) => {
        const laneJobs = jobsByStatus[lane.id] || [];
        return (
          <div
            key={lane.id}
            className="flex-shrink-0 w-80 bg-[#16161E] rounded-lg border border-white/[0.06] p-4"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                {lane.title}
              </h3>
              <span className="text-xs font-semibold text-white bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {laneJobs.length}
              </span>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-2">
                {laneJobs.map((job) => (
                  <ShopFlowCard key={job.id} job={job} />
                ))}
                {laneJobs.length === 0 && (
                  <div className="text-center py-12 px-4 text-[#B8B8C7] text-sm border border-dashed border-white/10 rounded-lg bg-white/[0.02]">
                    No jobs
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
