import { VehicleSQFTOptions } from '@/lib/vehicleSqft';

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface SedanSilhouetteProps {
  selectedPanels: PanelState;
  onPanelClick: (panel: keyof PanelState) => void;
  sqftOptions: VehicleSQFTOptions | null;
  hoveredPanel: string | null;
  onPanelHover: (panel: string | null) => void;
}

export const SedanSilhouette = ({
  selectedPanels,
  onPanelClick,
  sqftOptions,
  hoveredPanel,
  onPanelHover
}: SedanSilhouetteProps) => {
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
    <svg viewBox="0 0 400 150" className="w-full h-auto">
      {/* Car body outline */}
      <path
        d="M 30 100 
           L 50 100 
           L 60 80 
           L 100 60 
           L 150 50 
           L 280 50 
           L 320 60 
           L 350 80 
           L 360 100 
           L 380 100 
           L 380 110 
           L 30 110 
           Z"
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      
      {/* Hood panel - clickable */}
      <path
        d="M 60 80 L 100 60 L 150 50 L 150 80 L 60 80 Z"
        fill={getPanelFill('hood')}
        stroke={getPanelStroke('hood')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('hood')}
        onMouseEnter={() => onPanelHover('hood')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="105" y="70" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.hood} sqft
        </text>
      )}
      
      {/* Roof panel - clickable */}
      <path
        d="M 150 50 L 280 50 L 280 55 L 150 55 Z"
        fill={getPanelFill('roof')}
        stroke={getPanelStroke('roof')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('roof')}
        onMouseEnter={() => onPanelHover('roof')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="215" y="48" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.roof} sqft
        </text>
      )}
      
      {/* Side panel - clickable */}
      <path
        d="M 60 80 L 150 80 L 150 55 L 280 55 L 280 80 L 350 80 L 360 100 L 30 100 L 50 100 L 60 80 Z"
        fill={getPanelFill('sides')}
        stroke={getPanelStroke('sides')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('sides')}
        onMouseEnter={() => onPanelHover('sides')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="200" y="92" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.sides} sqft
        </text>
      )}
      
      {/* Back panel - clickable */}
      <path
        d="M 280 50 L 320 60 L 350 80 L 280 80 L 280 50 Z"
        fill={getPanelFill('back')}
        stroke={getPanelStroke('back')}
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPanelClick('back')}
        onMouseEnter={() => onPanelHover('back')}
        onMouseLeave={() => onPanelHover(null)}
      />
      {sqftOptions && (
        <text x="310" y="70" fill="hsl(var(--foreground))" fontSize="10" textAnchor="middle" className="pointer-events-none font-medium">
          {sqftOptions.panels.back} sqft
        </text>
      )}
      
      {/* Windows */}
      <path
        d="M 155 52 L 200 52 L 200 75 L 155 75 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      <path
        d="M 205 52 L 275 52 L 275 75 L 205 75 Z"
        fill="hsl(var(--background) / 0.5)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        className="pointer-events-none"
      />
      
      {/* Wheels */}
      <circle cx="90" cy="110" r="18" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="90" cy="110" r="10" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      <circle cx="320" cy="110" r="18" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
      <circle cx="320" cy="110" r="10" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Headlight */}
      <ellipse cx="45" cy="90" rx="8" ry="5" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--border))" strokeWidth="1" />
      
      {/* Taillight */}
      <ellipse cx="365" cy="90" rx="5" ry="8" fill="hsl(0 70% 50% / 0.5)" stroke="hsl(var(--border))" strokeWidth="1" />
    </svg>
  );
};
