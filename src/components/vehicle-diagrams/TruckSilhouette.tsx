import { VehicleSQFTOptions } from '@/lib/vehicleSqft';

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface TruckSilhouetteProps {
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions: VehicleSQFTOptions | null;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export const TruckSilhouette = ({
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: TruckSilhouetteProps) => {
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

  return (
    <svg viewBox="0 0 420 160" className="w-full h-auto">
      {/* Truck cab outline */}
      <path
        d="M 25 115 
           L 45 115 
           L 55 85 
           L 85 50 
           L 130 40 
           L 200 40 
           L 200 115 
           L 25 115 
           Z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      
      {/* Truck bed outline */}
      <path
        d="M 200 65 
           L 390 65 
           L 390 115 
           L 200 115 
           Z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      
      {/* Hood panel - clickable */}
      <path
        d="M 55 85 L 85 50 L 130 40 L 130 85 L 55 85 Z"
        fill={getPanelFill('hood')}
        stroke={getPanelStroke('hood')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('hood')}
        onMouseEnter={() => onPanelHover('hood')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="95" y="68" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.hood} sqft
        </text>
      )}
      
      {/* Roof panel (cab roof) - clickable */}
      <path
        d="M 130 40 L 200 40 L 200 48 L 130 48 Z"
        fill={getPanelFill('roof')}
        stroke={getPanelStroke('roof')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('roof')}
        onMouseEnter={() => onPanelHover('roof')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="165" y="38" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.roof} sqft
        </text>
      )}
      
      {/* Side panels (cab + bed) - clickable */}
      <path
        d="M 55 85 L 130 85 L 130 48 L 200 48 L 200 65 L 390 65 L 390 115 L 25 115 L 45 115 L 55 85 Z"
        fill={getPanelFill('sides')}
        stroke={getPanelStroke('sides')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('sides')}
        onMouseEnter={() => onPanelHover('sides')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="220" y="95" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.sides} sqft
        </text>
      )}
      
      {/* Back panel (tailgate) - clickable */}
      <path
        d="M 380 65 L 390 65 L 390 115 L 380 115 Z"
        fill={getPanelFill('back')}
        stroke={getPanelStroke('back')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('back')}
        onMouseEnter={() => onPanelHover('back')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="400" y="90" fill="hsl(var(--foreground))" fontSize="9" textAnchor="start" className="pointer-events-none font-medium">
          {sqftOptions.panels.back}
        </text>
      )}
      
      {/* Cab windows */}
      <path
        d="M 135 50 L 195 50 L 195 80 L 135 80 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      
      {/* Bed rails */}
      <line x1="205" y1="65" x2="385" y2="65" stroke="hsl(var(--border))" strokeWidth="2" />
      <line x1="205" y1="70" x2="205" y2="110" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" />
      <line x1="300" y1="70" x2="300" y2="110" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" />
      
      {/* Wheels - larger truck wheels */}
      <circle cx="85" cy="125" r="24" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="85" cy="125" r="14" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx="340" cy="125" r="24" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="340" cy="125" r="14" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Headlight */}
      <ellipse cx="40" cy="100" rx="10" ry="6" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Taillight */}
      <rect x="387" y="95" width="6" height="15" fill="hsl(0 70% 50% / 0.5)" stroke="hsl(var(--border))" strokeWidth="1" />
    </svg>
  );
};
