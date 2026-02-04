import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { VehicleSelector } from "../components/VehicleSelector";
import { FinishSelector } from "../components/FinishSelector";
import { DesignUploader } from "../components/DesignUploader";
import { MainLayout } from "@/layouts/MainLayout";

export default function WBTY() {
  const { organizationId, subscriptionTier } = useOrganization();
  
  const [vehicleMake, setVehicleMake] = useState("Tesla");
  const [vehicleModel, setVehicleModel] = useState("Model S");
  const [vehicleYear, setVehicleYear] = useState(2024);
  const [vehicleType, setVehicleType] = useState("Sedan");
  
  const [customDesignUrl, setCustomDesignUrl] = useState("");
  const [designFileName, setDesignFileName] = useState("");
  const [finishType, setFinishType] = useState("gloss");
  const [hasMetallicFlakes, setHasMetallicFlakes] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState("");

  const handleDesignUploaded = (dataUrl: string, fileName: string) => {
    setCustomDesignUrl(dataUrl);
    setDesignFileName(fileName);
  };

  const handleGenerate = async () => {
    if (!customDesignUrl) {
      toast.error("Please upload a design file first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await lovableFunctions.functions.invoke("generate-color-render", {
        body: {
          vehicleMake,
          vehicleModel,
          vehicleYear,
          vehicleType,
          colorHex: "#333333",
          colorName: "Custom Design",
          finishType,
          hasMetallicFlakes,
          customDesignUrl,
          angle: "hero",
          mode: "approval",
        },
      });

      if (error) throw error;
      setResultImage(data.imageUrl);
      toast.success("Pre-approval proof generated!");

      await supabase.from("color_visualizations").insert({
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_type: vehicleType,
        color_hex: "#333333",
        color_name: "Custom Design",
        finish_type: finishType,
        has_metallic_flakes: hasMetallicFlakes,
        custom_design_url: customDesignUrl,
        design_file_name: designFileName,
        uses_custom_design: true,
        render_urls: { hero: data.imageUrl },
        tags: ["wbty", "pre-approval", "custom"],
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
            <span className="text-white">WBTY</span>
            <span className="text-gradient">™</span>
          </h1>
          <h2 className="text-xl text-muted-foreground">
            Wrap Before They Yard
          </h2>
          <p className="text-muted-foreground">
            Upload your 2D design and see it wrapped on the vehicle before production
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
              <h2 className="text-xl font-semibold mb-4">Upload Design File</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your flattened 2D wrap design (PNG, JPG, or AI file)
              </p>
              <DesignUploader
                onDesignUploaded={handleDesignUploaded}
                currentDesignUrl={customDesignUrl}
              />
              {designFileName && (
                <p className="text-sm text-muted-foreground mt-2">
                  Uploaded: {designFileName}
                </p>
              )}
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
              disabled={isGenerating || !customDesignUrl}
              className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Proof...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Pre-Approval Proof
                </>
              )}
            </Button>
          </div>

          <div>
            <Card className="p-6 bg-card border h-full">
              <h2 className="text-xl font-semibold mb-4">Pre-Approval Proof</h2>
              {resultImage ? (
                <div className="space-y-4">
                  <img
                    src={resultImage}
                    alt="WBTY proof"
                    className="w-full rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is how your design will look wrapped on the vehicle
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] border-2 border-dashed border rounded-lg">
                  <p className="text-muted-foreground">
                    Upload your design and generate to see proof
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
