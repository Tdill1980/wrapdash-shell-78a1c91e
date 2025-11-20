import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";
import { emailTones } from "@/lib/mightymail-tones";
import { EmailPreviewDialog } from "./EmailPreviewDialog";

const tones = Object.values(emailTones).map(tone => ({
  id: tone.id,
  label: tone.label,
  description: tone.description,
  sample: tone.bodyParagraphs[0],
  fullBody: tone.bodyParagraphs.join(" "),
  closing: tone.closing,
}));

export default function ToneStyles() {
  const [selected, setSelected] = useState("installer");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTone, setPreviewTone] = useState("");

  const handlePreview = (toneId: string) => {
    setPreviewTone(toneId);
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
        tone={previewTone}
      />
    
    <Card className="bg-[#16161E] border-[rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-foreground">Writing Tone Presets</CardTitle>
        <CardDescription>
          Select the voice and personality for your MightyMail campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tones.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelected(tone.id)}
              className={`relative w-full p-6 rounded-xl border-2 transition-all text-left ${
                selected === tone.id
                  ? "border-[#00AFFF] bg-[#00AFFF]/10"
                  : "border-[rgba(255,255,255,0.06)] bg-[#101016] hover:border-[#00AFFF]/50"
              }`}
            >
              {selected === tone.id && (
                <Check className="absolute top-6 right-6 text-[#00AFFF]" size={20} />
              )}
              
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{tone.label}</h3>
                  <p className="text-sm text-muted-foreground">{tone.description}</p>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(tone.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                >
                  <ExternalLink size={14} />
                  View Online
                </Button>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg border border-white/5">
                <p className="text-sm text-muted-foreground italic">"{tone.sample}"</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
