import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PanelSourceSelector } from "../components/PanelSourceSelector";
import { VehicleInput } from "../components/VehicleInput";
import { AIGeneratorForm } from "../components/AIGeneratorForm";
import { ProofResults } from "../components/ProofResults";
import { generatePanel, generate3DProof, generatePrintPackage, detectVehicleSize } from "../generator-api";
import { Loader2 } from "lucide-react";

export default function DesignGenerator() {
  const { toast } = useToast();
  const [mode, setMode] = useState<'library' | 'upload' | 'ai' | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [panelUrl, setPanelUrl] = useState<string>("");
  const [panelDimensions, setPanelDimensions] = useState<{ width: number; height: number } | null>(null);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [isGeneratingPanel, setIsGeneratingPanel] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  const handleGeneratePanel = async (prompt: string, style: string) => {
    try {
      setIsGeneratingPanel(true);
      const size = vehicle ? detectVehicleSize(vehicle) : 'medium';
      
      const result = await generatePanel({ prompt, style, size });
      
      setPanelUrl(result.panel_url);
      setPanelDimensions({ 
        width: result.panel_width_in, 
        height: result.panel_height_in 
      });
      
      toast({
        title: "Panel Generated",
        description: "Your wrap panel design is ready!",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate panel",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPanel(false);
    }
  };

  const handleGenerate3DProof = async () => {
    if (!panelUrl || !vehicle) {
      toast({
        title: "Missing Information",
        description: "Please generate a panel and enter a vehicle first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingProof(true);
      const result = await generate3DProof({
        vehicle,
        panelUrl,
        angle: 'front',
        finish: 'gloss',
        environment: 'studio'
      });
      
      setProofUrl(result.render);
      
      toast({
        title: "3D Proof Generated",
        description: "Your wrap visualization is ready!",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate 3D proof",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleGeneratePrintPackage = async () => {
    if (!panelUrl || !panelDimensions) {
      toast({
        title: "Missing Information",
        description: "Panel data is required to generate print package",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPrint(true);
      const result = await generatePrintPackage({
        panelUrl,
        widthIn: panelDimensions.width,
        heightIn: panelDimensions.height
      });
      
      // Download the print file
      window.open(result.print_url, '_blank');
      
      toast({
        title: "Print Package Ready",
        description: "Your 300 DPI print file has been generated",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate print package",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrint(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Design<span className="text-primary">Pro</span>™ Generator
        </h1>
        <p className="text-muted-foreground">
          Create professional wrap designs with AI-powered 3D proofs
        </p>
      </div>

      <PanelSourceSelector onSelect={setMode} selectedMode={mode || undefined} />

      {mode === 'ai' && (
        <AIGeneratorForm 
          onGenerate={handleGeneratePanel}
          isLoading={isGeneratingPanel}
        />
      )}

      {panelUrl && <VehicleInput value={vehicle} onChange={setVehicle} />}

      {panelUrl && vehicle && (
        <div className="flex justify-center">
          <Button 
            onClick={handleGenerate3DProof}
            disabled={isGeneratingProof}
            size="lg"
          >
            {isGeneratingProof && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate 3D Wrap Proof
          </Button>
        </div>
      )}

      <ProofResults 
        panelUrl={panelUrl}
        proofUrl={proofUrl}
        onGeneratePrintPackage={proofUrl ? handleGeneratePrintPackage : undefined}
        isGeneratingPrint={isGeneratingPrint}
      />
    </div>
  );
}
