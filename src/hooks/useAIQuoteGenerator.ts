import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIQuoteResult {
  sqft: number;
  vehicle_class: string;
  wrap_type: string;
  material_cost: number;
  labor_cost: number;
  labor_hours: number;
  subtotal: number;
  total: number;
  low_price: number;
  high_price: number;
  markup_applied: number;
  ai_message: string;
  generated_at: string;
}

interface Vehicle {
  year: string;
  make: string;
  model: string;
}

export function useAIQuoteGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<AIQuoteResult | null>(null);
  const { toast } = useToast();

  const generateQuote = async (
    vehicle: Vehicle,
    wrapType: string = "color_change",
    sqftOverride?: number,
    organizationId?: string
  ): Promise<AIQuoteResult | null> => {
    if (!vehicle.year || !vehicle.make || !vehicle.model) {
      toast({
        title: "Missing Vehicle Info",
        description: "Please enter vehicle year, make, and model first",
        variant: "destructive",
      });
      return null;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-quote", {
        body: {
          organization_id: organizationId,
          vehicle,
          wrap_type: wrapType,
          sqft_override: sqftOverride,
        },
      });

      if (error) throw error;

      setLastResult(data);
      
      toast({
        title: "AI Quote Generated",
        description: data.ai_message,
      });

      return data;
    } catch (error: any) {
      console.error("AI Quote Generation Error:", error);
      toast({
        title: "Quote Generation Failed",
        description: error.message || "Could not generate AI quote",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateQuote,
    isGenerating,
    lastResult,
    clearResult: () => setLastResult(null),
  };
}
