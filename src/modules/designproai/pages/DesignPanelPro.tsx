import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { VehicleSelector } from "../components/VehicleSelector";
import { FinishSelector } from "../components/FinishSelector";
import { ColorDropdown } from "../components/ColorDropdown";
import { getColorById } from "../lib/infusion-colors";

const VEHICLE_PANELS = [
  { id: "hood", label: "Hood" },
  { id: "roof", label: "Roof" },
  { id: "front_bumper", label: "Front Bumper" },
  { id: "rear_bumper", label: "Rear Bumper" },
  { id: "left_fender", label: "Left Fender" },
  { id: "right_fender", label: "Right Fender" },
  { id: "left_door", label: "Left Doors" },
  { id: "right_door", label: "Right Doors" },
  { id: "trunk", label: "Trunk/Hatch" },
];

export default function DesignPanelPro() {
  const { organizationId, subscriptionTier } = useOrganization();
  
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model S");
  const [vehicleYear, setVehicleYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState("Sedan");
  
  const [selectedColorId, setSelectedColorId] = useState("black-002");
  const [finishType, setFinishType] = useState("matte");
  const [hasMetallicFlakes, setHasMetallicFlakes] = useState(false);
  
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState("");

  const togglePanel = (panelId: string) => {
    setSelectedPanels(prev =>
      prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const handleGenerate = async () => {
    if (selectedPanels.length === 0) {
      toast.error("Please select at least one panel");
      return;
    }

    const color = getColorById(selectedColorId);
    if (!color) {
      toast.error("Please select a color");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-color-render", {
        body: {
          vehicleMake,
          vehicleModel,
          vehicleYear,
          vehicleType,
          colorHex: color.hex,
          colorName: color.name,
          finishType: color.finish,
          hasMetallicFlakes: color.hasMetallicFlakes,
          angle: "hero",
          mode: "panel",
          panels: selectedPanels,
        },
      });

      if (error) throw error;
      setResultImage(data.imageUrl);
      toast.success("Panel design generated!");

      // Save to database
      await supabase.from("color_visualizations").insert({
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_type: vehicleType,
        color_hex: color.hex,
        color_name: color.name,
        finish_type: color.finish,
        has_metallic_flakes: color.hasMetallicFlakes,
        infusion_color_id: color.id,
        render_urls: { hero: data.imageUrl },
        tags: ["panel", "partial", ...selectedPanels],
        organization_id: organizationId,
        subscription_tier: subscriptionTier,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">
            <span className="text-white">Design</span>
            <span className="text-gradient">Panel</span>
            <span className="text-white">Pro™</span>
          </h1>
          <p className="text-muted-foreground">
            Panel-by-panel wrap visualization for partial wraps and accents
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6 bg-surface border-border">
              <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
              <VehicleSelector
                vehicleMake={vehicleMake}
                setVehicleMake={setVehicleMake}
                vehicleModel={vehicleModel}
                setVehicleModel={setVehicleModel}
                vehicleYear={vehicleYear}
                setVehicleYear={setVehicleYear}
                vehicleType={vehicleType}
                setVehicleType={setVehicleType}
              />
            </Card>

            <Card className="p-6 bg-surface border-border">
              <h2 className="text-xl font-semibold mb-4">Select Panels to Wrap</h2>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_PANELS.map((panel) => (
                  <div key={panel.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={panel.id}
                      checked={selectedPanels.includes(panel.id)}
                      onCheckedChange={() => togglePanel(panel.id)}
                    />
                    <Label htmlFor={panel.id} className="cursor-pointer">
                      {panel.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Selected: {selectedPanels.length} panel(s)
              </p>
            </Card>

            <Card className="p-6 bg-surface border-border">
              <h2 className="text-xl font-semibold mb-4">Color Selection</h2>
              <ColorDropdown
                selectedColorId={selectedColorId}
                setSelectedColorId={setSelectedColorId}
              />
            </Card>

            <Card className="p-6 bg-surface border-border">
              <h2 className="text-xl font-semibold mb-4">Finish Options</h2>
              <FinishSelector
                finishType={finishType}
                setFinishType={setFinishType}
                hasMetallicFlakes={hasMetallicFlakes}
                setHasMetallicFlakes={setHasMetallicFlakes}
              />
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || selectedPanels.length === 0}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Panel Design
                </>
              )}
            </Button>
          </div>

          <div>
            <Card className="p-6 bg-surface border-border h-full">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Panel design preview"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">
                    Select panels and generate to see preview
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
