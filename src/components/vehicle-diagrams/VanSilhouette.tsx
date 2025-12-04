import { VehicleSQFTOptions } from '@/lib/vehicleSqft';

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface VanSilhouetteProps {
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions: VehicleSQFTOptions | null;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export const VanSilhouette = ({
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: VanSilhouetteProps) => {
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
    <svg viewBox="0 0 420 170" className="w-full h-auto">
      {/* Van body outline - tall and boxy */}
      <path
        d="M 20 130 
           L 35 130 
           L 45 105 
           L 70 50 
           L 100 30 
           L 380 30 
           L 395 50 
           L 395 130 
           L 405 130 
           L 405 140 
           L 20 140 
           Z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      
      {/* Hood panel (shorter on van) - clickable */}
      <path
        d="M 45 105 L 70 50 L 100 30 L 100 105 L 45 105 Z"
        fill={getPanelFill('hood')}
        stroke={getPanelStroke('hood')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('hood')}
        onMouseEnter={() => onPanelHover('hood')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="75" y="75" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.hood} sqft
        </text>
      )}
      
      {/* Roof panel (long van roof) - clickable */}
      <path
        d="M 100 30 L 380 30 L 380 40 L 100 40 Z"
        fill={getPanelFill('roof')}
        stroke={getPanelStroke('roof')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('roof')}
        onMouseEnter={() => onPanelHover('roof')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="240" y="28" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.roof} sqft
        </text>
      )}
      
      {/* Side panel (tall van sides) - clickable */}
      <path
        d="M 45 105 L 100 105 L 100 40 L 380 40 L 380 130 L 395 130 L 395 50 L 380 30 L 100 30 L 70 50 L 45 105 L 35 130 L 20 130 L 20 140 L 405 140 L 405 130 L 45 130 Z"
        fill={getPanelFill('sides')}
        stroke={getPanelStroke('sides')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('sides')}
        onMouseEnter={() => onPanelHover('sides')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="240" y="95" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.sides} sqft
        </text>
      )}
      
      {/* Back panel (rear doors) - clickable */}
      <path
        d="M 380 40 L 395 50 L 395 130 L 380 130 Z"
        fill={getPanelFill('back')}
        stroke={getPanelStroke('back')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('back')}
        onMouseEnter={() => onPanelHover('back')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="387" y="90" fill="hsl(var(--foreground))" fontSize="8" textAnchor="middle" className="pointer-events-none font-medium" transform="rotate(90, 387, 90)">
          {sqftOptions.panels.back}
        </text>
      )}
      
      {/* Windshield */}
      <path
        d="M 75 55 L 98 35 L 98 100 L 75 100 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      
      {/* Side windows */}
      <path
        d="M 105 45 L 155 45 L 155 95 L 105 95 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      <path
        d="M 160 45 L 210 45 L 210 95 L 160 95 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      
      {/* Cargo area (no windows) */}
      <rect x="220" y="45" width="155" height="80" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" className="pointer-events-none" />
      
      {/* Wheels */}
      <circle cx="80" cy="140" r="22" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="80" cy="140" r="12" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx="355" cy="140" r="22" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="355" cy="140" r="12" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Headlight */}
      <ellipse cx="35" cy="115" rx="8" ry="5" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Taillight */}
      <rect x="392" y="110" width="6" height="15" fill="hsl(0 70% 50% / 0.5)" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Rear door handle */}
      <line x1="392" y1="85" x2="392" y2="95" stroke="hsl(var(--border))" strokeWidth="2" />
    </svg>
  );
};
