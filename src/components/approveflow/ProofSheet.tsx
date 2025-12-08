import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, Loader2, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatShortDate } from "@/lib/timezone-utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProofSheetProps {
  project: {
    id: string;
    customer_name: string;
    order_number: string;
    current_version?: number;
    vehicle_info?: {
      year?: string;
      make?: string;
      model?: string;
    };
    design_instructions?: string;
    created_at?: string;
  };
  assets: Array<{
    id: string;
    file_url: string;
    file_type?: string;
    view_type?: string;
    sort_order?: number;
    created_at?: string;
  }>;
}

const VIEW_ORDER = [
  { type: "driver_side", label: "Driver Side" },
  { type: "passenger_side", label: "Passenger Side" },
  { type: "front", label: "Front View" },
  { type: "rear", label: "Rear View" },
  { type: "hero_3_4", label: "3/4 Hero Angle" },
];

export default function ProofSheet({ project, assets }: ProofSheetProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter assets that have view_type set (multi-view mockups)
  const proofAssets = assets.filter(a => a.view_type);
  
  // Sort by sort_order or by VIEW_ORDER
  const sortedAssets = proofAssets.sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order;
    }
    const aIndex = VIEW_ORDER.findIndex(v => v.type === a.view_type);
    const bIndex = VIEW_ORDER.findIndex(v => v.type === b.view_type);
    return aIndex - bIndex;
  });

  // If no multi-view assets, don't render
  if (sortedAssets.length === 0) {
    return null;
  }

  const vehicleInfo = project.vehicle_info;
  const vehicleString = vehicleInfo 
    ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
    : 'Vehicle';

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('approveflow-export-pdf', {
        body: { project_id: project.id }
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No PDF URL returned");

      // Open PDF in new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "PDF Generated",
        description: "Your proof sheet PDF is ready for download.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      const { data, error } = await supabase.functions.invoke('approveflow-export-zip', {
        body: { project_id: project.id }
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No ZIP URL returned");

      // Download ZIP
      window.open(data.url, '_blank');
      
      toast({
        title: "ZIP Created",
        description: `${data.asset_count} images packaged for download.`,
      });
    } catch (error) {
      console.error("ZIP export error:", error);
      toast({
        title: "Export Failed",
        description: "Unable to create ZIP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <>
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">
                <span className="text-white">AI </span>
                <span className="text-gradient">Proof Sheet</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Multi-view preview for customer approval • Version {project.current_version || 1}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="text-xs"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <FileDown className="w-3 h-3 mr-1" />
                )}
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className="text-xs"
              >
                {isExportingZip ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Download className="w-3 h-3 mr-1" />
                )}
                ZIP
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer & Vehicle Info Header */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="text-foreground font-medium">{project.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="text-foreground font-medium">{vehicleString}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order #:</span>
              <span className="text-foreground font-medium">{project.order_number}</span>
            </div>
            {project.created_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span className="text-foreground font-medium">{formatShortDate(project.created_at)}</span>
              </div>
            )}
          </div>

          {/* Design Instructions */}
          {project.design_instructions && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary mb-1">Design Instructions</p>
              <p className="text-sm text-foreground/80 whitespace-pre-line">
                {project.design_instructions}
              </p>
            </div>
          )}

          {/* Multi-View Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedAssets.map((asset) => {
              const viewConfig = VIEW_ORDER.find(v => v.type === asset.view_type);
              const label = viewConfig?.label || asset.view_type?.replace(/_/g, ' ').toUpperCase() || 'View';
              
              return (
                <div key={asset.id} className="space-y-2">
                  <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">
                    {label}
                  </p>
                  <div 
                    className="relative group overflow-hidden rounded-lg border border-border cursor-pointer"
                    onClick={() => setLightboxImage(asset.file_url)}
                  >
                    <img
                      src={asset.file_url}
                      alt={label}
                      className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signature Section */}
          <div className="border-t border-border pt-4 mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Customer Approval</h4>
            <p className="text-xs text-muted-foreground">
              By signing or replying "Approved" in writing, you confirm the artwork is correct and ready for production.
            </p>
            <div className="h-12 border-b border-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Signature & Date</p>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
