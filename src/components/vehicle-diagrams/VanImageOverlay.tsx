import { VehicleSQFTOptions } from "@/lib/vehicleSqft";

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface VanImageOverlayProps {
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions?: VehicleSQFTOptions;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export function VanImageOverlay({
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: VanImageOverlayProps) {
  const getPanelFill = (panel: keyof PanelState) => {
    if (selectedPanels[panel]) {
      return 'rgba(59, 130, 246, 0.5)';
    }
    if (hoveredPanel === panel) {
      return 'rgba(59, 130, 246, 0.2)';
    }
    return 'transparent';
  };

  const getPanelStroke = (panel: keyof PanelState) => {
    if (selectedPanels[panel] || hoveredPanel === panel) {
      return 'rgba(59, 130, 246, 0.8)';
    }
    return 'rgba(255, 255, 255, 0.3)';
  };

  return (
    <div className="relative w-full">
      {/* Base vehicle image */}
      <img 
        src="/vehicles/van-side.png" 
        alt="Van side profile"
        className="w-full h-auto"
        draggable={false}
      />
      
      {/* SVG overlay for clickable zones */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1024 512"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Hood zone - front of van (smaller on vans) */}
        <polygon
          points="80,300 80,180 180,150 180,300"
          fill={getPanelFill('hood')}
          stroke={getPanelStroke('hood')}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200"
          onClick={() => onPanelClick('hood')}
          onMouseEnter={() => onPanelHover('hood')}
          onMouseLeave={() => onPanelHover(null)}
        />
        
        {/* Roof zone - extended van roof */}
        <polygon
          points="180,150 180,80 900,80 900,150"
          fill={getPanelFill('roof')}
          stroke={getPanelStroke('roof')}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200"
          onClick={() => onPanelClick('roof')}
          onMouseEnter={() => onPanelHover('roof')}
          onMouseLeave={() => onPanelHover(null)}
        />
        
        {/* Sides zone - large cargo sides */}
        <polygon
          points="180,150 180,360 900,360 900,150"
          fill={getPanelFill('sides')}
          stroke={getPanelStroke('sides')}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200"
          onClick={() => onPanelClick('sides')}
          onMouseEnter={() => onPanelHover('sides')}
          onMouseLeave={() => onPanelHover(null)}
        />
        
        {/* Back zone - rear doors */}
        <polygon
          points="880,80 880,360 950,360 950,80"
          fill={getPanelFill('back')}
          stroke={getPanelStroke('back')}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200"
          onClick={() => onPanelClick('back')}
          onMouseEnter={() => onPanelHover('back')}
          onMouseLeave={() => onPanelHover(null)}
        />
      </svg>
      
      {/* SQFT Labels */}
      {sqftOptions && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Hood label */}
          <div className="absolute left-[10%] top-[48%] transform -translate-x-1/2 -translate-y-1/2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              selectedPanels.hood ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground'
            }`}>
              {sqftOptions.panels.hood} sqft
            </span>
          </div>
          
          {/* Roof label */}
          <div className="absolute left-[52%] top-[18%] transform -translate-x-1/2 -translate-y-1/2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              selectedPanels.roof ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground'
            }`}>
              {sqftOptions.panels.roof} sqft
            </span>
          </div>
          
          {/* Sides label */}
          <div className="absolute left-[52%] top-[52%] transform -translate-x-1/2 -translate-y-1/2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              selectedPanels.sides ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground'
            }`}>
              {sqftOptions.panels.sides} sqft
            </span>
          </div>
          
          {/* Back label */}
          <div className="absolute right-[5%] top-[45%] transform -translate-x-1/2 -translate-y-1/2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              selectedPanels.back ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground'
            }`}>
              {sqftOptions.panels.back} sqft
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
