import { useState } from "react";
import { X } from "lucide-react";
import { VehicleSQFTOptions } from "@/lib/vehicleSqft";

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

  const getPanelColor = (panel: keyof typeof selectedPanels) => {
    const isSelected = selectedPanels[panel];
    const isHovered = hoveredPanel === panel;
    
    if (isSelected) {
      switch(panel) {
        case 'sides': return isHovered ? 'hsl(217, 91%, 65%)' : 'hsl(217, 91%, 60%)'; // Blue
        case 'hood': return isHovered ? 'hsl(142, 71%, 50%)' : 'hsl(142, 71%, 45%)'; // Green
        case 'back': return isHovered ? 'hsl(271, 91%, 70%)' : 'hsl(271, 91%, 65%)'; // Purple
        case 'roof': return isHovered ? 'hsl(25, 95%, 58%)' : 'hsl(25, 95%, 53%)'; // Orange
      }
    }
    
    return isHovered ? 'hsl(240, 6%, 25%)' : 'hsl(240, 6%, 20%)';
  };

  const content = (
    <div className={showAsModal ? "bg-card rounded-lg border border-border p-6" : ""}>
      {showAsModal && onClose && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Panel Selection Guide</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* SVG Diagram */}
        <div className="flex-1">
          <svg 
            viewBox="0 0 400 300" 
            className="w-full h-auto"
            style={{ maxWidth: '500px' }}
          >
            {/* Vehicle Outline (Top-Down View) */}
            <g>
              {/* Hood */}
              <rect 
                x="120" y="40" width="160" height="60"
                rx="8"
                fill={getPanelColor('hood')}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onPanelClick?.('hood')}
                onMouseEnter={() => setHoveredPanel('hood')}
                onMouseLeave={() => setHoveredPanel(null)}
              />
              <text 
                x="200" y="75" 
                textAnchor="middle" 
                fill="white" 
                fontSize="14"
                fontWeight="600"
                pointerEvents="none"
              >
                Hood
              </text>
              <text 
                x="200" y="92" 
                textAnchor="middle" 
                fill="white" 
                fontSize="12"
                pointerEvents="none"
              >
                {sqftOptions.panels.hood} sq ft
              </text>

              {/* Left Side */}
              <rect 
                x="40" y="110" width="60" height="120"
                rx="8"
                fill={getPanelColor('sides')}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onPanelClick?.('sides')}
                onMouseEnter={() => setHoveredPanel('sides')}
                onMouseLeave={() => setHoveredPanel(null)}
              />
              <text 
                x="70" y="165" 
                textAnchor="middle" 
                fill="white" 
                fontSize="14"
                fontWeight="600"
                pointerEvents="none"
              >
                Left
              </text>
              <text 
                x="70" y="180" 
                textAnchor="middle" 
                fill="white" 
                fontSize="11"
                pointerEvents="none"
              >
                Side
              </text>

              {/* Roof (Center) */}
              <rect 
                x="110" y="110" width="180" height="120"
                rx="8"
                fill={getPanelColor('roof')}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onPanelClick?.('roof')}
                onMouseEnter={() => setHoveredPanel('roof')}
                onMouseLeave={() => setHoveredPanel(null)}
              />
              <text 
                x="200" y="165" 
                textAnchor="middle" 
                fill="white" 
                fontSize="14"
                fontWeight="600"
                pointerEvents="none"
              >
                Roof
              </text>
              <text 
                x="200" y="182" 
                textAnchor="middle" 
                fill="white" 
                fontSize="12"
                pointerEvents="none"
              >
                {sqftOptions.panels.roof} sq ft
              </text>

              {/* Right Side */}
              <rect 
                x="300" y="110" width="60" height="120"
                rx="8"
                fill={getPanelColor('sides')}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onPanelClick?.('sides')}
                onMouseEnter={() => setHoveredPanel('sides')}
                onMouseLeave={() => setHoveredPanel(null)}
              />
              <text 
                x="330" y="165" 
                textAnchor="middle" 
                fill="white" 
                fontSize="14"
                fontWeight="600"
                pointerEvents="none"
              >
                Right
              </text>
              <text 
                x="330" y="180" 
                textAnchor="middle" 
                fill="white" 
                fontSize="11"
                pointerEvents="none"
              >
                Side
              </text>

              {/* Back */}
              <rect 
                x="120" y="240" width="160" height="50"
                rx="8"
                fill={getPanelColor('back')}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onClick={() => onPanelClick?.('back')}
                onMouseEnter={() => setHoveredPanel('back')}
                onMouseLeave={() => setHoveredPanel(null)}
              />
              <text 
                x="200" y="268" 
                textAnchor="middle" 
                fill="white" 
                fontSize="14"
                fontWeight="600"
                pointerEvents="none"
              >
                Back - {sqftOptions.panels.back} sq ft
              </text>

              {/* Direction Arrow */}
              <g>
                <line x1="200" y1="20" x2="200" y2="32" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
                <polygon points="200,20 195,28 205,28" fill="hsl(var(--muted-foreground))" />
                <text x="200" y="15" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
                  FRONT
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-muted-foreground">Panel Legend</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(217, 91%, 60%)' }}></div>
              <span className="text-sm">Sides ({sqftOptions.panels.sides} sq ft)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }}></div>
              <span className="text-sm">Hood ({sqftOptions.panels.hood} sq ft)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(271, 91%, 65%)' }}></div>
              <span className="text-sm">Back ({sqftOptions.panels.back} sq ft)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }}></div>
              <span className="text-sm">Roof ({sqftOptions.panels.roof} sq ft)</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-border">
            <div className="text-sm font-semibold mb-1">Total Selected</div>
            <div className="text-2xl font-bold text-primary">
              {(selectedPanels.sides ? sqftOptions.panels.sides : 0) +
               (selectedPanels.back ? sqftOptions.panels.back : 0) +
               (selectedPanels.hood ? sqftOptions.panels.hood : 0) +
               (selectedPanels.roof ? sqftOptions.panels.roof : 0)} sq ft
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
