import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Instagram, Globe, Loader2 } from "lucide-react";

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  product_name?: string;
  sqft?: number;
  material_cost?: number;
  labor_cost?: number;
  total_price: number;
  status: string;
  source?: string;
  source_message?: string;
  ai_message?: string;
}

interface QuoteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onSave: () => void;
}

// WPW Pricing - $5.27/sqft
const WPW_PRICE_PER_SQFT = 5.27;

export function QuoteEditDialog({ open, onOpenChange, quote, onSave }: QuoteEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customer_name: quote.customer_name || "",
    customer_email: quote.customer_email || "",
    customer_phone: quote.customer_phone || "",
    vehicle_year: quote.vehicle_year || "",
    vehicle_make: quote.vehicle_make || "",
    vehicle_model: quote.vehicle_model || "",
    product_name: quote.product_name || "Avery MPI 1105 EGRS with DOL 1460Z Lamination",
    sqft: quote.sqft || 0,
    status: quote.status || "pending",
  });

  // Calculate price from sqft
  const calculatedPrice = Math.round(formData.sqft * WPW_PRICE_PER_SQFT * 100) / 100;

  const getSourceIcon = (source?: string) => {
    switch (source?.toLowerCase()) {
      case "instagram":
        return <Instagram className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "website_chat":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          vehicle_year: formData.vehicle_year,
          vehicle_make: formData.vehicle_make,
          vehicle_model: formData.vehicle_model,
          product_name: formData.product_name,
          sqft: formData.sqft,
          material_cost: calculatedPrice,
          total_price: calculatedPrice,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.id);

      if (error) throw error;

      toast({
        title: "Quote Updated",
        description: "Quote has been saved successfully",
      });

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating quote:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const originalMessage = quote.source_message || quote.ai_message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Quote: {quote.quote_number}
          </DialogTitle>
        </DialogHeader>

        {/* Source Message Section */}
        {originalMessage && (
          <div className="bg-muted/50 rounded-lg p-4 border border-border mb-4">
            <div className="flex items-center gap-2 mb-2">
              {getSourceIcon(quote.source)}
              <span className="text-sm font-medium">Original Request</span>
              {quote.source && (
                <Badge variant="outline" className="text-xs">
                  {quote.source}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {originalMessage}
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {/* Customer Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Customer Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="customer_name">Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Vehicle Information</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="vehicle_year">Year</Label>
                <Input
                  id="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_make">Make</Label>
                <Input
                  id="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                  placeholder="Ford"
                />
              </div>
              <div>
                <Label htmlFor="vehicle_model">Model</Label>
                <Input
                  id="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  placeholder="F-150"
                />
              </div>
            </div>
          </div>

          {/* Product & Pricing */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Product & Pricing</h4>
            <div>
              <Label htmlFor="product_name">Product</Label>
              <Select
                value={formData.product_name}
                onValueChange={(value) => setFormData({ ...formData, product_name: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avery MPI 1105 EGRS with DOL 1460Z Lamination">
                    Avery MPI 1105 EGRS + Lamination ($5.27/sqft)
                  </SelectItem>
                  <SelectItem value="3M IJ180Cv3 with 8518 Lamination">
                    3M IJ180Cv3 + Lamination ($5.27/sqft)
                  </SelectItem>
                  <SelectItem value="Window Perf with Lamination">
                    Window Perf + Lamination ($5.27/sqft)
                  </SelectItem>
                  <SelectItem value="Contour Cut Graphics">
                    Contour Cut Graphics ($5.27/sqft)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  type="number"
                  value={formData.sqft}
                  onChange={(e) => setFormData({ ...formData, sqft: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Total Price</Label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
                  <span className="text-lg font-bold text-primary">
                    ${calculatedPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formData.sqft} sqft × $5.27)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}