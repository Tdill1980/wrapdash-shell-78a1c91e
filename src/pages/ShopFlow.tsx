import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LayoutGrid, Table as TableIcon, Search } from "lucide-react";
import { useShopFlowList } from "@/modules/shopflow/hooks/useShopFlowList";
import { ShopFlowKanban } from "@/modules/shopflow/components/ShopFlowKanban";
import { ShopFlowTable } from "@/modules/shopflow/components/ShopFlowTable";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ShopFlow() {
  const { jobs, loading } = useShopFlowList();
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const isMobile = useIsMobile();

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.customer_name.toLowerCase().includes(query) ||
          job.order_number.toLowerCase().includes(query) ||
          job.product_type.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((job) => job.status === filterStatus);
    }

    return filtered;
  }, [jobs, searchQuery, filterStatus]);

  const filterOptions = [
    { value: "all", label: "All Jobs" },
    { value: "processing", label: "New" },
    { value: "in-design", label: "In Progress" },
    { value: "missing-file", label: "Waiting" },
    { value: "print-production", label: "Print Ready" },
    { value: "shipped", label: "Delivered" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8FD3FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] bg-clip-text text-transparent">
          ShopFlow — Production & Job Tracker
        </h1>
        <p className="text-[#B8B8C7] mt-1">Manage and track all production jobs</p>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filterStatus === option.value ? "default" : "outline"}
              className={
                filterStatus === option.value
                  ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white border-0"
                  : "border-white/10 text-[#B8B8C7] hover:bg-white/5"
              }
              onClick={() => setFilterStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8B8C7]" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#16161E] border-white/10 text-white placeholder:text-[#B8B8C7]"
            />
          </div>

          {!isMobile && (
            <div className="flex gap-1 bg-[#16161E] border border-white/10 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                className={
                  viewMode === "kanban"
                    ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white"
                    : "text-[#B8B8C7] hover:bg-white/5"
                }
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                className={
                  viewMode === "table"
                    ? "bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white"
                    : "text-[#B8B8C7] hover:bg-white/5"
                }
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-[#B8B8C7]">
          No jobs found
        </div>
      ) : (
        <>
          {viewMode === "kanban" || isMobile ? (
            <ShopFlowKanban jobs={filteredJobs} />
          ) : (
            <ShopFlowTable jobs={filteredJobs} />
          )}
        </>
      )}
    </div>
  );
}
