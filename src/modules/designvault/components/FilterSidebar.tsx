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
    <Card className="p-6 bg-card border-border sticky top-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4">Filters</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Vehicle Type
          </Label>
          <div className="space-y-2">
            {vehicleTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox id={`vehicle-${type}`} />
                <label
                  htmlFor={`vehicle-${type}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Label className="text-sm font-medium mb-3 block">Finish Type</Label>
          <div className="space-y-2">
            {finishTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox id={`finish-${type}`} />
                <label
                  htmlFor={`finish-${type}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Label className="text-sm font-medium mb-3 block">Tags</Label>
          <div className="space-y-2">
            {commonTags.map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox id={`tag-${tag}`} />
                <label
                  htmlFor={`tag-${tag}`}
                  className="text-sm cursor-pointer"
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
