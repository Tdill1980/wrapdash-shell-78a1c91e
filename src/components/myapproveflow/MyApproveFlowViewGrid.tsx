// ============================================
// MyApproveFlow View Grid - Read Only Image Display
// ============================================

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, CheckCircle, Image as ImageIcon } from "lucide-react";

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
                <button
                  key={view.id}
                  onClick={() => setEnlargedView(view)}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:border-primary transition-colors cursor-pointer"
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlarge Dialog */}
      <Dialog open={!!enlargedView} onOpenChange={() => setEnlargedView(null)}>
        <DialogContent className="max-w-5xl bg-card border-border">
          <DialogTitle className="text-foreground">
            {enlargedView?.label}
          </DialogTitle>
          {enlargedView && (
            <div className="mt-4">
              <img
                src={enlargedView.image_url}
                alt={enlargedView.label}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
