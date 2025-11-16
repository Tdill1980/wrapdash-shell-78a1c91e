import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FinishSelectorProps {
  finishType: string;
  setFinishType: (finish: string) => void;
  hasMetallicFlakes: boolean;
  setHasMetallicFlakes: (has: boolean) => void;
}

export const FinishSelector = ({
  finishType,
  setFinishType,
  hasMetallicFlakes,
  setHasMetallicFlakes,
}: FinishSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Finish Type</Label>
        <Select value={finishType} onValueChange={setFinishType}>
          <SelectTrigger className="bg-surface border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface border-border">
            <SelectItem value="gloss">Gloss</SelectItem>
            <SelectItem value="matte">Matte</SelectItem>
            <SelectItem value="satin">Satin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="metallic"
          checked={hasMetallicFlakes}
          onCheckedChange={(checked) => setHasMetallicFlakes(checked as boolean)}
        />
        <label
          htmlFor="metallic"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Metallic Flakes
        </label>
      </div>
    </div>
  );
};
