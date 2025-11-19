import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { renderEmailTemplate } from "@/lib/mightymail-tones";
import { Loader2 } from "lucide-react";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteData: any;
}

export function EmailPreviewDialog({ open, onOpenChange, quoteData }: EmailPreviewDialogProps) {
  const [tone, setTone] = useState("installer");
  const [design, setDesign] = useState("performance");
  const [previewHTML, setPreviewHTML] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && quoteData) {
      generatePreview();
    }
  }, [open, tone, design, quoteData]);

  function generatePreview() {
    setLoading(true);
    try {
      const html = renderEmailTemplate(tone, design, {
        customer_name: quoteData.customerName || "Valued Customer",
        vehicle_year: quoteData.vehicleYear,
        vehicle_make: quoteData.vehicleMake,
        vehicle_model: quoteData.vehicleModel,
        product_name: quoteData.productName,
        sqft: quoteData.sqft,
        material_cost: quoteData.materialCost,
        labor_cost: quoteData.laborCost,
        quote_total: quoteData.total,
        portal_url: quoteData.portalUrl || "#",
        footer_text: "Professional vehicle wrap solutions.",
      });
      setPreviewHTML(html);
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">Email Preview</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Writing Tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="installer">Pro Installer</SelectItem>
                <SelectItem value="luxury">Luxury Auto Spa</SelectItem>
                <SelectItem value="hype">Hype Restyler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">Design Style</label>
            <Select value={design} onValueChange={setDesign}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-[rgba(255,255,255,0.06)] rounded-lg bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <iframe
              srcDoc={previewHTML}
              className="w-full h-full border-0"
              title="Email Preview"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            className="bg-gradient-to-r from-[#00AFFF] to-[#4EEAFF] text-white"
            onClick={() => {
              // Copy HTML to clipboard
              navigator.clipboard.writeText(previewHTML);
            }}
          >
            Copy HTML
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
