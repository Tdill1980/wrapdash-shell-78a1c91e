import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DesignStyle = "luxury" | "camo" | "abstract" | "corporate" | "gradient" | "bold" | "custom";

interface DesignRequest {
  organization_id: string;
  contact_id?: string;
  vehicle: {
    year: string;
    make: string;
    model: string;
  };
  style: DesignStyle;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
}

interface DesignConcept {
  design_title: string;
  design_description: string;
  color_palette: string[];
  design_elements: string[];
  ai_message: string;
}

interface DesignResult {
  success: boolean;
  approveflow_id: string;
  order_number: string;
  design_concept: DesignConcept;
  ai_message: string;
  portal_url: string;
}

export function useAIDesignGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [designResult, setDesignResult] = useState<DesignResult | null>(null);

  const generateDesign = async (request: DesignRequest): Promise<DesignResult | null> => {
    setIsGenerating(true);
    setDesignResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-design", {
        body: request,
      });

      if (error) {
        console.error("Design generation error:", error);
        toast.error("Failed to generate design concept");
        return null;
      }

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      setDesignResult(data);
      toast.success("Design concept generated!", {
        description: data.design_concept?.design_title,
      });

      return data;
    } catch (err) {
      console.error("Design generation error:", err);
      toast.error("Failed to generate design");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearResult = () => {
    setDesignResult(null);
  };

  return {
    generateDesign,
    isGenerating,
    designResult,
    clearResult,
  };
}
