import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadPanelProps {
  onPanelUploaded: (url: string) => void;
}

export function UploadPanel({ onPanelUploaded }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `panel-${Date.now()}.${fileExt}`;
      const filePath = `custom-panels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("approveflow-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("approveflow-files")
        .getPublicUrl(filePath);

      toast.success("Panel uploaded successfully!");
      onPanelUploaded(urlData.publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload panel");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Custom Panel</h3>
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-contain bg-muted rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearPreview}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="panel-upload"
          />
          <label htmlFor="panel-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Drop your panel design here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PNG, JPG, TIFF)
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select File
                </span>
              </Button>
            </div>
          </label>
        </div>
      )}
    </Card>
  );
}
