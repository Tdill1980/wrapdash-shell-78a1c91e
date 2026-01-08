// ============================================
// MyApproveFlow History - Customer Original Request & Uploads
// ============================================
// Shows the customer their original request with timestamps
// for single source of truth and dispute resolution

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Clock } from "lucide-react";
import { format } from "date-fns";

interface CustomerAsset {
  id: string;
  file_url: string;
  original_filename: string | null;
  uploaded_at: string | null;
  file_type: string | null;
}

interface MyApproveFlowHistoryProps {
  designInstructions: string | null;
  productType: string | null;
  projectCreatedAt: string | null;
  customerAssets: CustomerAsset[];
}

export function MyApproveFlowHistory({
  designInstructions,
  productType,
  projectCreatedAt,
  customerAssets
}: MyApproveFlowHistoryProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    try {
      return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "Unknown date";
    }
  };

  const hasContent = designInstructions || customerAssets.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Your Original Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Info */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span>Submitted: {formatDate(projectCreatedAt)}</span>
          </div>
          {productType && (
            <p className="text-sm">
              <span className="text-muted-foreground">Product: </span>
              <span className="font-medium text-foreground">{productType}</span>
            </p>
          )}
        </div>

        {/* Design Instructions */}
        {designInstructions && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Design Instructions</h4>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {designInstructions}
              </p>
            </div>
          </div>
        )}

        {/* Customer Uploads */}
        {customerAssets.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Files You Uploaded
            </h4>
            <div className="space-y-2">
              {customerAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    {asset.file_type?.startsWith("image") ? (
                      <img
                        src={asset.file_url}
                        alt={asset.original_filename || "Upload"}
                        className="h-10 w-10 rounded object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border border-border">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {asset.original_filename || "Uploaded file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(asset.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Source of Truth Notice */}
        <div className="text-xs text-muted-foreground bg-muted/20 rounded p-3 border border-border">
          <p className="font-medium mb-1">📋 Single Source of Truth</p>
          <p>
            This is a complete record of your original request and uploads with timestamps. 
            Use this to verify what was submitted and when.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
