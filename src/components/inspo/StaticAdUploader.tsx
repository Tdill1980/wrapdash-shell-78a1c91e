import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaticAdUploaderProps {
  onUploadComplete?: () => void;
}

type AdType = 'single' | 'carousel_slide' | 'story_ad';

export function StaticAdUploader({ onUploadComplete }: StaticAdUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [adType, setAdType] = useState<AdType>('single');
  const [analyzing, setAnalyzing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload");
        return;
      }

      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      const organizationId = orgMember?.organization_id;

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `static-ads/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath);

        // Insert into content_files with static_ad category
        const { error: dbError } = await supabase
          .from('content_files')
          .insert({
            file_url: publicUrl,
            file_type: 'image',
            content_category: 'static_ad',
            organization_id: organizationId,
            source: 'upload',
            original_filename: file.name,
            tags: [adType],
            metadata: { adType }
          });

        if (dbError) throw dbError;
      }

      toast.success(`${files.length} static ad(s) uploaded successfully!`);
      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload static ads");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setUploading(true);
    setAnalyzing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload");
        return;
      }

      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      const organizationId = orgMember?.organization_id;

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `static-ads/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(filePath);

        // Insert into content_files
        const { data: insertedFile, error: dbError } = await supabase
          .from('content_files')
          .insert({
            file_url: publicUrl,
            file_type: 'image',
            content_category: 'static_ad',
            organization_id: organizationId,
            source: 'upload',
            original_filename: file.name,
            tags: [adType],
            metadata: { adType }
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Trigger AI analysis
        if (insertedFile) {
          await lovableFunctions.functions.invoke("analyze-inspo-image", {
            body: { 
              imageUrl: publicUrl, 
              organizationId, 
              contentFileId: insertedFile.id,
              analysisType: 'static_ad'
            },
          });
        }
      }

      toast.success(`${files.length} static ad(s) uploaded and analyzed!`);
      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload and analyze");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ad Type Selection */}
      <div className="space-y-2">
        <Label>Ad Type</Label>
        <Select value={adType} onValueChange={(v) => setAdType(v as AdType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Image Ad</SelectItem>
            <SelectItem value="carousel_slide">Carousel Slide</SelectItem>
            <SelectItem value="story_ad">Story Ad (9:16)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop images here..." : "Drop static ad images here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WEBP up to 10MB each
        </p>
      </div>

      {/* File Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Images ({files.length})</Label>
          <div className="grid grid-cols-3 gap-2">
            {files.map((file, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full aspect-square object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Badge 
                  variant="secondary" 
                  className="absolute bottom-1 left-1 text-[10px]"
                >
                  {adType.replace('_', ' ')}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1"
          >
            {uploading && !analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Only
          </Button>
          <Button
            onClick={handleUploadAndAnalyze}
            disabled={uploading}
            className="flex-1"
          >
            {uploading && analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Upload & Analyze
          </Button>
        </div>
      )}
    </div>
  );
}
