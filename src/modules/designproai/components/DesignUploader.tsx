import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface DesignUploaderProps {
  onDesignUploaded: (dataUrl: string, fileName: string) => void;
  currentDesignUrl?: string;
}

export const DesignUploader = ({ onDesignUploaded, currentDesignUrl }: DesignUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentDesignUrl || null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      onDesignUploaded(dataUrl, file.name);
      toast.success("Design uploaded successfully!");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Label>Upload 2D Design</Label>
      
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
        <input
          type="file"
          id="design-upload"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Design preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            {fileName && (
              <p className="text-sm text-muted-foreground">{fileName}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("design-upload")?.click()}
            >
              Change Design
            </Button>
          </div>
        ) : (
          <label htmlFor="design-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload 2D design
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB
              </p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
};
