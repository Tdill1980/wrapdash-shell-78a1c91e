// ============================================
// BrandedViewOverlay — Locked Co-Branding for Enlarged Views
// ============================================
// This component renders persistent branding overlay on enlarged view images.
// Branding structure: "WrapCommandAI™ for [Tenant]" / "ApproveFlow™"
// This is pure CSS/HTML - never AI-generated.

import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BrandedViewOverlayProps {
  imageUrl: string;
  label: string;
  orderNumber: string;
  brandLine1?: string; // e.g., "WrapCommandAI™ for WPW"
  brandLine2?: string; // e.g., "ApproveFlow™"
  onDownload?: () => void;
  showActions?: boolean;
}

// Default branding (locked to WPW for now)
const DEFAULT_BRAND_LINE_1 = "WrapCommandAI™ for WPW";
const DEFAULT_BRAND_LINE_2 = "ApproveFlow™";

export function BrandedViewOverlay({
  imageUrl,
  label,
  orderNumber,
  brandLine1 = DEFAULT_BRAND_LINE_1,
  brandLine2 = DEFAULT_BRAND_LINE_2,
  onDownload,
  showActions = true,
}: BrandedViewOverlayProps) {
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${label} - Vehicle Wrap Design`,
          text: `Check out this wrap design - ${label}`,
          url: imageUrl
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(imageUrl);
          toast.success("Link copied to clipboard");
        }
      }
    } else {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="relative w-full">
      {/* Main Image */}
      <img
        src={imageUrl}
        alt={label}
        className="w-full h-auto rounded-lg"
      />
      
      {/* Top-Left Branding Overlay (Locked) */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm">
        <p className="text-xs font-semibold text-black leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {brandLine1}
        </p>
        <p className="text-[10px] text-black/80 leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {brandLine2}
        </p>
      </div>
      
      {/* Bottom-Right Order Number Overlay */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm">
        <p className="text-xs font-medium text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          Order #{orderNumber}
        </p>
      </div>
      
      {/* View Label - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-md">
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      
      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 flex gap-3 justify-center">
          {onDownload && (
            <Button onClick={onDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      )}
      
      <p className="text-xs text-center text-muted-foreground mt-2">
        Download or share this view on social media to promote your wrap
      </p>
    </div>
  );
}
