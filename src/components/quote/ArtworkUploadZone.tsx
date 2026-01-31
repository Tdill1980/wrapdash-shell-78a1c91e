import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, X, File, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtworkFile {
  name: string;
  url: string;
  size: number;
}

interface ArtworkUploadZoneProps {
  quoteId: string;
  existingFiles?: ArtworkFile[];
  onFilesChange?: (files: ArtworkFile[]) => void;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/postscript': ['.ai', '.eps'],
  'image/vnd.adobe.photoshop': ['.psd'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/svg+xml': ['.svg'],
  'application/zip': ['.zip'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function ArtworkUploadZone({
  quoteId,
  existingFiles = [],
  onFilesChange,
}: ArtworkUploadZoneProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<ArtworkFile[]>(existingFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const newFiles: ArtworkFile[] = [];

    for (const file of acceptedFiles) {
      try {
        // Initialize progress for this file
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Upload to Supabase storage
        const filePath = `quote-artwork/${quoteId}/${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('media-library')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media-library')
          .getPublicUrl(data.path);

        const newFile: ArtworkFile = {
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
        };

        newFiles.push(newFile);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);

      // Update quote in database
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          artwork_files: updatedFiles as unknown as Record<string, unknown>[],
          artwork_status: 'uploaded',
        } as Record<string, unknown>)
        .eq('id', quoteId);

      if (updateError) {
        console.error('Failed to update quote with files:', updateError);
      }

      onFilesChange?.(updatedFiles);

      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`,
      });
    }

    setIsUploading(false);
    setUploadProgress({});
  }, [quoteId, files, onFilesChange, toast]);

  const removeFile = async (fileToRemove: ArtworkFile) => {
    const updatedFiles = files.filter(f => f.url !== fileToRemove.url);
    setFiles(updatedFiles);

    // Update quote in database
    const { error } = await supabase
      .from('quotes')
      .update({
        artwork_files: updatedFiles as unknown as Record<string, unknown>[],
        artwork_status: updatedFiles.length > 0 ? 'uploaded' : 'none',
      } as Record<string, unknown>)
      .eq('id', quoteId);

    if (error) {
      console.error('Failed to update quote:', error);
    }

    onFilesChange?.(updatedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop artwork files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, AI, EPS, PSD, PNG, JPG, SVG • Max 50MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Uploaded Files ({files.length})
          </p>
          <div className="space-y-1">
            {files.map((file, index) => (
              <div
                key={`${file.url}-${index}`}
                className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-md"
              >
              <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-1">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="truncate">{fileName}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
