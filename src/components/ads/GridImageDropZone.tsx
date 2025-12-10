import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Wand2, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface GridImageDropZoneProps {
  cellCount: number;
  images: (string | null)[];
  onImagesChange: (images: (string | null)[]) => void;
  onAutoFill?: () => void;
  disabled?: boolean;
}

export function GridImageDropZone({
  cellCount,
  images,
  onImagesChange,
  onAutoFill,
  disabled,
}: GridImageDropZoneProps) {
  const gridCols = cellCount === 9 ? 3 : 4;

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[], dropIndex?: number) => {
      if (fileRejections.length > 0) {
        toast.error("Invalid file type. Please upload images only.");
        return;
      }

      const newImages = [...images];
      
      acceptedFiles.forEach((file, i) => {
        const url = URL.createObjectURL(file);
        
        if (typeof dropIndex === "number") {
          // Single cell drop
          newImages[dropIndex] = url;
        } else {
          // Bulk drop - fill empty slots
          const emptyIndex = newImages.findIndex((img, idx) => !img && idx >= i);
          if (emptyIndex !== -1) {
            newImages[emptyIndex] = url;
          } else {
            // Fill from start if all filled
            const targetIndex = i % cellCount;
            newImages[targetIndex] = url;
          }
        }
      });

      onImagesChange(newImages);
    },
    [images, cellCount, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files, rejections) => onDrop(files, rejections),
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    disabled,
    noClick: true,
  });

  const handleCellClick = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const newImages = [...images];
        newImages[index] = URL.createObjectURL(file);
        onImagesChange(newImages);
      }
    };
    input.click();
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    onImagesChange(newImages);
  };

  const handleClearAll = () => {
    onImagesChange(Array(cellCount).fill(null));
  };

  const filledCount = images.filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Grid Images</span>
          <span className="text-xs text-muted-foreground">
            ({filledCount}/{cellCount} filled)
          </span>
        </div>
        <div className="flex gap-2">
          {onAutoFill && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoFill}
              disabled={disabled}
              className="gap-1"
            >
              <Wand2 className="w-3 h-3" />
              Auto-Fill
            </Button>
          )}
          {filledCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="gap-1 text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Drop Zone Container */}
      <div
        {...getRootProps()}
        className={cn(
          "relative p-2 rounded-xl border-2 border-dashed transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted hover:border-muted-foreground/30"
        )}
      >
        <input {...getInputProps()} />

        {/* Drag overlay */}
        {isDragActive && (
          <div className="absolute inset-0 bg-primary/10 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-primary">Drop images here</p>
            </div>
          </div>
        )}

        {/* Grid of cells */}
        <div
          className="gap-2"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          }}
        >
          {Array.from({ length: cellCount }).map((_, index) => (
            <ImageCell
              key={index}
              index={index}
              imageUrl={images[index]}
              onClick={() => handleCellClick(index)}
              onRemove={(e) => handleRemoveImage(index, e)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Bulk upload hint */}
        {filledCount === 0 && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Drag & drop multiple images or click each cell to upload
          </p>
        )}
      </div>
    </div>
  );
}

interface ImageCellProps {
  index: number;
  imageUrl: string | null;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

function ImageCell({ index, imageUrl, onClick, onRemove, disabled }: ImageCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative aspect-square rounded-lg border-2 transition-all overflow-hidden group",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        imageUrl
          ? "border-transparent"
          : "border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={`Grid cell ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Remove button */}
          <button
            onClick={onRemove}
            className={cn(
              "absolute top-1 right-1 w-5 h-5 rounded-full",
              "bg-black/60 hover:bg-destructive text-white",
              "flex items-center justify-center transition-all",
              "opacity-0 group-hover:opacity-100"
            )}
          >
            <X className="w-3 h-3" />
          </button>
          {/* Cell number */}
          <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
            {index + 1}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <ImagePlus className="w-5 h-5 mb-1" />
          <span className="text-[10px]">{index + 1}</span>
        </div>
      )}
    </button>
  );
}
