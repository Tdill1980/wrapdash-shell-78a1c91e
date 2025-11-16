import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { analyzeSwatchViaAPI } from "../lib/color-extractor";

interface SwatchUploaderProps {
  onSwatchAnalyzed: (data: {
    colorHex: string;
    colorName: string;
    finishType: string;
    hasMetallicFlakes: boolean;
    swatchUrl: string;
  }) => void;
}

export const SwatchUploader = ({ onSwatchAnalyzed }: SwatchUploaderProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      setIsAnalyzing(true);

      try {
        const result = await analyzeSwatchViaAPI(dataUrl);
        onSwatchAnalyzed({
          ...result,
          swatchUrl: dataUrl,
        });
        toast.success("Swatch analyzed successfully!");
      } catch (error) {
        console.error("Error analyzing swatch:", error);
        toast.error(error instanceof Error ? error.message : "Failed to analyze swatch");
        setPreviewUrl(null);
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Label>Upload Vinyl Swatch</Label>
      
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
        <input
          type="file"
          id="swatch-upload"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isAnalyzing}
        />
        
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Swatch preview"
              className="max-h-48 mx-auto rounded-lg"
            />
            {!isAnalyzing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewUrl(null);
                  document.getElementById("swatch-upload")?.click();
                }}
              >
                Change Swatch
              </Button>
            )}
          </div>
        ) : (
          <label htmlFor="swatch-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {isAnalyzing ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {isAnalyzing ? "Analyzing swatch..." : "Click to upload vinyl swatch"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB
              </p>
            </div>
          </label>
        )}
      </div>

      {isAnalyzing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>AI is extracting color information...</span>
        </div>
      )}
    </div>
  );
};
