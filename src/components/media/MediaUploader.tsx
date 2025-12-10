import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, X, File, Image, Video, Music, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaUploaderProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  url?: string;
}

export function MediaUploader({ onClose, onUploadComplete }: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
      "audio/*": [".mp3", ".wav", ".ogg"],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const getFileType = (file: File): string => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "other";
  };

  const getFileIcon = (file: File) => {
    const type = getFileType(file);
    if (type === "image") return Image;
    if (type === "video") return Video;
    if (type === "audio") return Music;
    return File;
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== "pending") continue;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        const fileType = getFileType(uploadFile.file);
        const fileName = `${Date.now()}-${uploadFile.file.name}`;
        const filePath = `uploads/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media-library")
          .upload(filePath, uploadFile.file);

        if (uploadError) throw uploadError;

        // Update progress to 100%
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 100 } : f
          )
        );

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("media-library")
          .getPublicUrl(filePath);

        // Insert into content_files table
        const { error: insertError } = await supabase
          .from("content_files")
          .insert({
            file_url: urlData.publicUrl,
            file_type: fileType,
            original_filename: uploadFile.file.name,
            file_size_bytes: uploadFile.file.size,
            tags: tags.length > 0 ? tags : null,
            source: "upload",
            brand: "wpw",
          });

        if (insertError) throw insertError;

        // Update status to complete
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "complete" as const, url: urlData.publicUrl }
              : f
          )
        );
      } catch (error) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" as const } : f
          )
        );
        toast.error(`Failed to upload ${uploadFile.file.name}`);
      }
    }

    setIsUploading(false);
    toast.success("Files uploaded successfully!");
    onUploadComplete();
  };

  const allComplete = files.length > 0 && files.every((f) => f.status === "complete");
  const hasFiles = files.length > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Images, Videos, Audio
            </p>
          </div>

          {/* File List */}
          {hasFiles && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((uploadFile, index) => {
                const Icon = getFileIcon(uploadFile.file);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      {uploadFile.status === "uploading" && (
                        <Progress value={uploadFile.progress} className="h-1 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadFile.status === "complete" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {uploadFile.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {allComplete ? "Done" : "Cancel"}
            </Button>
            {!allComplete && (
              <Button onClick={uploadFiles} disabled={!hasFiles || isUploading}>
                {isUploading ? "Uploading..." : `Upload ${files.length} File(s)`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
