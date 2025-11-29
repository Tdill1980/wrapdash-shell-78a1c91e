import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDesignVault } from "../hooks/useDesignVault";
import { DesignCard } from "../components/DesignCard";
import { DesignDetailModal } from "../components/DesignDetailModal";
import { FilterSidebar } from "../components/FilterSidebar";
import type { DesignVisualization } from "../hooks/useDesignVault";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/layouts/MainLayout";

export default function DesignVault() {
  const navigate = useNavigate();
  const [selectedDesign, setSelectedDesign] =
    useState<DesignVisualization | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const { data: designs, isLoading, refetch } = useDesignVault(filters);

  const handleCardClick = (design: DesignVisualization) => {
    setSelectedDesign(design);
    setModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-5 w-full">
      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight relative inline-block font-poppins">
            <span className="text-foreground">Design</span>
            <span className="bg-gradient-to-r from-[#E1306C] via-[#833AB4] to-[#405DE6] bg-clip-text text-transparent">Vault</span>
            <span className="text-muted-foreground text-lg align-super">™</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Premium 3D Mockup Library — Wrap Visualizations & Production-Ready Designs
          </p>
        </div>
        <Button onClick={() => navigate('/designvault/upload')}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Design
        </Button>
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
                onDelete={() => refetch()}
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
    </MainLayout>
  );
}
