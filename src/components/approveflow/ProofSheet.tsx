import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { formatShortDate } from "@/lib/timezone-utils";

interface ProofSheetProps {
  project: {
    customer_name: string;
    order_number: string;
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
  onDownloadPdf?: () => void;
  onDownloadZip?: () => void;
}

const VIEW_ORDER = [
  { type: "driver_side", label: "Driver Side" },
  { type: "passenger_side", label: "Passenger Side" },
  { type: "front", label: "Front View" },
  { type: "rear", label: "Rear View" },
  { type: "hero_3_4", label: "3/4 Hero Angle" },
];

export default function ProofSheet({ project, assets, onDownloadPdf, onDownloadZip }: ProofSheetProps) {
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

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">
              <span className="text-white">AI </span>
              <span className="text-gradient">Proof Sheet</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Multi-view preview for customer approval
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onDownloadPdf && (
              <Button variant="outline" size="sm" onClick={onDownloadPdf} className="text-xs">
                <FileDown className="w-3 h-3 mr-1" />
                PDF
              </Button>
            )}
            {onDownloadZip && (
              <Button variant="outline" size="sm" onClick={onDownloadZip} className="text-xs">
                <Download className="w-3 h-3 mr-1" />
                ZIP
              </Button>
            )}
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
                <div className="relative group overflow-hidden rounded-lg border border-border">
                  <img
                    src={asset.file_url}
                    alt={label}
                    className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                  />
                  <a 
                    href={asset.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
                  >
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      View Full Size
                    </span>
                  </a>
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
  );
}
