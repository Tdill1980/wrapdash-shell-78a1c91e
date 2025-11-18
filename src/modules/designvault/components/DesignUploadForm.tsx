import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";

interface DesignUploadFormProps {
  onUploadComplete?: () => void;
}

export function DesignUploadForm({ onUploadComplete }: DesignUploadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUniversalDesign, setIsUniversalDesign] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: new Date().getFullYear(),
    vehicleType: "sedan",
    colorHex: "#000000",
    colorName: "",
    finishType: "gloss",
    tags: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const renderUrls: string[] = [];
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('design-vault')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('design-vault')
          .getPublicUrl(filePath);

        renderUrls.push(publicUrl);
      }

      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const { error: insertError } = await supabase
        .from('color_visualizations')
        .insert({
          vehicle_make: isUniversalDesign ? "Universal" : formData.vehicleMake,
          vehicle_model: isUniversalDesign ? "Any Vehicle" : formData.vehicleModel,
          vehicle_year: isUniversalDesign ? null : formData.vehicleYear,
          vehicle_type: isUniversalDesign ? "universal" : formData.vehicleType,
          color_hex: formData.colorHex,
          color_name: formData.colorName,
          finish_type: formData.finishType,
          render_urls: renderUrls,
          tags: isUniversalDesign ? [...tags, 'universal', 'any-vehicle'] : tags,
          uses_custom_design: false,
        });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["design-vault"] });

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} image(s) uploaded to DesignVault`,
      });

      // Reset form
      setSelectedFiles([]);
      setPreviewUrls([]);
      setFormData({
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: new Date().getFullYear(),
        vehicleType: "sedan",
        colorHex: "#000000",
        colorName: "",
        finishType: "gloss",
        tags: "",
      });
      setIsUniversalDesign(false);

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Upload */}
      <div>
        <Label htmlFor="images">Design Images *</Label>
        <div className="mt-2">
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById('images')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Images
          </Button>
        </div>
      </div>

      {/* Image Previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {previewUrls.map((url, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Universal Design Toggle */}
      <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
        <div>
          <Label htmlFor="universal" className="font-semibold">Universal Wrap Design</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Design can be applied to any vehicle
          </p>
        </div>
        <Switch
          id="universal"
          checked={isUniversalDesign}
          onCheckedChange={setIsUniversalDesign}
        />
      </div>

      {/* Vehicle Details - Only show if NOT universal */}
      {!isUniversalDesign && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="vehicleMake">Vehicle Make *</Label>
            <Input
              id="vehicleMake"
              value={formData.vehicleMake}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
              required={!isUniversalDesign}
            />
          </div>
          <div>
            <Label htmlFor="vehicleModel">Vehicle Model *</Label>
            <Input
              id="vehicleModel"
              value={formData.vehicleModel}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
              required={!isUniversalDesign}
            />
          </div>
        </div>
      )}

      {/* Color Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="colorName">Color Name *</Label>
          <Input
            id="colorName"
            value={formData.colorName}
            onChange={(e) => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
            required
            placeholder="e.g., Midnight Purple"
          />
        </div>
        <div>
          <Label htmlFor="colorHex">Color Hex *</Label>
          <div className="flex gap-2">
            <Input
              id="colorHex"
              type="color"
              value={formData.colorHex}
              onChange={(e) => setFormData(prev => ({ ...prev, colorHex: e.target.value }))}
              className="w-16"
            />
            <Input
              value={formData.colorHex}
              onChange={(e) => setFormData(prev => ({ ...prev, colorHex: e.target.value }))}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Finish Type */}
      <div>
        <Label htmlFor="finishType">Finish Type *</Label>
        <Select
          value={formData.finishType}
          onValueChange={(value) => setFormData(prev => ({ ...prev, finishType: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gloss">Gloss</SelectItem>
            <SelectItem value="matte">Matte</SelectItem>
            <SelectItem value="satin">Satin</SelectItem>
            <SelectItem value="chrome">Chrome</SelectItem>
            <SelectItem value="metallic">Metallic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="luxury, sport, premium"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-gradient-primary text-white"
        disabled={isUploading || selectedFiles.length === 0}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload to DesignVault
          </>
        )}
      </Button>
    </form>
  );
}
