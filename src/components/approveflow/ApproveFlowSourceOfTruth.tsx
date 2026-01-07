// ============================================
// ApproveFlow OS — Source of Truth Panel (Zone 2)
// ============================================
// OS RULES:
// 1. WooCommerce data is canonical — READ ONLY
// 2. Customer Instructions displayed verbatim
// 3. Files show actual filename, not generic type
// 4. Timestamps show exact ingestion time
// 5. This data is IMMUTABLE — UI never edits it
// ============================================

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Lock, FileText, Download, ExternalLink, Clock } from "lucide-react";
import { formatFullDateTime, formatShortDate, formatTimeOnly } from "@/lib/timezone-utils";

// OS-TRUE file role labels
const FILE_ROLE_LABELS: Record<string, string> = {
  'customer_upload': 'Customer file',
  'customer_logo': 'Logo',
  'customer_brand_guide': 'Brand guide',
  'customer_design_file': 'Design file',
  'customer_inspiration': 'Inspiration',
  'designer_2d_proof': '2D Proof',
  'designer_3d_render': '3D Render',
  'final_approval_proof': 'Approval PDF',
  // Legacy fallbacks
  'reference': 'Customer file',
  'logo': 'Logo',
  'example': 'Example',
};

interface Asset {
  id: string;
  file_url: string;
  file_type: string;
  original_filename?: string;
  source?: string;
  created_at: string;
}

interface ApproveFlowSourceOfTruthProps {
  orderNumber: string;
  orderCreatedAt: string;
  designInstructions?: string;
  assets: Asset[];
}

export function ApproveFlowSourceOfTruth({
  orderNumber,
  orderCreatedAt,
  designInstructions,
  assets,
}: ApproveFlowSourceOfTruthProps) {
  // Filter to only customer-uploaded files (from WooCommerce)
  const customerAssets = assets.filter(a => a.source === 'woocommerce');

  // Get human-readable label for file type
  const getFileLabel = (fileType: string) => {
    return FILE_ROLE_LABELS[fileType] || 'File';
  };

  // Get file extension from URL or filename
  const getFileExtension = (asset: Asset) => {
    const filename = asset.original_filename || asset.file_url;
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  return (
    <Card className="p-4 bg-card border-border">
      {/* Header with lock icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wide">
            Source of Truth — Order Intake
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] border-muted-foreground/30 text-muted-foreground">
          READ ONLY
        </Badge>
      </div>

      {/* Source + Timestamp */}
      <div className="flex items-center gap-2 mb-4 text-[10px] text-muted-foreground">
        <Badge variant="secondary" className="text-[9px] bg-muted/50">
          Source: WooCommerce Order #{orderNumber}
        </Badge>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatFullDateTime(orderCreatedAt)}
        </span>
      </div>

      {/* Customer Instructions Section */}
      <div className="mb-4">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Customer Instructions
        </h4>
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          {designInstructions && designInstructions.trim().length > 0 ? (
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {designInstructions}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No instructions were provided at checkout.
            </p>
          )}
        </div>
      </div>

      {/* Customer Uploaded Files Section */}
      <div>
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Customer Uploaded Files
        </h4>
        
        {customerAssets.length > 0 ? (
          <div className="space-y-2">
            {customerAssets.map((asset) => (
              <div 
                key={asset.id}
                className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {asset.original_filename || getFileLabel(asset.file_type)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {getFileLabel(asset.file_type)} • {getFileExtension(asset)} • Uploaded {formatTimeOnly(asset.created_at)} {formatShortDate(asset.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* View button */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      {asset.file_url.match(/\.(pdf)$/i) ? (
                        <iframe 
                          src={asset.file_url} 
                          className="w-full h-[80vh]" 
                          title={asset.original_filename || 'Document'}
                        />
                      ) : (
                        <img 
                          src={asset.file_url} 
                          alt={asset.original_filename || 'Customer file'} 
                          className="w-full h-auto" 
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {/* Download button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-[10px]"
                    asChild
                  >
                    <a href={asset.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/20 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground italic">
              No files were uploaded at checkout.
            </p>
          </div>
        )}
      </div>

      {/* Immutable Footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[9px] text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>This data is immutable — sourced directly from WooCommerce order</span>
      </div>
    </Card>
  );
}
