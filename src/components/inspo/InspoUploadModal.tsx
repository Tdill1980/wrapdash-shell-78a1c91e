import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Image, Video, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<unknown>;
  isUploading: boolean;
}

export function InspoUploadModal({ open, onOpenChange, onUpload, isUploading }: InspoUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    setUploadedCount(0);
    setUploadProgress(0);
    
    for (let i = 0; i < files.length; i++) {
      await onUpload(files[i]);
      setUploadedCount(i + 1);
      setUploadProgress(((i + 1) / files.length) * 100);
    }
    
    setFiles([]);
    onOpenChange(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) {
      return <Video className="w-4 h-4 text-purple-500" />;
    }
    return <Image className="w-4 h-4 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Inspiration
          </DialogTitle>
          <DialogDescription>
            Upload your Canva ads, reels, or any content for AI style analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            {isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="font-medium">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse • Images & Videos up to 100MB
                </p>
              </>
            )}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                >
                  {getFileIcon(file)}
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                Uploading {uploadedCount} of {files.length} files...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadAll} 
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload {files.length} {files.length === 1 ? "File" : "Files"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
