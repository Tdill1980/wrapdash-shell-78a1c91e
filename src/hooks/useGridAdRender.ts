import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GridRenderParams {
  templateId: string;
  gridSize: "3x3" | "4x4";
  searchBarText: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  imageUrls: string[];
  brand: "wpw" | "restylepro";
  outputSize: "1080x1080" | "1080x1350" | "1080x1920";
  organizationId?: string;
}

export interface GridRenderResult {
  success: boolean;
  renderId?: string;
  status?: string;
  url?: string;
  preview?: boolean;
  layout?: {
    width: number;
    height: number;
    gridSize: string;
    cellCount: number;
    elements?: any[];
    colors?: any;
  };
  error?: string;
}

export function useGridAdRender() {
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GridRenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRender = useCallback(async (params: GridRenderParams): Promise<GridRenderResult | null> => {
    setRendering(true);
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("render-grid-ad", {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setProgress(30);

      if (!data.success) {
        throw new Error(data.error || "Render failed");
      }

      // If preview mode (no Creatomate key), return immediately
      if (data.preview) {
        setProgress(100);
        setResult(data);
        toast.success("Preview generated");
        return data;
      }

      // Poll for render completion
      if (data.renderId) {
        const finalResult = await pollRenderStatus(data.renderId);
        setResult(finalResult);
        return finalResult;
      }

      // Direct URL returned
      if (data.url) {
        setProgress(100);
        setResult(data);
        toast.success("Grid ad rendered successfully");
        return data;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Render failed";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setRendering(false);
    }
  }, []);

  const pollRenderStatus = async (renderId: string): Promise<GridRenderResult> => {
    const creatomateApiKey = import.meta.env.VITE_CREATOMATE_API_KEY;
    
    // Poll every 2 seconds for up to 60 seconds
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      setProgress(30 + (attempts / maxAttempts) * 60);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        // Check status via edge function or direct API
        const { data, error } = await supabase.functions.invoke("render-grid-ad", {
          body: { action: "status", renderId },
        });

        if (error) continue;

        if (data.status === "succeeded" && data.url) {
          setProgress(100);
          toast.success("Grid ad rendered successfully");
          return { success: true, url: data.url, status: "succeeded" };
        }

        if (data.status === "failed") {
          throw new Error("Render failed");
        }
      } catch (e) {
        // Continue polling on error
      }
    }

    throw new Error("Render timed out");
  };

  const reset = useCallback(() => {
    setRendering(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    startRender,
    rendering,
    progress,
    result,
    error,
    reset,
  };
}
