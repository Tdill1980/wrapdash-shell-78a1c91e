import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface Panel {
  name: string;
  width_in: number;
  height_in: number;
  orientation: string;
}

interface PanelSelectorProps {
  panels: Panel[];
  selectedPanels: string[];
  onPanelToggle: (panelName: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function PanelSelector({
  panels,
  selectedPanels,
  onPanelToggle,
  onSelectAll,
  onDeselectAll
}: PanelSelectorProps) {
  if (panels.length === 0) {
    return (
      <div className="p-4 border border-border rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No panel geometry data available for this vehicle.
          Full wrap will be auto-generated.
        </p>
      </div>
    );
  }

  const formatPanelName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const allSelected = panels.length === selectedPanels.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Panel Selection</Label>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="h-7 text-xs"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {panels.map((panel) => (
          <div
            key={panel.name}
            className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded-md transition-colors"
          >
            <Checkbox
              id={panel.name}
              checked={selectedPanels.includes(panel.name)}
              onCheckedChange={() => onPanelToggle(panel.name)}
            />
            <label
              htmlFor={panel.name}
              className="flex-1 text-sm cursor-pointer select-none"
            >
              <div className="font-medium">{formatPanelName(panel.name)}</div>
              <div className="text-xs text-muted-foreground">
                {panel.width_in}" × {panel.height_in}" ({panel.orientation})
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        {selectedPanels.length} of {panels.length} panels selected
      </div>
    </div>
  );
}