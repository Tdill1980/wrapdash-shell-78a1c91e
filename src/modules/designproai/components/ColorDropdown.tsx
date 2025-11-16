import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INFUSION_COLORS, getColorById } from "../lib/infusion-colors";

interface ColorDropdownProps {
  selectedColorId: string;
  setSelectedColorId: (id: string) => void;
}

export const ColorDropdown = ({ selectedColorId, setSelectedColorId }: ColorDropdownProps) => {
  const categories = Array.from(new Set(INFUSION_COLORS.map(c => c.category)));

  return (
    <div className="space-y-2">
      <Label>Catalog Color</Label>
      <Select value={selectedColorId} onValueChange={setSelectedColorId}>
        <SelectTrigger className="bg-surface border-border">
          <SelectValue placeholder="Select a color" />
        </SelectTrigger>
        <SelectContent className="bg-surface border-border max-h-96">
          {categories.map((category) => {
            const colors = INFUSION_COLORS.filter(c => c.category === category);
            return (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  {category}
                </div>
                {colors.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {color.finish}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedColorId && (
        <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
          <div
            className="w-12 h-12 rounded border border-border"
            style={{ backgroundColor: getColorById(selectedColorId)?.hex }}
          />
          <div>
            <p className="font-medium">{getColorById(selectedColorId)?.name}</p>
            <p className="text-sm text-muted-foreground">
              {getColorById(selectedColorId)?.hex} • {getColorById(selectedColorId)?.finish}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
