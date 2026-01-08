// ============================================
// MyApproveFlow View Grid - Read Only Image Display with Download
// ============================================

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, CheckCircle, Image as ImageIcon, Download } from "lucide-react";
import { BrandedViewOverlay } from "@/components/approveflow/BrandedViewOverlay";
import { downloadBrandedImage } from "@/lib/branded-image-download";

interface ProofView {
  id: string;
  view_key: string;
  label: string;
  image_url: string;
}

interface MyApproveFlowViewGridProps {
  views: ProofView[];
  isApproved: boolean;
  orderNumber?: string;
  brandLine1?: string;
  brandLine2?: string;
}

const VIEW_ORDER = ["front", "driver", "passenger", "rear", "top", "three_quarter"];

export function MyApproveFlowViewGrid({ 
  views, 
  isApproved,
  orderNumber = "",
  brandLine1 = "WrapCommandAI™ for WPW",
  brandLine2 = "ApproveFlow™",
}: MyApproveFlowViewGridProps) {
  const [enlargedView, setEnlargedView] = useState<ProofView | null>(null);

  // Sort views by standard order
  const sortedViews = [...views].sort((a, b) => {
    const aIndex = VIEW_ORDER.indexOf(a.view_key);
    const bIndex = VIEW_ORDER.indexOf(b.view_key);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  const handleDownload = (imageUrl: string, label: string) => {
    if (orderNumber) {
      downloadBrandedImage(imageUrl, orderNumber, label, { line1: brandLine1, line2: brandLine2 });
    }
  };

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
                      handleDownload(view.image_url, view.label);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    title="Download with branding"
                  >
                    <Download className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlarge Dialog with Branding Overlay */}
      <Dialog open={!!enlargedView} onOpenChange={() => setEnlargedView(null)}>
        <DialogContent className="max-w-5xl bg-card border-border">
          <DialogTitle className="sr-only">
            {enlargedView?.label || "View"}
          </DialogTitle>
          {enlargedView && (
            <BrandedViewOverlay
              imageUrl={enlargedView.image_url}
              label={enlargedView.label}
              orderNumber={orderNumber}
              brandLine1={brandLine1}
              brandLine2={brandLine2}
              onDownload={() => handleDownload(enlargedView.image_url, enlargedView.label)}
              showActions={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
