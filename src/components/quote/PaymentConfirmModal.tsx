import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Package, AlertCircle } from "lucide-react";

interface PaymentConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  isPaid: boolean;
  onSuccess?: (result: {
    order_number: string;
    shopflow_order_id: string;
    approveflow_project_id?: string;
  }) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Other" },
];

export function PaymentConfirmModal({
  open,
  onOpenChange,
  quoteId,
  isPaid,
  onSuccess,
}: PaymentConfirmModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await lovableFunctions.functions.invoke("convert-quote-to-order", {
        body: {
          quote_id: quoteId,
          payment_method: paymentMethod,
          payment_notes: paymentNotes || undefined,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to convert quote");
      }

      toast({
        title: "Order Created!",
        description: `Order ${data.order_number} has been created successfully`,
      });

      onSuccess?.({
        order_number: data.order_number,
        shopflow_order_id: data.shopflow_order_id,
        approveflow_project_id: data.approveflow_project_id,
      });

      // Reset form
      setPaymentMethod("");
      setPaymentNotes("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process payment";
      console.error("Payment processing error:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPaid ? (
              <>
                <Package className="w-5 h-5 text-blue-500" />
                Convert to Order
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 text-green-500" />
                Mark as Paid & Convert
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isPaid
              ? "Convert this paid quote into a ShopFlow order."
              : "Confirm payment and automatically create a ShopFlow order."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes (Optional)</Label>
            <Textarea
              id="payment-notes"
              placeholder="Transaction ID, reference number, or other notes..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-muted-foreground">
                <p className="font-medium text-foreground">What happens next:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Order number will be generated (MQ-XXXXXX)</li>
                  <li>• ShopFlow order will be created automatically</li>
                  <li>• Customer will receive confirmation email</li>
                  <li>• If no artwork uploaded, customer will be asked to submit files</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !paymentMethod}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Confirm & Create Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
