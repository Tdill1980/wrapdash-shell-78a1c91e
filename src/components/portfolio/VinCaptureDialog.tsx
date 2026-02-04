import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Check, Edit2 } from "lucide-react";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VinCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  currentVin?: string | null;
  currentVinPhoto?: string | null;
  onVinCaptured: (vin: string, photoPath: string) => void;
}

export function VinCaptureDialog({
  open,
  onOpenChange,
  jobId,
  currentVin,
  currentVinPhoto,
  onVinCaptured,
}: VinCaptureDialogProps) {
  const [vinPhoto, setVinPhoto] = useState<File | null>(null);
  const [vinPhotoPreview, setVinPhotoPreview] = useState<string | null>(null);
  const [extractedVin, setExtractedVin] = useState(currentVin || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVinPhoto(file);
    setVinPhotoPreview(URL.createObjectURL(file));
    
    // Auto-extract VIN using AI
    await extractVinFromPhoto(file);
  };

  const extractVinFromPhoto = async (file: File) => {
    setIsExtracting(true);
    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      const { data, error } = await lovableFunctions.functions.invoke("extract-vin-ocr", {
        body: { image: base64 },
      });

      if (error) throw error;

      if (data?.vin) {
        setExtractedVin(data.vin);
        toast.success("VIN extracted successfully");
      } else {
        toast.info("Could not extract VIN - please enter manually");
        setIsEditing(true);
      }
    } catch (err) {
      console.error("VIN extraction error:", err);
      toast.error("Failed to extract VIN - please enter manually");
      setIsEditing(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleSave = async () => {
    if (!vinPhoto || !extractedVin) {
      toast.error("Please capture VIN photo and confirm VIN number");
      return;
    }

    setIsUploading(true);
    try {
      // Upload VIN photo
      const fileExt = vinPhoto.name.split(".").pop();
      const fileName = `${jobId}/vin_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-media")
        .upload(fileName, vinPhoto);

      if (uploadError) throw uploadError;

      // Update job with VIN data
      const { error: updateError } = await supabase
        .from("portfolio_jobs")
        .update({
          vin_number: extractedVin,
          vin_photo_path: fileName,
        })
        .eq("id", jobId);

      if (updateError) throw updateError;

      toast.success("VIN captured and saved");
      onVinCaptured(extractedVin, fileName);
      onOpenChange(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save VIN");
    } finally {
      setIsUploading(false);
    }
  };

  const getVinPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture VIN</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* VIN Photo Capture */}
          <div className="space-y-2">
            <Label>VIN Plate Photo</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
            >
              {vinPhotoPreview || currentVinPhoto ? (
                <img
                  src={vinPhotoPreview || (currentVinPhoto ? getVinPhotoUrl(currentVinPhoto) : "")}
                  alt="VIN plate"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                  <Camera className="h-8 w-8" />
                  <span className="text-sm">Tap to capture VIN plate</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Extracted VIN */}
          <div className="space-y-2">
            <Label>VIN Number</Label>
            {isExtracting ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Extracting VIN...</span>
              </div>
            ) : isEditing ? (
              <Input
                value={extractedVin}
                onChange={(e) => setExtractedVin(e.target.value.toUpperCase())}
                placeholder="Enter VIN (17 characters)"
                maxLength={17}
              />
            ) : extractedVin ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="font-mono">{extractedVin}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-lg text-muted-foreground text-sm">
                Capture photo to extract VIN
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!extractedVin || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save VIN"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
