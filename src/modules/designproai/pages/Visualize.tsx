import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { VehicleSelector } from "../components/VehicleSelector";
import { FinishSelector } from "../components/FinishSelector";
import { ColorDropdown } from "../components/ColorDropdown";
import { SwatchUploader } from "../components/SwatchUploader";
import { DesignUploader } from "../components/DesignUploader";
import { RenderResults } from "../components/RenderResults";
import { useRenderPolling } from "../hooks/useRenderPolling";
import { getColorById } from "../lib/infusion-colors";
import { generateVisualizationTags } from "../lib/tag-engine";

export default function Visualize() {
  const { organizationId, subscriptionTier } = useOrganization();
  const [mode, setMode] = useState<"inkfusion" | "material" | "approval">("inkfusion");
  
  // Vehicle details
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model S");
  const [vehicleYear, setVehicleYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState("Sedan");
  
  // Color details
  const [selectedColorId, setSelectedColorId] = useState("black-002");
  const [customColorHex, setCustomColorHex] = useState("");
  const [customColorName, setCustomColorName] = useState("");
  const [finishType, setFinishType] = useState("matte");
  const [hasMetallicFlakes, setHasMetallicFlakes] = useState(false);
  const [swatchUrl, setSwatchUrl] = useState("");
  
  // Design details
  const [customDesignUrl, setCustomDesignUrl] = useState("");
  const [designFileName, setDesignFileName] = useState("");
  
  // Rendering state
  const [isGenerating, setIsGenerating] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const { jobs, addJob, startJob, clearJobs } = useRenderPolling();

  const handleSwatchAnalyzed = (data: {
    colorHex: string;
    colorName: string;
    finishType: string;
    hasMetallicFlakes: boolean;
    swatchUrl: string;
  }) => {
    setCustomColorHex(data.colorHex);
    setCustomColorName(data.colorName);
    setFinishType(data.finishType);
    setHasMetallicFlakes(data.hasMetallicFlakes);
    setSwatchUrl(data.swatchUrl);
  };

  const handleDesignUploaded = (dataUrl: string, fileName: string) => {
    setCustomDesignUrl(dataUrl);
    setDesignFileName(fileName);
  };

  const handleGenerateRender = async () => {
    // Get color details based on mode
    let colorHex = "";
    let colorName = "";
    let infusionColorId = "";

    if (mode === "inkfusion") {
      const color = getColorById(selectedColorId);
      if (!color) {
        toast.error("Please select a color");
        return;
      }
      colorHex = color.hex;
      colorName = color.name;
      infusionColorId = color.id;
      setFinishType(color.finish);
      setHasMetallicFlakes(color.hasMetallicFlakes);
    } else if (mode === "material") {
      if (!customColorHex) {
        toast.error("Please upload a vinyl swatch first");
        return;
      }
      colorHex = customColorHex;
      colorName = customColorName;
    } else if (mode === "approval") {
      if (!customDesignUrl) {
        toast.error("Please upload a 2D design first");
        return;
      }
      // For approval mode, use a neutral color or extract from design
      colorHex = "#333333";
      colorName = "Custom Design";
    }

    if (!vehicleMake || !vehicleModel || !vehicleType) {
      toast.error("Please fill in all vehicle details");
      return;
    }

    setIsGenerating(true);
    clearJobs();

    const renderParams = {
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleType,
      colorHex,
      colorName,
      finishType,
      hasMetallicFlakes,
      customDesignUrl: mode === "approval" ? customDesignUrl : undefined,
    };

    try {
      // Generate hero image first
      toast.info("Generating hero render...");
      const heroUrl = await startJob("hero", renderParams);
      setHeroImageUrl(heroUrl);

      // Generate tags
      const tags = generateVisualizationTags({
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleType,
        colorHex,
        colorName,
        finishType,
        mode,
        hasCustomDesign: mode === "approval",
      });

      // Save to database
      const { error: dbError } = await supabase
        .from("color_visualizations")
        .insert({
          organization_id: organizationId,
          vehicle_year: vehicleYear,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_type: vehicleType,
          infusion_color_id: infusionColorId || null,
          color_hex: colorHex,
          color_name: colorName,
          finish_type: finishType,
          has_metallic_flakes: hasMetallicFlakes,
          custom_swatch_url: swatchUrl || null,
          custom_design_url: customDesignUrl || null,
          design_file_name: designFileName || null,
          uses_custom_design: mode === "approval",
          subscription_tier: subscriptionTier,
          render_urls: [{ angle: "hero", url: heroUrl }],
          tags,
        });

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error("Failed to save visualization");
      }

      toast.success("Hero render complete!");

      // Queue background renders
      const backgroundAngles = ["side", "rear", "detail"];
      backgroundAngles.forEach((angle) => addJob(angle));

      // Generate background renders sequentially
      toast.info("Generating additional angles in background...");
      for (const angle of backgroundAngles) {
        try {
          await startJob(angle, renderParams);
        } catch (error) {
          console.error(`Failed to generate ${angle}:`, error);
        }
      }

      toast.success("All renders complete!");
    } catch (error) {
      console.error("Error generating render:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate render");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Panel - Configuration */}
      <div className="space-y-6">
        <Card className="p-6 bg-card border-border rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 font-poppins">
            <span className="text-foreground">Wrap</span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Closer</span>
            <span className="text-muted-foreground text-sm align-super">™</span>
          </h2>

          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-surface">
              <TabsTrigger value="inkfusion">InkFusion</TabsTrigger>
              <TabsTrigger value="material">Material</TabsTrigger>
              <TabsTrigger value="approval">Approval</TabsTrigger>
            </TabsList>

            <TabsContent value="inkfusion" className="space-y-6 mt-6">
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
              <ColorDropdown
                selectedColorId={selectedColorId}
                setSelectedColorId={setSelectedColorId}
              />
            </TabsContent>

            <TabsContent value="material" className="space-y-6 mt-6">
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
              <SwatchUploader onSwatchAnalyzed={handleSwatchAnalyzed} />
              {customColorHex && (
                <div className="p-4 bg-surface rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded border border-border"
                      style={{ backgroundColor: customColorHex }}
                    />
                    <div>
                      <p className="font-medium">{customColorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {customColorHex} • {finishType}
                        {hasMetallicFlakes && " • Metallic"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approval" className="space-y-6 mt-6">
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
              <DesignUploader
                onDesignUploaded={handleDesignUploaded}
                currentDesignUrl={customDesignUrl}
              />
              <FinishSelector
                finishType={finishType}
                setFinishType={setFinishType}
                hasMetallicFlakes={hasMetallicFlakes}
                setHasMetallicFlakes={setHasMetallicFlakes}
              />
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleGenerateRender}
            disabled={isGenerating}
            className="w-full bg-gradient-purple hover:opacity-90 transition-opacity"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate 3D Render
              </>
            )}
          </Button>
        </Card>
      </div>

      {/* Right Panel - Results */}
      <div>
        <RenderResults heroImageUrl={heroImageUrl} backgroundJobs={jobs} />
      </div>
    </div>
  );
}
