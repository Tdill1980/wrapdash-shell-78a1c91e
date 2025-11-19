import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check } from "lucide-react";

const tones = [
  {
    id: "installer",
    label: "Pro Installer Tone",
    description: "Direct, technical, and professional",
    sample: "Your wrap is engineered using premium film with maximum adhesion and durability. We'll have your vehicle completed within 3-5 business days.",
  },
  {
    id: "luxury",
    label: "Luxury Auto Spa Tone",
    description: "Smooth, elevated, and refined",
    sample: "Experience the elevated finish your vehicle deserves. Our master craftsmen will transform your ride with precision and artistry.",
  },
  {
    id: "hype",
    label: "Hype Restyler Tone",
    description: "Aggressive, energetic, high-conviction",
    sample: "🔥 Your ride is about to break necks. Let's lock this in and get you flexing on the streets. We're talking full send, zero compromise.",
  },
];

export default function ToneStyles() {
  const [selected, setSelected] = useState("installer");

  return (
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
              
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-foreground">{tone.label}</h3>
                <p className="text-sm text-muted-foreground">{tone.description}</p>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg border border-white/5">
                <p className="text-sm text-muted-foreground italic">"{tone.sample}"</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
