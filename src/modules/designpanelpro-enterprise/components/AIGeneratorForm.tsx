import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AIGeneratorFormProps {
  onGenerate: (prompt: string, style: string) => Promise<void>;
  isLoading: boolean;
}

export function AIGeneratorForm({ onGenerate, isLoading }: AIGeneratorFormProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("commercial");

  const styles = [
    "Commercial",
    "Trades",
    "Food Truck", 
    "HVAC",
    "Plumbing",
    "Landscaping",
    "Corporate",
    "Restyle",
    "Anime",
    "Luxury",
    "Off-road"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await onGenerate(prompt, style);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">AI Panel Generator</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="style">Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger id="style" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {styles.map((s) => (
                <SelectItem key={s.toLowerCase()} value={s.toLowerCase()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="prompt">Design Prompt</Label>
          <Input
            id="prompt"
            placeholder="e.g. Bold red and black flames, aggressive racing stripes..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-2"
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Generate Panel Design
        </Button>
      </div>
    </Card>
  );
}
