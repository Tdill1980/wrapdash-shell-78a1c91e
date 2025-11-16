import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterSidebarProps {
  onFilterChange: (filters: {
    tags?: string[];
    vehicleType?: string;
    finishType?: string;
  }) => void;
}

const vehicleTypes = ["sedan", "suv", "truck", "coupe", "van"];
const finishTypes = ["gloss", "matte", "satin", "chrome"];
const commonTags = [
  "custom-design",
  "inkfusion",
  "material-mode",
  "approval-mode",
  "metallic",
];

export const FilterSidebar = ({ onFilterChange }: FilterSidebarProps) => {
  return (
    <Card className="p-4 bg-[#121218] border-white/5 sticky top-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Vehicle Type
          </Label>
          <div className="space-y-2">
            {vehicleTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox id={`vehicle-${type}`} className="border-white/20" />
                <label
                  htmlFor={`vehicle-${type}`}
                  className="text-xs capitalize cursor-pointer text-foreground"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Finish Type
          </Label>
          <div className="space-y-2">
            {finishTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox id={`finish-${type}`} className="border-white/20" />
                <label
                  htmlFor={`finish-${type}`}
                  className="text-xs capitalize cursor-pointer text-foreground"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Tags
          </Label>
          <div className="space-y-2">
            {commonTags.map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox id={`tag-${tag}`} className="border-white/20" />
                <label
                  htmlFor={`tag-${tag}`}
                  className="text-xs cursor-pointer text-foreground"
                >
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
