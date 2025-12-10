// src/hooks/useStaticAdRender.ts

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface RenderResult {
  render_id: string;
  status: "pending" | "rendering" | "succeeded" | "failed";
  progress: number;
  url: string | null;
  error: string | null;
}

export function useStaticAdRender() {
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (renderId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "render-static-ad",
        {
          body: { action: "status", render_id: renderId },
        }
      );

      if (fnError) throw fnError;

      const status = data.status;
      const prog = data.progress || 0;

      setProgress(prog);
      setResult({
        render_id: renderId,
        status,
        progress: prog,
        url: data.url,
        error: data.error,
      });

      if (status === "succeeded") {
        stopPolling();
        setRendering(false);
        toast.success("Static ad rendered successfully!");
        return true;
      }

      if (status === "failed") {
        stopPolling();
        setRendering(false);
        setError(data.error || "Render failed");
        toast.error("Render failed: " + (data.error || "Unknown error"));
        return true;
      }

      return false;
    } catch (e) {
      console.error("Poll error:", e);
      return false;
    }
  }, [stopPolling]);

  const startRender = useCallback(
    async ({
      mode,
      templateId,
      aspectRatio,
      headline,
      cta,
      mediaUrl,
      layoutJson,
      brandColors,
    }: {
      mode: "template" | "ai" | "grid";
      templateId?: string;
      aspectRatio: string;
      headline?: string;
      cta?: string;
      mediaUrl?: string;
      layoutJson?: Record<string, unknown>;
      brandColors?: string[];
    }) => {
      setLoading(true);
      setRendering(true);
      setProgress(0);
      setError(null);
      setResult(null);
      stopPolling();

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "render-static-ad",
          {
            body: {
              action: "start",
              mode,
              template_id: templateId,
              aspect_ratio: aspectRatio,
              headline,
              cta,
              media_url: mediaUrl,
              layout_json: layoutJson,
              brand_colors: brandColors,
            },
          }
        );

        if (fnError) throw fnError;
        if (!data.success) throw new Error(data.error || "Failed to start render");

        const renderId = data.render_id;
        setResult({
          render_id: renderId,
          status: "pending",
          progress: 0,
          url: null,
          error: null,
        });

        // Start polling every 2 seconds
        pollingRef.current = setInterval(() => {
          pollStatus(renderId);
        }, 2000);

        // Initial poll
        await pollStatus(renderId);

        return renderId;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("Start render error:", msg);
        setError(msg);
        setRendering(false);
        toast.error("Failed to start render");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [pollStatus, stopPolling]
  );

  const reset = useCallback(() => {
    stopPolling();
    setLoading(false);
    setRendering(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return {
    startRender,
    reset,
    loading,
    rendering,
    progress,
    result,
    error,
  };
}
