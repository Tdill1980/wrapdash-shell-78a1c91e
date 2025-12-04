import { VehicleSQFTOptions } from '@/lib/vehicleSqft';

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface SUVSilhouetteProps {
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions: VehicleSQFTOptions | null;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export const SUVSilhouette = ({
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: SUVSilhouetteProps) => {
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
    <svg viewBox="0 0 400 160" className="w-full h-auto">
      {/* SUV body outline - taller and boxier */}
      <path
        d="M 25 115 
           L 45 115 
           L 55 90 
           L 90 55 
           L 140 40 
           L 300 40 
           L 340 55 
           L 365 90 
           L 375 115 
           L 385 115 
           L 385 125 
           L 25 125 
           Z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      
      {/* Hood panel - clickable */}
      <path
        d="M 55 90 L 90 55 L 140 40 L 140 90 L 55 90 Z"
        fill={getPanelFill('hood')}
        stroke={getPanelStroke('hood')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('hood')}
        onMouseEnter={() => onPanelHover('hood')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="100" y="72" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.hood} sqft
        </text>
      )}
      
      {/* Roof panel - clickable (taller for SUV) */}
      <path
        d="M 140 40 L 300 40 L 300 48 L 140 48 Z"
        fill={getPanelFill('roof')}
        stroke={getPanelStroke('roof')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('roof')}
        onMouseEnter={() => onPanelHover('roof')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="220" y="38" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.roof} sqft
        </text>
      )}
      
      {/* Side panel - clickable */}
      <path
        d="M 55 90 L 140 90 L 140 48 L 300 48 L 300 90 L 365 90 L 375 115 L 25 115 L 45 115 L 55 90 Z"
        fill={getPanelFill('sides')}
        stroke={getPanelStroke('sides')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('sides')}
        onMouseEnter={() => onPanelHover('sides')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="200" y="105" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.sides} sqft
        </text>
      )}
      
      {/* Back panel - clickable */}
      <path
        d="M 300 40 L 340 55 L 365 90 L 300 90 L 300 40 Z"
        fill={getPanelFill('back')}
        stroke={getPanelStroke('back')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('back')}
        onMouseEnter={() => onPanelHover('back')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="325" y="70" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.back} sqft
        </text>
      )}
      
      {/* Windows - larger for SUV */}
      <path
        d="M 145 50 L 195 50 L 195 85 L 145 85 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      <path
        d="M 200 50 L 250 50 L 250 85 L 200 85 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      <path
        d="M 255 50 L 295 50 L 295 85 L 255 85 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      
      {/* Wheels - larger for SUV */}
      <circle cx="85" cy="125" r="22" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="85" cy="125" r="12" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx="325" cy="125" r="22" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="325" cy="125" r="12" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Headlight */}
      <ellipse cx="40" cy="102" rx="10" ry="6" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Taillight */}
      <ellipse cx="378" cy="102" rx="5" ry="10" fill="hsl(0 70% 50% / 0.5)" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Roof rails */}
      <line x1="145" y1="40" x2="295" y2="40" stroke="hsl(var(--border))" strokeWidth="3" />
    </svg>
  );
};
