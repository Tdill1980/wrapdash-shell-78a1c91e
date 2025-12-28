import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, X, File, Image, Video, Music, CheckCircle, Camera, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [contentCategory, setContentCategory] = useState<string>("raw");
  const [brand, setBrand] = useState<string>("wpw");
  const isMobile = useIsMobile();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    noClick: isMobile, // Disable click on mobile, we use separate buttons
  });

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFiles = e.target.files;
    if (capturedFiles) {
      const newFiles = Array.from(capturedFiles).map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

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

  // Generate thumbnail from video file before upload (avoids CORS issues)
  const generateVideoThumbnail = (videoFile: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        URL.revokeObjectURL(video.src);
        video.remove();
        canvas.remove();
      };

      video.onloadeddata = () => {
        // Seek to 1 second or 10% of duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          // Set canvas size to video dimensions (max 640px width for thumbnail)
          const scale = Math.min(1, 640 / video.videoWidth);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;

          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              resolve(blob);
            },
            "image/jpeg",
            0.8
          );
        } catch (error) {
          console.error("Error generating thumbnail:", error);
          cleanup();
          resolve(null);
        }
      };

      video.onerror = () => {
        console.error("Error loading video for thumbnail");
        cleanup();
        resolve(null);
      };

      // Set timeout in case video never loads
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000);

      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        const fileType = getFileType(uploadFile.file);
        const fileName = `${Date.now()}-${uploadFile.file.name}`;
        const filePath = `uploads/${fileName}`;

        // Generate thumbnail for videos before upload
        let thumbnailUrl: string | null = null;
        if (fileType === "video") {
          const thumbnailBlob = await generateVideoThumbnail(uploadFile.file);
          if (thumbnailBlob) {
            const thumbnailPath = `thumbnails/${Date.now()}-${uploadFile.file.name.replace(/\.[^/.]+$/, "")}.jpg`;
            const { error: thumbUploadError } = await supabase.storage
              .from("media-library")
              .upload(thumbnailPath, thumbnailBlob, { contentType: "image/jpeg" });

            if (!thumbUploadError) {
              const { data: thumbUrlData } = supabase.storage
                .from("media-library")
                .getPublicUrl(thumbnailPath);
              thumbnailUrl = thumbUrlData.publicUrl;
            }
          }
        }

        const { error: uploadError } = await supabase.storage
          .from("media-library")
          .upload(filePath, uploadFile.file);

        if (uploadError) throw uploadError;

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress: 100 } : f
          )
        );

        const { data: urlData } = supabase.storage
          .from("media-library")
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from("content_files")
          .insert({
            file_url: urlData.publicUrl,
            file_type: fileType,
            original_filename: uploadFile.file.name,
            file_size_bytes: uploadFile.file.size,
            tags: tags.length > 0 ? tags : null,
            source: "upload",
            brand: brand,
            content_category: contentCategory,
            thumbnail_url: thumbnailUrl,
          });

        if (insertError) throw insertError;

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mobile Camera/Gallery Buttons */}
          {isMobile && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-6 h-6" />
                <span className="text-sm">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => galleryInputRef.current?.click()}
              >
                <FolderOpen className="w-6 h-6" />
                <span className="text-sm">Choose File</span>
              </Button>
              
              {/* Hidden inputs for camera and gallery */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                className="hidden"
                onChange={handleGallerySelect}
              />
            </div>
          )}

          {/* Dropzone - Full on desktop, compact on mobile */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            } ${isMobile ? "p-4" : "p-8"}`}
          >
            <input {...getInputProps()} />
            <Upload className={`mx-auto text-muted-foreground mb-2 ${isMobile ? "w-8 h-8" : "w-10 h-10"}`} />
            <p className="font-medium text-sm sm:text-base">
              {isDragActive ? "Drop files here" : isMobile ? "Or drag & drop files" : "Drag & drop files here"}
            </p>
            {!isMobile && (
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • Images, Videos, Audio
              </p>
            )}
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
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      {uploadFile.status === "uploading" && (
                        <Progress value={uploadFile.progress} className="h-1 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {uploadFile.status === "complete" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {uploadFile.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
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

          {/* Brand Selector */}
          <div className="space-y-2">
            <Label>Brand</Label>
            <div className="flex flex-wrap gap-2">
              {[
{ id: "wpw", label: "WePrintWraps" },
{ id: "ghost", label: "Ghost Industries" },
{ id: "wraptv", label: "WrapTV" },
{ id: "inkandedge", label: "Ink & Edge" },
{ id: "snap", label: "Snap Thats a Wrap" },
{ id: "vinylvixen", label: "VinylVixenWraps" },
{ id: "rjthewrapper", label: "RJ The Wrapper" },
{ id: "bapewrap", label: "BapeWrap" },
{ id: "fadewrap", label: "FadeWrap" },
{ id: "commercialwrap", label: "Commercial Wrap" },
{ id: "restylewrap", label: "Restyle Wrap" },
              ].map((b) => (
                <Button
                  key={b.id}
                  type="button"
                  variant={brand === b.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrand(b.id)}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "raw", label: "Raw" },
                { id: "template", label: "Template" },
                { id: "finished", label: "Finished" },
                { id: "inspiration", label: "Inspiration" },
              ].map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={contentCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContentCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="h-10"
              />
              <Button variant="outline" onClick={addTag} className="h-10">
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="h-11">
              {allComplete ? "Done" : "Cancel"}
            </Button>
            {!allComplete && (
              <Button onClick={uploadFiles} disabled={!hasFiles || isUploading} className="h-11">
                {isUploading ? "Uploading..." : `Upload ${files.length} File(s)`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}