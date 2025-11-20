import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";
import { EmailPreviewDialog } from "./EmailPreviewDialog";

const themes = [
  {
    id: "clean",
    name: "Clean",
    description: "White background with green accents. Professional and approachable.",
    colors: ["#FFFFFF", "#22C55E", "#F9FAFB"],
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Black and gold theme. Premium and sophisticated.",
    colors: ["#0A0A0F", "#D4AF37", "#1A1A1F"],
  },
  {
    id: "performance",
    name: "Performance",
    description: "Dark with neon blue accents. Technical and energetic.",
    colors: ["#0A0A0F", "#00AFFF", "#4EEAFF"],
  },
];

export default function EmailStyles() {
  const [selected, setSelected] = useState("performance");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState("");

  const handlePreview = (themeId: string) => {
    setPreviewTheme(themeId);
    setPreviewOpen(true);
  };

  // Sample quote data for preview
  const sampleQuoteData = {
    customerName: "John Smith",
    vehicleYear: "2023",
    vehicleMake: "Ford",
    vehicleModel: "Bronco",
    productName: "Full Wrap",
    sqft: 250,
    materialCost: 1500,
    laborCost: 2000,
    total: 3500,
    portalUrl: "#",
  };

  return (
    <>
      <EmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        quoteData={sampleQuoteData}
        design={previewTheme}
      />
    
    <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-foreground">Email Design Styles</CardTitle>
        <CardDescription>
          Choose a visual theme for your MightyMail campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelected(theme.id)}
              className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                selected === theme.id
                  ? "border-[#00AFFF] bg-[#00AFFF]/10"
                  : "border-[rgba(255,255,255,0.06)] bg-[#101016] hover:border-[#00AFFF]/50"
              }`}
            >
              {selected === theme.id && (
                <Check className="absolute top-4 right-4 text-[#00AFFF]" size={20} />
              )}
              
              <h3 className="text-lg font-semibold text-foreground mb-2">{theme.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{theme.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {theme.colors.map((color) => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(theme.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                >
                  <ExternalLink size={14} />
                  View Online
                </Button>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
