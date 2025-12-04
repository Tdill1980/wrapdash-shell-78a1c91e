import { VehicleSQFTOptions } from '@/lib/vehicleSqft';
import { VehicleType } from '@/lib/vehicleTypeDetection';

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface TopDownViewProps {
  vehicleType: VehicleType;
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions: VehicleSQFTOptions | null;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export const TopDownView = ({
  vehicleType,
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: TopDownViewProps) => {
  const getPanelFill = (panel: keyof PanelState) => {
    if (selectedPanels[panel]) {
      return 'hsl(var(--primary))';
    }
    if (hoveredPanel === panel) {
      return 'hsl(var(--primary) / 0.3)';
    }
    return 'hsl(var(--muted) / 0.3)';
  };

  const getPanelStroke = (panel: keyof PanelState) => {
    if (selectedPanels[panel] || hoveredPanel === panel) {
      return 'hsl(var(--primary))';
    }
    return 'hsl(var(--border))';
  };

  // Adjust proportions based on vehicle type
  const getVehicleProportions = () => {
    switch (vehicleType) {
      case 'truck':
        return { hoodLength: 60, roofLength: 60, backLength: 80, width: 70 };
      case 'van':
        return { hoodLength: 40, roofLength: 140, backLength: 20, width: 75 };
      case 'suv':
        return { hoodLength: 55, roofLength: 100, backLength: 45, width: 72 };
      default: // sedan
        return { hoodLength: 50, roofLength: 90, backLength: 60, width: 65 };
    }
  };

  const props = getVehicleProportions();
  const totalLength = props.hoodLength + props.roofLength + props.backLength;
  const startX = (200 - props.width) / 2;
  const startY = 10;

  return (
    <svg viewBox="0 0 200 230" className="w-full h-auto max-w-[200px]">
      {/* Vehicle outline */}
      <rect
        x={startX}
        y={startY}
        width={props.width}
        height={totalLength}
        rx="15"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      
      {/* Hood panel */}
      <rect
        x={startX + 5}
        y={startY + 5}
        width={props.width - 10}
        height={props.hoodLength - 5}
        rx="10"
        fill={getPanelFill('hood')}
        stroke={getPanelStroke('hood')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('hood')}
        onMouseEnter={() => onPanelHover('hood')}
        onMouseLeave={() => onPanelHover(null)}
      />
      <text 
        x={startX + props.width / 2} 
        y={startY + props.hoodLength / 2 + 3} 
        fill="hsl(var(--foreground))" 
        fontSize="9" 
        textAnchor="middle" 
        className="pointer-events-none font-medium"
      >
        HOOD
      </text>
      {sqftOptions && (
        <text 
          x={startX + props.width / 2} 
          y={startY + props.hoodLength / 2 + 14} 
          fill="hsl(var(--foreground))" 
          fontSize="8" 
          textAnchor="middle" 
          className="pointer-events-none"
        >
          {sqftOptions.panels.hood} sqft
        </text>
      )}
      
      {/* Roof panel */}
      <rect
        x={startX + 5}
        y={startY + props.hoodLength}
        width={props.width - 10}
        height={props.roofLength}
        fill={getPanelFill('roof')}
        stroke={getPanelStroke('roof')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('roof')}
        onMouseEnter={() => onPanelHover('roof')}
        onMouseLeave={() => onPanelHover(null)}
      />
      <text 
        x={startX + props.width / 2} 
        y={startY + props.hoodLength + props.roofLength / 2 + 3} 
        fill="hsl(var(--foreground))" 
        fontSize="9" 
        textAnchor="middle" 
        className="pointer-events-none font-medium"
      >
        ROOF
      </text>
      {sqftOptions && (
        <text 
          x={startX + props.width / 2} 
          y={startY + props.hoodLength + props.roofLength / 2 + 14} 
          fill="hsl(var(--foreground))" 
          fontSize="8" 
          textAnchor="middle" 
          className="pointer-events-none"
        >
          {sqftOptions.panels.roof} sqft
        </text>
      )}
      
      {/* Back panel */}
      <rect
        x={startX + 5}
        y={startY + props.hoodLength + props.roofLength}
        width={props.width - 10}
        height={props.backLength - 5}
        rx="10"
        fill={getPanelFill('back')}
        stroke={getPanelStroke('back')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('back')}
        onMouseEnter={() => onPanelHover('back')}
        onMouseLeave={() => onPanelHover(null)}
      />
      <text 
        x={startX + props.width / 2} 
        y={startY + props.hoodLength + props.roofLength + props.backLength / 2 + 3} 
        fill="hsl(var(--foreground))" 
        fontSize="9" 
        textAnchor="middle" 
        className="pointer-events-none font-medium"
      >
        BACK
      </text>
      {sqftOptions && (
        <text 
          x={startX + props.width / 2} 
          y={startY + props.hoodLength + props.roofLength + props.backLength / 2 + 14} 
          fill="hsl(var(--foreground))" 
          fontSize="8" 
          textAnchor="middle" 
          className="pointer-events-none"
        >
          {sqftOptions.panels.back} sqft
        </text>
      )}
      
      {/* Side strips (left and right) */}
      <rect
        x={startX}
        y={startY + 5}
        width={5}
        height={totalLength - 10}
        fill={getPanelFill('sides')}
        stroke={getPanelStroke('sides')}
        strokeWidth="1"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('sides')}
        onMouseEnter={() => onPanelHover('sides')}
        onMouseLeave={() => onPanelHover(null)}
      />
      <rect
        x={startX + props.width - 5}
        y={startY + 5}
        width={5}
        height={totalLength - 10}
        fill={getPanelFill('sides')}
        stroke={getPanelStroke('sides')}
        strokeWidth="1"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('sides')}
        onMouseEnter={() => onPanelHover('sides')}
        onMouseLeave={() => onPanelHover(null)}
      />
      
      {/* Side label */}
      <text 
        x={startX - 8} 
        y={startY + totalLength / 2} 
        fill="hsl(var(--muted-foreground))" 
        fontSize="8" 
        textAnchor="middle" 
        transform={`rotate(-90, ${startX - 8}, ${startY + totalLength / 2})`}
        className="pointer-events-none"
      >
        SIDES
      </text>
      
      {/* Wheels indicators */}
      <circle cx={startX - 5} cy={startY + 30} r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx={startX + props.width + 5} cy={startY + 30} r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx={startX - 5} cy={startY + totalLength - 30} r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx={startX + props.width + 5} cy={startY + totalLength - 30} r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
    </svg>
  );
};
