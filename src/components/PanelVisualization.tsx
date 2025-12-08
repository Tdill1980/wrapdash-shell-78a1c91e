import { useState } from "react";
import { X, Car } from "lucide-react";
import { VehicleSQFTOptions } from "@/lib/vehicleSqft";
import { getVehicleType, VehicleType } from "@/lib/vehicleTypeDetection";
import { 
  TruckImageOverlay, 
  SedanImageOverlay, 
  SUVImageOverlay, 
  VanImageOverlay,
  TopDownViewPro 
} from "@/components/vehicle-diagrams";
import { PanelMeasurementsTable } from "@/components/vehicle-diagrams/PanelMeasurementsTable";

interface PanelVisualizationProps {
  vehicle: {
    year: string;
    make: string;
    model: string;
  };
  sqftOptions: VehicleSQFTOptions;
  selectedPanels: {
    sides: boolean;
    back: boolean;
    hood: boolean;
    roof: boolean;
  };
  onPanelClick?: (panel: 'sides' | 'back' | 'hood' | 'roof') => void;
  showAsModal?: boolean;
  onClose?: () => void;
}

export function PanelVisualization({ 
  vehicle, 
  sqftOptions, 
  selectedPanels,
  onPanelClick,
  showAsModal = false,
  onClose
}: PanelVisualizationProps) {
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  
  // Auto-detect vehicle type from make/model
  const vehicleType: VehicleType = getVehicleType(vehicle.make, vehicle.model);

  const handlePanelClick = (panel: keyof typeof selectedPanels) => {
    onPanelClick?.(panel);
  };

  const handlePanelHover = (panel: string | null) => {
    setHoveredPanel(panel);
  };

  // Get the appropriate image overlay component based on vehicle type
  const renderVehicleImage = () => {
    const props = {
      selectedPanels,
      onPanelClick: handlePanelClick,
      sqftOptions,
      hoveredPanel,
      onPanelHover: handlePanelHover
    };

    switch (vehicleType) {
      case 'suv':
        return <SUVImageOverlay {...props} />;
      case 'truck':
        return <TruckImageOverlay {...props} />;
      case 'van':
        return <VanImageOverlay {...props} />;
      default:
        return <SedanImageOverlay {...props} />;
    }
  };

  const getVehicleTypeLabel = () => {
    switch (vehicleType) {
      case 'suv': return 'SUV/Crossover';
      case 'truck': return 'Truck';
      case 'van': return 'Van/Minivan';
      default: return 'Sedan/Coupe';
    }
  };

  const totalSelected = (selectedPanels.sides ? sqftOptions.panels.sides : 0) +
    (selectedPanels.back ? sqftOptions.panels.back : 0) +
    (selectedPanels.hood ? sqftOptions.panels.hood : 0) +
    (selectedPanels.roof ? sqftOptions.panels.roof : 0);

  const content = (
    <div className={showAsModal ? "bg-card rounded-lg border border-border p-6 max-h-[90vh] overflow-y-auto" : ""}>
      {showAsModal && onClose && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Vehicle Panel Selection</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Car className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">{getVehicleTypeLabel()}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Side Profile View */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Side Profile View
          </div>
          <div className="bg-muted/20 rounded-lg p-4 border border-border">
            {renderVehicleImage()}
          </div>
          
          {/* Top-Down View */}
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
            Top-Down View
          </div>
          <div className="bg-muted/20 rounded-lg p-4 border border-border flex justify-center">
            <TopDownViewPro
              vehicleType={vehicleType}
              selectedPanels={selectedPanels}
              onPanelClick={handlePanelClick}
              sqftOptions={sqftOptions}
              hoveredPanel={hoveredPanel}
              onPanelHover={handlePanelHover}
            />
          </div>
        </div>

        {/* Panel Measurements Table */}
        <div className="space-y-4">
          <PanelMeasurementsTable
            selectedPanels={selectedPanels}
            onPanelToggle={handlePanelClick}
            sqftOptions={sqftOptions}
          />
          
          {/* Coverage Summary */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Coverage Summary
            </div>
            <div className="text-3xl font-bold text-primary">
              {totalSelected.toFixed(1)} sqft
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Total selected coverage area
            </div>
            
            <div className="mt-3 pt-3 border-t border-primary/20 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full wrap (with roof):</span>
                <span className="font-medium">{sqftOptions.withRoof.toFixed(1)} sqft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full wrap (no roof):</span>
                <span className="font-medium">{sqftOptions.withoutRoof.toFixed(1)} sqft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coverage %:</span>
                <span className="font-medium text-primary">
                  {((totalSelected / sqftOptions.withRoof) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="border border-border rounded-lg p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Panel Colors</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted/30 border border-border"></div>
                <span>Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        Click on any panel in the diagram or use the checkboxes to select coverage areas
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="max-w-5xl w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
