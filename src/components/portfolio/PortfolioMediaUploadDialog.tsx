import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortfolioMedia } from "@/hooks/usePortfolioJobs";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, Trash, Loader2, Image as ImageIcon } from "lucide-react";

interface PortfolioMediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  onSuccess: () => void;
}

type MediaType = "before" | "after" | "process";

export function PortfolioMediaUploadDialog({
  open,
  onOpenChange,
  jobId,
  onSuccess,
}: PortfolioMediaUploadDialogProps) {
  const { media, loading, uploadMedia, deleteMedia, getPublicUrl } = usePortfolioMedia(jobId);
  const [activeType, setActiveType] = useState<MediaType>("before");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!jobId) return;

      setIsUploading(true);
      for (const file of acceptedFiles) {
        await uploadMedia(file, activeType);
      }
      setIsUploading(false);
    },
    [jobId, activeType, uploadMedia]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    multiple: true,
  });

  const beforeMedia = media.filter((m) => m.media_type === "before");
  const afterMedia = media.filter((m) => m.media_type === "after");
  const processMedia = media.filter((m) => m.media_type === "process");

  const currentMedia =
    activeType === "before"
      ? beforeMedia
      : activeType === "after"
      ? afterMedia
      : processMedia;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Upload Media
          </DialogTitle>
        </DialogHeader>

        {/* Media Type Tabs */}
        <div className="flex gap-2 border-b border-border pb-4">
          {(["before", "after", "process"] as MediaType[]).map((type) => {
            const count =
              type === "before"
                ? beforeMedia.length
                : type === "after"
                ? afterMedia.length
                : processMedia.length;
            return (
              <Button
                key={type}
                variant={activeType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType(type)}
                className="capitalize"
              >
                {type} Photos
                {count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drop {activeType} photos here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPEG, PNG, WebP, MP4, MOV
              </p>
            </div>
          )}
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : currentMedia.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {currentMedia.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                {item.file_type === "video" ? (
                  <video
                    src={getPublicUrl(item.storage_path)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={getPublicUrl(item.storage_path)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Delete button on hover */}
                <button
                  onClick={() => deleteMedia(item.id, item.storage_path)}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash className="w-4 h-4" />
                </button>

                {/* Type badge */}
                <Badge
                  variant="secondary"
                  className="absolute bottom-2 left-2 text-xs capitalize"
                >
                  {item.file_type}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {activeType} photos uploaded yet</p>
          </div>
        )}

        {/* Done Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={onSuccess}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
