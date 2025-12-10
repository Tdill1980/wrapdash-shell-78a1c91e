import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Sparkles, Check } from "lucide-react";
import type { ContentAtom } from "@/hooks/useContentAtomizer";

interface AtomListProps {
  atoms: ContentAtom[];
  selectedAtom: ContentAtom | null;
  onSelect: (atom: ContentAtom) => void;
  onDelete: (atomId: string) => void;
}

const atomTypeColors: Record<string, string> = {
  faq: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pricing: "bg-green-500/20 text-green-400 border-green-500/30",
  feature: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  benefit: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  testimonial: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  objection: "bg-red-500/20 text-red-400 border-red-500/30",
  hook: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  cta: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  pain_point: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  script: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  idea: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  caption: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  ad_copy: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export function AtomList({ atoms, selectedAtom, onSelect, onDelete }: AtomListProps) {
  if (atoms.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No atoms yet</p>
        <p className="text-sm mt-1">Upload content to generate atoms</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {atoms.map((atom) => {
        const isSelected = selectedAtom?.id === atom.id;
        const typeColor = atomTypeColors[atom.atom_type] || atomTypeColors.idea;

        return (
          <Card
            key={atom.id}
            className={cn(
              "p-3 cursor-pointer transition-all hover:border-primary/50",
              isSelected && "border-primary ring-1 ring-primary/20"
            )}
            onClick={() => onSelect(atom)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge variant="outline" className={cn("text-[10px] uppercase", typeColor)}>
                    {atom.atom_type}
                  </Badge>
                  {atom.is_used && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Check className="w-3 h-3 mr-0.5" /> Used
                    </Badge>
                  )}
                  {atom.product_match && (
                    <Badge variant="outline" className="text-[10px]">
                      📦 {atom.product_match}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm line-clamp-2">
                  {atom.processed_text || atom.original_text}
                </p>

                {atom.ad_angles && atom.ad_angles.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {atom.ad_angles.slice(0, 3).map((angle) => (
                      <span
                        key={angle}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {angle}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(atom);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (atom.id) onDelete(atom.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
