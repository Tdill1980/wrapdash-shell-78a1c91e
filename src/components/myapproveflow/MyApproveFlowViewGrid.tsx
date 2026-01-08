// ============================================
// MyApproveFlow View Grid - Read Only Image Display with Download
// ============================================

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZoomIn, CheckCircle, Image as ImageIcon, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ProofView {
  id: string;
  view_key: string;
  label: string;
  image_url: string;
}

interface MyApproveFlowViewGridProps {
  views: ProofView[];
  isApproved: boolean;
}

const VIEW_ORDER = ["front", "driver", "passenger", "rear", "top", "three_quarter"];

// Download image helper
const downloadImage = async (imageUrl: string, label: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`Downloaded ${label}`);
  } catch (error) {
    console.error("Download error:", error);
    toast.error("Failed to download image");
  }
};

// Share image helper
const shareImage = async (imageUrl: string, label: string) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${label} - Vehicle Wrap Design`,
        text: `Check out this wrap design - ${label}`,
        url: imageUrl
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        // Fallback to clipboard
        await navigator.clipboard.writeText(imageUrl);
        toast.success("Link copied to clipboard");
      }
    }
  } else {
    // Fallback to clipboard
    await navigator.clipboard.writeText(imageUrl);
    toast.success("Link copied to clipboard");
  }
};

export function MyApproveFlowViewGrid({ views, isApproved }: MyApproveFlowViewGridProps) {
  const [enlargedView, setEnlargedView] = useState<ProofView | null>(null);

  // Sort views by standard order
  const sortedViews = [...views].sort((a, b) => {
    const aIndex = VIEW_ORDER.indexOf(a.view_key);
    const bIndex = VIEW_ORDER.indexOf(b.view_key);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Design Views
          </CardTitle>
          {isApproved && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Approved
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {sortedViews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Design views are being prepared...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sortedViews.map((view) => (
                <div key={view.id} className="group relative">
                  <button
                    onClick={() => setEnlargedView(view)}
                    className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:border-primary transition-colors cursor-pointer"
                  >
                    <img
                      src={view.image_url}
                      alt={view.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-sm font-medium">{view.label}</p>
                    </div>
                  </button>
                  {/* Quick download button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(view.image_url, view.label);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    title="Download"
                  >
                    <Download className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlarge Dialog with Download/Share */}
      <Dialog open={!!enlargedView} onOpenChange={() => setEnlargedView(null)}>
        <DialogContent className="max-w-5xl bg-card border-border">
          <DialogTitle className="text-foreground">
            {enlargedView?.label}
          </DialogTitle>
          {enlargedView && (
            <div className="mt-4 space-y-4">
              <img
                src={enlargedView.image_url}
                alt={enlargedView.label}
                className="w-full h-auto rounded-lg"
              />
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => downloadImage(enlargedView.image_url, enlargedView.label)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareImage(enlargedView.image_url, enlargedView.label)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Download or share this view on social media to promote your wrap
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
