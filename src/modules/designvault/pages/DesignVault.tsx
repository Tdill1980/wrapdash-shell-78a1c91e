import { useState } from "react";
import { useDesignVault } from "../hooks/useDesignVault";
import { DesignCard } from "../components/DesignCard";
import { DesignDetailModal } from "../components/DesignDetailModal";
import { FilterSidebar } from "../components/FilterSidebar";
import type { DesignVisualization } from "../hooks/useDesignVault";
import { Loader2 } from "lucide-react";

export default function DesignVault() {
  const [selectedDesign, setSelectedDesign] =
    useState<DesignVisualization | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const { data: designs, isLoading } = useDesignVault(filters);

  const handleCardClick = (design: DesignVisualization) => {
    setSelectedDesign(design);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground relative inline-block">
            DesignVault™
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"></span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Premium 3D Mockup Library — Wrap Visualizations & Production-Ready Designs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1">
          <FilterSidebar onFilterChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : designs && designs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onClick={() => handleCardClick(design)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No designs found.</p>
              <p className="text-xs mt-1">Create some renders in DesignPro AI to get started!</p>
            </div>
          )}
        </div>
      </div>

      <DesignDetailModal
        design={selectedDesign}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
