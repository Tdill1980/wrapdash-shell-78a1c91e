import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Package, Check, Loader2, Upload } from "lucide-react";
import { PaymentConfirmModal } from "./PaymentConfirmModal";
import { ArtworkUploadZone } from "./ArtworkUploadZone";

interface QuoteActionButtonsProps {
  quoteId: string;
  isPaid: boolean;
  paidAt?: string | null;
  paymentMethod?: string | null;
  shopflowOrderId?: string | null;
  artworkFiles?: Array<{ name: string; url: string; size: number }>;
  onPaymentComplete?: (result: {
    order_number: string;
    shopflow_order_id: string;
    approveflow_project_id?: string;
  }) => void;
  onArtworkUpload?: (files: Array<{ name: string; url: string; size: number }>) => void;
}

export function QuoteActionButtons({
  quoteId,
  isPaid,
  paidAt,
  paymentMethod,
  shopflowOrderId,
  artworkFiles = [],
  onPaymentComplete,
  onArtworkUpload,
}: QuoteActionButtonsProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showArtworkUpload, setShowArtworkUpload] = useState(false);

  const isConverted = Boolean(shopflowOrderId);

  return (
    <div className="space-y-4">
      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        {isPaid ? (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
            <Check className="w-3 h-3 mr-1" />
            Paid {paymentMethod && `via ${paymentMethod}`}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/40">
            Awaiting Payment
          </Badge>
        )}

        {isConverted ? (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
            <Package className="w-3 h-3 mr-1" />
            Order Created
          </Badge>
        ) : isPaid ? (
          <Badge variant="outline" className="text-muted-foreground">
            Ready to Convert
          </Badge>
        ) : null}

        {artworkFiles.length > 0 && (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40">
            <Upload className="w-3 h-3 mr-1" />
            {artworkFiles.length} file{artworkFiles.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Artwork Upload Section */}
      {!isConverted && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArtworkUpload(!showArtworkUpload)}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {artworkFiles.length > 0 ? 'Manage Artwork Files' : 'Upload Artwork'}
          </Button>

          {showArtworkUpload && (
            <ArtworkUploadZone
              quoteId={quoteId}
              existingFiles={artworkFiles}
              onFilesChange={onArtworkUpload}
            />
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isPaid && !isConverted && (
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Mark as Paid & Convert
          </Button>
        )}

        {isPaid && !isConverted && (
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
          >
            <Package className="w-4 h-4 mr-2" />
            Convert to Order
          </Button>
        )}

        {isConverted && (
          <Button variant="outline" disabled className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Order Created
          </Button>
        )}
      </div>

      {/* Info Text */}
      {!isPaid && !isConverted && (
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Order number will be generated when marked as paid
        </p>
      )}

      {paidAt && (
        <p className="text-xs text-muted-foreground text-center">
          Paid on {new Date(paidAt).toLocaleDateString()}
        </p>
      )}

      {/* Payment Modal */}
      <PaymentConfirmModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        quoteId={quoteId}
        isPaid={isPaid}
        onSuccess={(result) => {
          setShowPaymentModal(false);
          onPaymentComplete?.(result);
        }}
      />
    </div>
  );
}
