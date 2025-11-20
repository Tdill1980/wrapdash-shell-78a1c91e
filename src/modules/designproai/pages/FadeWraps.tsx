import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { VehicleSelector } from "../components/VehicleSelector";
import { FinishSelector } from "../components/FinishSelector";
import { ColorDropdown } from "../components/ColorDropdown";
import { getColorById } from "../lib/infusion-colors";
import { MainLayout } from "@/layouts/MainLayout";

const FADE_DIRECTIONS = [
  { value: "top-to-bottom", label: "Top to Bottom" },
  { value: "bottom-to-top", label: "Bottom to Top" },
  { value: "left-to-right", label: "Left to Right" },
  { value: "right-to-left", label: "Right to Left" },
  { value: "center-out", label: "Center Outward" },
  { value: "diagonal", label: "Diagonal" },
];

export default function FadeWraps() {
  const { organizationId, subscriptionTier } = useOrganization();
  
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model S");
  const [vehicleYear, setVehicleYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState("Sedan");
  
  const [startColorId, setStartColorId] = useState("black-002");
  const [endColorId, setEndColorId] = useState("white-001");
  const [fadeDirection, setFadeDirection] = useState("top-to-bottom");
  const [finishType, setFinishType] = useState("matte");
  const [hasMetallicFlakes, setHasMetallicFlakes] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState("");

  const handleGenerate = async () => {
    const startColor = getColorById(startColorId);
    const endColor = getColorById(endColorId);
    
    if (!startColor || !endColor) {
      toast.error("Please select both colors");
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
          colorHex: startColor.hex,
          colorName: `${startColor.name} to ${endColor.name} Fade`,
          finishType,
          hasMetallicFlakes,
          angle: "hero",
          mode: "fade",
          fadeConfig: {
            startColor: startColor.hex,
            endColor: endColor.hex,
            direction: fadeDirection,
          },
        },
      });

      if (error) throw error;
      setResultImage(data.imageUrl);
      toast.success("Fade wrap generated!");

      await supabase.from("color_visualizations").insert({
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_type: vehicleType,
        color_hex: startColor.hex,
        color_name: `${startColor.name} to ${endColor.name} Fade`,
        finish_type: finishType,
        has_metallic_flakes: hasMetallicFlakes,
        render_urls: { hero: data.imageUrl },
        tags: ["fade", "gradient", fadeDirection],
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
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="min-h-screen bg-background p-6">
          <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">
            <span className="text-white">Fade</span>
            <span className="text-gradient">Wraps</span>
            <span className="text-white">™</span>
          </h1>
          <p className="text-muted-foreground">
            Custom gradient and fade wrap visualization tool
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6 bg-card border">
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

            <Card className="p-6 bg-card border">
              <h2 className="text-xl font-semibold mb-4">Fade Configuration</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Start Color</Label>
                  <ColorDropdown
                    selectedColorId={startColorId}
                    setSelectedColorId={setStartColorId}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Color</Label>
                  <ColorDropdown
                    selectedColorId={endColorId}
                    setSelectedColorId={setEndColorId}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fade Direction</Label>
                  <Select value={fadeDirection} onValueChange={setFadeDirection}>
                    <SelectTrigger className="bg-card border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border">
                      {FADE_DIRECTIONS.map((dir) => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border">
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
              disabled={isGenerating}
              className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Fade...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Fade Wrap
                </>
              )}
            </Button>
          </div>

          <div>
            <Card className="p-6 bg-card border h-full">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Fade wrap preview"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-[400px] border-2 border-dashed border rounded-lg">
                  <p className="text-muted-foreground">
                    Configure your fade and generate to see preview
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
