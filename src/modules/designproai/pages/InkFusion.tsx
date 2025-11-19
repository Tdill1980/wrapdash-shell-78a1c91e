import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { VehicleSelector } from "../components/VehicleSelector";
import { FinishSelector } from "../components/FinishSelector";
import { ColorDropdown } from "../components/ColorDropdown";
import { RenderResults } from "../components/RenderResults";
import { useRenderPolling } from "../hooks/useRenderPolling";
import { getColorById } from "../lib/infusion-colors";
import { generateVisualizationTags } from "../lib/tag-engine";

export default function InkFusion() {
  const { organizationId, subscriptionTier } = useOrganization();
  
  // Vehicle details
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model S");
  const [vehicleYear, setVehicleYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState("Sedan");
  
  // Color details
  const [selectedColorId, setSelectedColorId] = useState("black-002");
  const [finishType, setFinishType] = useState("matte");
  const [hasMetallicFlakes, setHasMetallicFlakes] = useState(false);
  
  // Rendering state
  const [isGenerating, setIsGenerating] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [visualizationId, setVisualizationId] = useState<string | null>(null);
  const [allRenderUrls, setAllRenderUrls] = useState<Record<string, string>>({});
  const { jobs, addJob, startJob, clearJobs } = useRenderPolling();

  const handleGenerateRender = async () => {
    const color = getColorById(selectedColorId);
    if (!color) {
      toast.error("Please select a color");
      return;
    }

    if (!vehicleMake || !vehicleModel || !vehicleType) {
      toast.error("Please fill in all vehicle details");
      return;
    }

    setIsGenerating(true);
    clearJobs();
    setHeroImageUrl("");
    setAllRenderUrls({});

    try {
      // Add jobs for all angles
      addJob("hero");
      addJob("side");
      addJob("rear");
      addJob("detail");

      // Start hero render first
      const heroUrl = await startJob("hero", {
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleType,
        colorHex: color.hex,
        colorName: color.name,
        finishType: color.finish,
        hasMetallicFlakes: color.hasMetallicFlakes,
      });

      setHeroImageUrl(heroUrl);

      // Start background renders
      const anglePromises = ["side", "rear", "detail"].map((angle) =>
        startJob(angle, {
          vehicleMake,
          vehicleModel,
          vehicleYear,
          vehicleType,
          colorHex: color.hex,
          colorName: color.name,
          finishType: color.finish,
          hasMetallicFlakes: color.hasMetallicFlakes,
        })
      );

      const urls = await Promise.all(anglePromises);
      const renderUrls: Record<string, string> = {
        hero: heroUrl,
        side: urls[0],
        rear: urls[1],
        detail: urls[2],
      };

      setAllRenderUrls(renderUrls);

      // Save to database
      const tags = generateVisualizationTags({
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleType,
        colorHex: color.hex,
        colorName: color.name,
        finishType: color.finish,
        mode: "inkfusion",
        hasCustomDesign: false,
      });

      const { data: vizData, error: vizError } = await supabase
        .from("color_visualizations")
        .insert({
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_year: vehicleYear,
          vehicle_type: vehicleType,
          color_hex: color.hex,
          color_name: color.name,
          finish_type: color.finish,
          has_metallic_flakes: color.hasMetallicFlakes,
          infusion_color_id: color.id,
          render_urls: renderUrls,
          tags,
          organization_id: organizationId,
          subscription_tier: subscriptionTier,
        })
        .select()
        .single();

      if (vizError) throw vizError;
      setVisualizationId(vizData.id);

      // Send Klaviyo event
      await supabase.functions.invoke("send-klaviyo-event", {
        body: {
          event: "inkfusion_render_generated",
          properties: {
            visualization_id: vizData.id,
            vehicle: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
            color: color.name,
            finish: color.finish,
            mode: "inkfusion",
          },
        },
      });

      toast.success("3D renders complete! All angles generated.");
    } catch (error: any) {
      console.error("Error generating render:", error);
      toast.error(error.message || "Failed to generate render");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">
            <span className="text-white">Ink</span>
            <span className="text-gradient">Fusion</span>
            <span className="text-white">™</span>
          </h1>
          <p className="text-muted-foreground">
            Precision-matched InkFusion™ colors on premium Avery SW900 cast vinyl
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
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
              <h2 className="text-xl font-semibold mb-4">InkFusion™ Color Library</h2>
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
              onClick={handleGenerateRender}
              disabled={isGenerating}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-primary/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating 3D Renders...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate 3D Render
                </>
              )}
            </Button>
          </div>

          {/* Results Panel */}
          <div>
            <RenderResults
              heroImageUrl={heroImageUrl}
              backgroundJobs={jobs}
              visualizationId={visualizationId}
              renderUrls={allRenderUrls}
              vehicleInfo={{ make: vehicleMake, model: vehicleModel, year: vehicleYear, type: vehicleType }}
              colorInfo={{ hex: getColorById(selectedColorId)?.hex || "", name: getColorById(selectedColorId)?.name || "" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
