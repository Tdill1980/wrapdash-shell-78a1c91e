import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Film, Images, MessageSquare, Megaphone, Layers } from "lucide-react";
import type { ContentAtom, MicroContent } from "@/hooks/useContentAtomizer";

interface AtomGeneratorPanelProps {
  atom: ContentAtom | null;
  isGenerating: boolean;
  onGenerate: (atom: ContentAtom, format: string, style: string) => Promise<void>;
}

const formats = [
  { id: "story", label: "Story", icon: <Film className="w-4 h-4" /> },
  { id: "reel_script", label: "Reel Script", icon: <Film className="w-4 h-4" /> },
  { id: "caption", label: "Caption", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "paid_ad", label: "Paid Ad", icon: <Megaphone className="w-4 h-4" /> },
  { id: "carousel_slide", label: "Carousel", icon: <Layers className="w-4 h-4" /> },
];

const styles = [
  { id: "clean", label: "Clean", description: "Professional & clear" },
  { id: "sabri", label: "Sabri Suby", description: "Urgency & direct response" },
  { id: "dara", label: "Dara Denney", description: "UGC storytelling" },
];

export function AtomGeneratorPanel({ atom, isGenerating, onGenerate }: AtomGeneratorPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState("caption");
  const [selectedStyle, setSelectedStyle] = useState("clean");

  if (!atom) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Select an atom to generate content</p>
          <p className="text-sm mt-1">Click on any atom from the list</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Generate Content
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Atom Preview */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {atom.atom_type}
            </Badge>
            {atom.product_match && (
              <Badge variant="secondary" className="text-[10px]">
                📦 {atom.product_match}
              </Badge>
            )}
          </div>
          <p className="text-sm line-clamp-3">
            {atom.processed_text || atom.original_text}
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Output Format
          </label>
          <div className="flex flex-wrap gap-2">
            {formats.map((format) => (
              <Button
                key={format.id}
                variant={selectedFormat === format.id ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setSelectedFormat(format.id)}
              >
                {format.icon}
                <span className="ml-1.5">{format.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Creative Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((style) => (
              <button
                key={style.id}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all",
                  selectedStyle === style.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="text-sm font-medium">{style.label}</div>
                <div className="text-[10px] text-muted-foreground">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full bg-gradient-to-r from-primary to-primary/80"
          disabled={isGenerating}
          onClick={() => onGenerate(atom, selectedFormat, selectedStyle)}
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {formats.find(f => f.id === selectedFormat)?.label}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
