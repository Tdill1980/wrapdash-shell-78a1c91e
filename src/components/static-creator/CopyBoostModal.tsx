import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Check } from "lucide-react";
import { supabase, lovableFunctions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FORMULA_OPTIONS, type CopyFormula } from "@/lib/copywriting-formulas";

interface CopyBoostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawHeadline: string;
  rawBody?: string;
  rawCta?: string;
  onBoosted: (result: {
    headline: string;
    primary_text: string;
    cta: string;
    hook_variations?: string[];
  }) => void;
}

const BUYER_PERSONAS = [
  { id: "wrap_shop", label: "Wrap Shop Owner", emoji: "🏪" },
  { id: "fleet_manager", label: "Fleet Manager", emoji: "🚛" },
  { id: "consumer", label: "Consumer", emoji: "🚗" },
  { id: "general", label: "General Business", emoji: "💼" },
];

export function CopyBoostModal({
  open,
  onOpenChange,
  rawHeadline,
  rawBody,
  rawCta,
  onBoosted,
}: CopyBoostModalProps) {
  const [selectedFormula, setSelectedFormula] = useState<CopyFormula>("sabri");
  const [selectedPersona, setSelectedPersona] = useState("wrap_shop");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    headline: string;
    primary_text: string;
    cta: string;
    hook_variations?: string[];
  } | null>(null);

  const handleBoost = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await lovableFunctions.functions.invoke("ai-boost-copy", {
        body: {
          rawHeadline,
          rawBody,
          rawCta,
          formula: selectedFormula,
          buyerPersona: selectedPersona,
          productContext: "vehicle wraps and graphics",
        },
      });

      if (error) throw error;

      if (data?.success && data?.boosted) {
        setResult(data.boosted);
        toast.success(`Copy enhanced with ${selectedFormula.toUpperCase()} framework!`);
      } else {
        throw new Error(data?.error || "Failed to boost copy");
      }
    } catch (err) {
      console.error("Copy boost failed:", err);
      toast.error("Failed to enhance copy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onBoosted(result);
      onOpenChange(false);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Copy Boost
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview of raw copy */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="text-muted-foreground text-xs mb-1">Your copy:</div>
            <div className="font-medium">{rawHeadline}</div>
            {rawBody && <div className="text-muted-foreground mt-1">{rawBody}</div>}
          </div>

          {/* Formula Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose Framework</Label>
            <RadioGroup
              value={selectedFormula}
              onValueChange={(v) => setSelectedFormula(v as CopyFormula)}
              className="grid grid-cols-2 gap-2"
            >
              {FORMULA_OPTIONS.map((formula) => (
                <div key={formula.id}>
                  <RadioGroupItem
                    value={formula.id}
                    id={formula.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={formula.id}
                    className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                  >
                    <span className="text-lg">{formula.emoji}</span>
                    <div>
                      <div className="font-medium text-sm">{formula.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {formula.description}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Buyer Persona */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Target Buyer</Label>
            <div className="flex flex-wrap gap-2">
              {BUYER_PERSONAS.map((persona) => (
                <Button
                  key={persona.id}
                  variant={selectedPersona === persona.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPersona(persona.id)}
                  className="gap-1.5"
                >
                  <span>{persona.emoji}</span>
                  {persona.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Result Preview */}
          {result && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <Sparkles className="w-4 h-4" />
                Enhanced Copy
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Headline</div>
                <div className="font-semibold">{result.headline}</div>
              </div>
              {result.primary_text && (
                <div>
                  <div className="text-xs text-muted-foreground">Body</div>
                  <div className="text-sm">{result.primary_text}</div>
                </div>
              )}
              {result.cta && (
                <div>
                  <div className="text-xs text-muted-foreground">CTA</div>
                  <div className="text-sm font-medium">{result.cta}</div>
                </div>
              )}
              {result.hook_variations && result.hook_variations.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">Alt Hooks</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.hook_variations.map((hook, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-muted rounded-full"
                      >
                        {hook}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!result ? (
              <Button
                onClick={handleBoost}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Boost with {FORMULA_OPTIONS.find(f => f.id === selectedFormula)?.name}
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleBoost}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Try Again"
                  )}
                </Button>
                <Button onClick={handleApply} className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  Apply This Copy
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
