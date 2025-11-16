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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-teal bg-clip-text text-transparent">
          DesignVault
        </h1>
        <p className="text-muted-foreground mt-2">
          Your complete library of wrap visualizations and designs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterSidebar onFilterChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : designs && designs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              No designs found. Create some renders in WrapCloser to get
              started!
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
