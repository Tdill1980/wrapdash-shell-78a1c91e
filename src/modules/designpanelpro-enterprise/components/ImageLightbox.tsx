import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface ImageLightboxProps {
  imageUrl: string;
  title?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, title, open, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "design"}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <h3 className="text-white font-medium">{title || "Image Preview"}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="text-white hover:bg-white/20 min-w-[60px]"
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-8 pt-16"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <img
              src={imageUrl}
              alt={title || "Preview"}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
