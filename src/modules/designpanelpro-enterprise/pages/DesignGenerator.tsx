import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PanelSourceSelector } from "../components/PanelSourceSelector";
import { VehicleInput } from "../components/VehicleInput";
import { AIGeneratorForm } from "../components/AIGeneratorForm";
import { ProofResultsEnhanced } from "../components/ProofResultsEnhanced";
import { UploadPanel } from "../components/UploadPanel";
import { LibraryPanelSelector } from "../components/LibraryPanelSelector";
import { generatePanel, generate3DProof, generatePrintPackage, detectVehicleSize } from "../generator-api";
import { Loader2, ArrowRight } from "lucide-react";
import { DesignPanel } from "../panel-api";

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
      setProofUrl(""); // Clear previous proof
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

  const handlePanelUploaded = (url: string) => {
    setPanelUrl(url);
    setProofUrl(""); // Clear previous proof
    // Default dimensions for uploaded panels
    setPanelDimensions({ width: 120, height: 48 });
  };

  const handleLibraryPanelSelected = (url: string, panel: DesignPanel) => {
    setPanelUrl(url);
    setProofUrl(""); // Clear previous proof
    setPanelDimensions({ 
      width: panel.width_inches || 120, 
      height: panel.height_inches || 48 
    });
    // Auto-fill vehicle if panel has vehicle info
    if (panel.vehicle_year && panel.vehicle_make && panel.vehicle_model) {
      setVehicle(`${panel.vehicle_year} ${panel.vehicle_make} ${panel.vehicle_model}`);
    }
  };

  const handleGenerate3DProof = async () => {
    if (!panelUrl || !vehicle) {
      toast({
        title: "Missing Information",
        description: "Please select a panel and enter a vehicle first",
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

  const resetFlow = () => {
    setMode(null);
    setPanelUrl("");
    setProofUrl("");
    setVehicle("");
    setPanelDimensions(null);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Design<span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] bg-clip-text text-transparent">Pro</span>™ Generator
        </h1>
        <p className="text-muted-foreground">
          Create professional wrap designs with AI-powered 3D proofs
        </p>
      </div>

      {/* Step 1: Panel Source Selection */}
      <PanelSourceSelector onSelect={setMode} selectedMode={mode || undefined} />

      {/* Step 2: Panel Creation/Selection based on mode */}
      {mode === 'ai' && (
        <AIGeneratorForm 
          onGenerate={handleGeneratePanel}
          isLoading={isGeneratingPanel}
        />
      )}

      {mode === 'upload' && (
        <UploadPanel onPanelUploaded={handlePanelUploaded} />
      )}

      {mode === 'library' && (
        <LibraryPanelSelector onPanelSelected={handleLibraryPanelSelected} />
      )}

      {/* Step 3: Vehicle Input (shown after panel is ready) */}
      {panelUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <span>Panel ready! Now enter the target vehicle:</span>
          </div>
          <VehicleInput value={vehicle} onChange={setVehicle} />
        </div>
      )}

      {/* Step 4: Generate 3D Proof Button */}
      {panelUrl && vehicle && (
        <div className="flex justify-center gap-4">
          <Button 
            onClick={handleGenerate3DProof}
            disabled={isGeneratingProof}
            size="lg"
            className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E]"
          >
            {isGeneratingProof && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate 3D Wrap Proof
          </Button>
          <Button variant="outline" onClick={resetFlow}>
            Start Over
          </Button>
        </div>
      )}

      {/* Step 5: Results Display with Lightbox */}
      <ProofResultsEnhanced 
        panelUrl={panelUrl}
        proofUrl={proofUrl}
        onGeneratePrintPackage={proofUrl ? handleGeneratePrintPackage : undefined}
        isGeneratingPrint={isGeneratingPrint}
      />
    </div>
  );
}
