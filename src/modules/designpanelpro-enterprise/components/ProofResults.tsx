import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileImage } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProofResultsProps {
  panelUrl?: string;
  proofUrl?: string;
  onGeneratePrintPackage?: () => void;
  isGeneratingPrint?: boolean;
}

export function ProofResults({ 
  panelUrl, 
  proofUrl, 
  onGeneratePrintPackage,
  isGeneratingPrint 
}: ProofResultsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {panelUrl && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Flat Panel Design</h3>
          <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden">
            <img 
              src={panelUrl} 
              alt="Panel design" 
              className="w-full h-full object-contain"
            />
          </AspectRatio>
        </Card>
      )}

      {proofUrl && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">3D Wrap Proof</h3>
          <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden mb-4">
            <img 
              src={proofUrl} 
              alt="3D proof" 
              className="w-full h-full object-contain"
            />
          </AspectRatio>
          {onGeneratePrintPackage && (
            <Button 
              onClick={onGeneratePrintPackage}
              disabled={isGeneratingPrint}
              className="w-full"
            >
              <FileImage className="w-4 h-4 mr-2" />
              Generate Print Package
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
