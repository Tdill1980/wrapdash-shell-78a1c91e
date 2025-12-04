import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileImage, ZoomIn, Loader2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ImageLightbox } from "./ImageLightbox";

interface ProofResultsEnhancedProps {
  panelUrl?: string;
  proofUrl?: string;
  onGeneratePrintPackage?: () => void;
  isGeneratingPrint?: boolean;
}

export function ProofResultsEnhanced({ 
  panelUrl, 
  proofUrl, 
  onGeneratePrintPackage,
  isGeneratingPrint 
}: ProofResultsEnhancedProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${name}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (!panelUrl && !proofUrl) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {panelUrl && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Flat Panel Design</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxImage({ url: panelUrl, title: "Flat Panel Design" })}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(panelUrl, "panel-design")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden">
              <img 
                src={panelUrl} 
                alt="Panel design" 
                className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxImage({ url: panelUrl, title: "Flat Panel Design" })}
              />
            </AspectRatio>
          </Card>
        )}

        {proofUrl && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">3D Wrap Proof</h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxImage({ url: proofUrl, title: "3D Wrap Proof" })}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(proofUrl, "3d-proof")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden mb-4">
              <img 
                src={proofUrl} 
                alt="3D proof" 
                className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxImage({ url: proofUrl, title: "3D Wrap Proof" })}
              />
            </AspectRatio>
            {onGeneratePrintPackage && (
              <Button 
                onClick={onGeneratePrintPackage}
                disabled={isGeneratingPrint}
                className="w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#E1306C] hover:from-[#5B7FFF] hover:via-[#9B59B6] hover:to-[#F56A9E]"
              >
                {isGeneratingPrint ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileImage className="w-4 h-4 mr-2" />
                )}
                Generate Print Package
              </Button>
            )}
          </Card>
        )}
      </div>

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          open={true}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
