import { Checkbox } from '@/components/ui/checkbox';
import { VehicleSQFTOptions } from '@/lib/vehicleSqft';
import { estimatePanelDimensions } from '@/lib/vehicleTypeDetection';

interface PanelState {
  sides: boolean;
  back: boolean;
  hood: boolean;
  roof: boolean;
}

interface PanelMeasurementsTableProps {
  selectedPanels: PanelState;
  onPanelToggle: (panel: keyof PanelState) => void;
  sqftOptions: VehicleSQFTOptions | null;
}

export const PanelMeasurementsTable = ({
  selectedPanels,
  onPanelToggle,
  sqftOptions
}: PanelMeasurementsTableProps) => {
  if (!sqftOptions) {
    return (
      <div className="text-muted-foreground text-sm text-center py-4">
        Select a vehicle to see panel measurements
      </div>
    );
  }

  const panels: { key: keyof PanelState; label: string; panelType: 'hood' | 'roof' | 'sides' | 'back' }[] = [
    { key: 'hood', label: 'Hood', panelType: 'hood' },
    { key: 'roof', label: 'Roof', panelType: 'roof' },
    { key: 'sides', label: 'Driver Side', panelType: 'sides' },
    { key: 'back', label: 'Rear/Tailgate', panelType: 'back' }
  ];

  const totalSelected = Object.entries(selectedPanels)
    .filter(([_, selected]) => selected)
    .reduce((total, [key]) => {
      const panelKey = key as keyof PanelState;
      if (panelKey === 'sides') {
        return total + sqftOptions.panels.sides;
      }
      return total + sqftOptions.panels[panelKey];
    }, 0);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">Panel Measurements</h4>
      
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium">Panel</th>
              <th className="text-center p-2 font-medium">Width</th>
              <th className="text-center p-2 font-medium">Height</th>
              <th className="text-right p-2 font-medium">Area</th>
            </tr>
          </thead>
          <tbody>
            {panels.map(({ key, label, panelType }) => {
              const sqft = key === 'sides' 
                ? sqftOptions.panels.sides 
                : sqftOptions.panels[key];
              const dimensions = estimatePanelDimensions(sqft, panelType);
              
              return (
                <tr 
                  key={key} 
                  className={`border-t border-border hover:bg-muted/30 cursor-pointer transition-colors ${
                    selectedPanels[key] ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => onPanelToggle(key)}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={selectedPanels[key]} 
                        onCheckedChange={() => onPanelToggle(key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={selectedPanels[key] ? 'font-medium text-primary' : ''}>
                        {label}
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-2 text-muted-foreground">
                    {dimensions.width}"
                  </td>
                  <td className="text-center p-2 text-muted-foreground">
                    {dimensions.height}"
                  </td>
                  <td className="text-right p-2 font-medium">
                    {sqft} sqft
                  </td>
                </tr>
              );
            })}
            
            {/* Passenger side (same as driver side) */}
            <tr 
              className={`border-t border-border hover:bg-muted/30 cursor-pointer transition-colors ${
                selectedPanels.sides ? 'bg-primary/10' : ''
              }`}
              onClick={() => onPanelToggle('sides')}
            >
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedPanels.sides} 
                    onCheckedChange={() => onPanelToggle('sides')}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={selectedPanels.sides ? 'font-medium text-primary' : ''}>
                    Passenger Side
                  </span>
                </div>
              </td>
              <td className="text-center p-2 text-muted-foreground">
                {estimatePanelDimensions(sqftOptions.panels.sides, 'sides').width}"
              </td>
              <td className="text-center p-2 text-muted-foreground">
                {estimatePanelDimensions(sqftOptions.panels.sides, 'sides').height}"
              </td>
              <td className="text-right p-2 font-medium">
                {sqftOptions.panels.sides} sqft
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/50">
              <td colSpan={3} className="p-2 font-semibold">
                Total Selected Coverage
              </td>
              <td className="text-right p-2 font-bold text-primary">
                {totalSelected.toFixed(1)} sqft
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Full Vehicle: {sqftOptions.withRoof.toFixed(1)} sqft</span>
        <span>Without Roof: {sqftOptions.withoutRoof.toFixed(1)} sqft</span>
      </div>
    </div>
  );
};
