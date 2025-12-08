import { VehicleSQFTOptions } from "@/lib/vehicleSqft";
import { VehicleType } from "@/lib/vehicleTypeDetection";

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface TopDownViewProProps {
  vehicleType: VehicleType;
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions?: VehicleSQFTOptions;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export function TopDownViewPro({
  vehicleType,
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: TopDownViewProProps) {
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

  // Vehicle proportions based on type
  const getVehicleProportions = () => {
    switch (vehicleType) {
      case 'truck':
        return { width: 90, length: 280, hoodLength: 60, cabLength: 70, bedLength: 130, backLength: 20 };
      case 'van':
        return { width: 85, length: 300, hoodLength: 30, cabLength: 50, cargoLength: 200, backLength: 20 };
      case 'suv':
        return { width: 85, length: 240, hoodLength: 50, roofLength: 160, backLength: 30 };
      default: // sedan
        return { width: 75, length: 220, hoodLength: 55, roofLength: 100, trunkLength: 45, backLength: 20 };
    }
  };

  const props = getVehicleProportions();
  const centerX = 200;
  const centerY = 75;

  return (
    <div className="w-full max-w-md">
      <svg 
        viewBox="0 0 400 150" 
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
      >
        {/* Blueprint grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border) / 0.2)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Vehicle outline */}
        <g transform={`translate(${centerX - props.length/2}, ${centerY - props.width/2})`}>
          
          {/* Hood zone */}
          <rect
            x="0"
            y="5"
            width={props.hoodLength}
            height={props.width - 10}
            rx="8"
            fill={getPanelFill('hood')}
            stroke={getPanelStroke('hood')}
            strokeWidth="2"
            className="cursor-pointer transition-all duration-200"
            onClick={() => onPanelClick('hood')}
            onMouseEnter={() => onPanelHover('hood')}
            onMouseLeave={() => onPanelHover(null)}
          />
          
          {/* Roof zone */}
          <rect
            x={props.hoodLength + 5}
            y="0"
            width={vehicleType === 'truck' ? props.cabLength : (vehicleType === 'van' ? props.cabLength + props.cargoLength : props.roofLength)}
            height={props.width}
            rx="4"
            fill={getPanelFill('roof')}
            stroke={getPanelStroke('roof')}
            strokeWidth="2"
            className="cursor-pointer transition-all duration-200"
            onClick={() => onPanelClick('roof')}
            onMouseEnter={() => onPanelHover('roof')}
            onMouseLeave={() => onPanelHover(null)}
          />

          {/* Sides - left */}
          <rect
            x={props.hoodLength}
            y="-8"
            width={props.length - props.hoodLength - props.backLength}
            height="10"
            rx="2"
            fill={getPanelFill('sides')}
            stroke={getPanelStroke('sides')}
            strokeWidth="1.5"
            className="cursor-pointer transition-all duration-200"
            onClick={() => onPanelClick('sides')}
            onMouseEnter={() => onPanelHover('sides')}
            onMouseLeave={() => onPanelHover(null)}
          />
          
          {/* Sides - right */}
          <rect
            x={props.hoodLength}
            y={props.width - 2}
            width={props.length - props.hoodLength - props.backLength}
            height="10"
            rx="2"
            fill={getPanelFill('sides')}
            stroke={getPanelStroke('sides')}
            strokeWidth="1.5"
            className="cursor-pointer transition-all duration-200"
            onClick={() => onPanelClick('sides')}
            onMouseEnter={() => onPanelHover('sides')}
            onMouseLeave={() => onPanelHover(null)}
          />

          {/* Back zone */}
          <rect
            x={props.length - props.backLength}
            y="5"
            width={props.backLength}
            height={props.width - 10}
            rx="4"
            fill={getPanelFill('back')}
            stroke={getPanelStroke('back')}
            strokeWidth="2"
            className="cursor-pointer transition-all duration-200"
            onClick={() => onPanelClick('back')}
            onMouseEnter={() => onPanelHover('back')}
            onMouseLeave={() => onPanelHover(null)}
          />

          {/* Wheels */}
          <ellipse cx="40" cy="-5" rx="15" ry="8" fill="hsl(var(--foreground) / 0.3)" />
          <ellipse cx="40" cy={props.width + 5} rx="15" ry="8" fill="hsl(var(--foreground) / 0.3)" />
          <ellipse cx={props.length - 40} cy="-5" rx="15" ry="8" fill="hsl(var(--foreground) / 0.3)" />
          <ellipse cx={props.length - 40} cy={props.width + 5} rx="15" ry="8" fill="hsl(var(--foreground) / 0.3)" />
        </g>

        {/* SQFT Labels */}
        {sqftOptions && (
          <g className="text-xs font-bold" fill="currentColor">
            <text 
              x={centerX - props.length/2 + props.hoodLength/2} 
              y={centerY} 
              textAnchor="middle" 
              dominantBaseline="middle"
              className={selectedPanels.hood ? 'fill-primary-foreground' : 'fill-foreground'}
              fontSize="10"
            >
              {sqftOptions.panels.hood}
            </text>
            <text 
              x={centerX} 
              y={centerY} 
              textAnchor="middle" 
              dominantBaseline="middle"
              className={selectedPanels.roof ? 'fill-primary-foreground' : 'fill-foreground'}
              fontSize="10"
            >
              {sqftOptions.panels.roof}
            </text>
            <text 
              x={centerX + props.length/2 - props.backLength/2} 
              y={centerY} 
              textAnchor="middle" 
              dominantBaseline="middle"
              className={selectedPanels.back ? 'fill-primary-foreground' : 'fill-foreground'}
              fontSize="10"
            >
              {sqftOptions.panels.back}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
