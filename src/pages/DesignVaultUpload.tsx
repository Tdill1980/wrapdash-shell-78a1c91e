import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function DesignVaultUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      // Upload images to storage
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

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      // Create color_visualization entry
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

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} image(s) uploaded to DesignVault`,
      });

      navigate('/designvault');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 font-poppins">
          <span className="text-foreground">Upload to Design</span>
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Vault</span>
          <span className="text-muted-foreground text-sm align-super">™</span>
        </h1>
        <p className="text-muted-foreground">Add new design visualizations with images and tags</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <Label htmlFor="images">Design Images *</Label>
            <div className="mt-2">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>
            
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Universal Design Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="universal">Universal Wrap Design</Label>
              <p className="text-sm text-muted-foreground">
                This design can be used on any vehicle (no specific make/model required)
              </p>
            </div>
            <Switch
              id="universal"
              checked={isUniversalDesign}
              onCheckedChange={setIsUniversalDesign}
            />
          </div>

          {/* Vehicle Info - Only show if not universal */}
          {!isUniversalDesign && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Vehicle Make *</Label>
                  <Input
                    id="make"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    placeholder="e.g., Tesla"
                    required={!isUniversalDesign}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Vehicle Model *</Label>
                  <Input
                    id="model"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="e.g., Model 3"
                    required={!isUniversalDesign}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: parseInt(e.target.value) })}
                    min={2000}
                    max={2030}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Vehicle Type *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="coupe">Coupe</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Color Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="colorName">Color Name</Label>
              <Input
                id="colorName"
                value={formData.colorName}
                onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                placeholder="e.g., Midnight Blue"
              />
            </div>
            <div>
              <Label htmlFor="colorHex">Color (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="colorHex"
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Finish Type */}
          <div>
            <Label htmlFor="finish">Finish Type *</Label>
            <Select
              value={formData.finishType}
              onValueChange={(value) => setFormData({ ...formData, finishType: value })}
            >
              <SelectTrigger id="finish">
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
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Comma-separated: luxury, sport, custom, blue"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter tags separated by commas
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to DesignVault
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/designvault')}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
